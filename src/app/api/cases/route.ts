import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

// GET /api/cases - List user's cases
export async function GET(request: Request) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = requireDb();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const cases = await db.case.findMany({
      where: {
        userId: user.id,
        ...(status && { status: status as "ACTIVE" | "PENDING_SEND" | "SENT" | "CLOSED" }),
      },
      include: {
        property: {
          include: {
            jurisdiction: true,
          },
        },
        tenants: true,
        ruleSet: true,
        _count: {
          select: {
            deductions: true,
            documents: true,
            attachments: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: limit,
    });

    return NextResponse.json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create a new case
export async function POST(request: Request) {
  try {
    console.log("[API CASES POST] Creating new case...");
    const user = await getDbUser();
    console.log("[API CASES POST] User ID:", user?.id || "NO USER", "Email:", user?.email || "N/A");
    if (!user) {
      console.log("[API CASES POST] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = requireDb();
    const body = await request.json();

    const {
      propertyId,
      leaseStartDate,
      leaseEndDate,
      moveOutDate,
      depositAmount,
      tenants,
    } = body;

    // Validate required fields
    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    if (!moveOutDate) {
      return NextResponse.json(
        { error: "Move-out date is required" },
        { status: 400 }
      );
    }

    if (depositAmount === undefined || depositAmount === null || isNaN(Number(depositAmount))) {
      return NextResponse.json(
        { error: "Valid deposit amount is required" },
        { status: 400 }
      );
    }

    if (!tenants || !Array.isArray(tenants) || tenants.length === 0) {
      return NextResponse.json(
        { error: "At least one tenant is required" },
        { status: 400 }
      );
    }

    if (!tenants[0]?.name) {
      return NextResponse.json(
        { error: "Tenant name is required" },
        { status: 400 }
      );
    }

    // Get the property with its jurisdiction
    const property = await db.property.findUnique({
      where: { id: propertyId, userId: user.id },
      include: {
        jurisdiction: {
          include: {
            ruleSets: {
              where: { effectiveDate: { lte: new Date() } },
              orderBy: { effectiveDate: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: `Property not found: ${propertyId}` },
        { status: 404 }
      );
    }

    const ruleSet = property.jurisdiction.ruleSets[0];
    if (!ruleSet) {
      return NextResponse.json(
        { error: `No rules found for jurisdiction: ${property.jurisdiction.state} ${property.jurisdiction.city || ''}` },
        { status: 400 }
      );
    }

    // Calculate due date based on move-out date and rules
    const moveOut = new Date(moveOutDate);
    const dueDate = new Date(moveOut);
    dueDate.setDate(dueDate.getDate() + ruleSet.returnDeadlineDays);

    // Calculate deposit interest if required by jurisdiction
    let depositInterest = 0;
    if (ruleSet.interestRequired && ruleSet.interestRate) {
      const leaseStart = new Date(leaseStartDate);
      const leaseEnd = new Date(leaseEndDate);
      // Calculate lease duration in years (fractional)
      const leaseDurationMs = leaseEnd.getTime() - leaseStart.getTime();
      const leaseDurationYears = leaseDurationMs / (1000 * 60 * 60 * 24 * 365);
      // Interest = deposit * rate * years
      depositInterest = Number(depositAmount) * Number(ruleSet.interestRate) * leaseDurationYears;
      // Round to 2 decimal places
      depositInterest = Math.round(depositInterest * 100) / 100;
    }

    // Create the case with tenants
    const newCase = await db.case.create({
      data: {
        userId: user.id,
        propertyId,
        ruleSetId: ruleSet.id,
        leaseStartDate: new Date(leaseStartDate),
        leaseEndDate: new Date(leaseEndDate),
        moveOutDate: moveOut,
        depositAmount,
        depositInterest,
        dueDate,
        status: "ACTIVE",
        tenants: {
          create: tenants.map((t: { name: string; email?: string; phone?: string; forwardingAddress?: string }, index: number) => ({
            name: t.name,
            email: t.email,
            phone: t.phone,
            forwardingAddress: t.forwardingAddress,
            isPrimary: index === 0,
          })),
        },
        // Create default checklist items
        checklistItems: {
          create: [
            { label: "Review jurisdiction rules", sortOrder: 1 },
            { label: "Calculate deductions", sortOrder: 2 },
            { label: "Upload evidence for deductions", sortOrder: 3 },
            { label: "Generate itemized statement", sortOrder: 4 },
            { label: "Generate notice letter", sortOrder: 5 },
            { label: "Send to tenant(s)", sortOrder: 6, blocksExport: true },
            { label: "Record proof of delivery", sortOrder: 7 },
          ],
        },
        // Create initial audit event
        auditEvents: {
          create: {
            action: "case_created",
            description: "Case created",
            userId: user.id,
          },
        },
      },
      include: {
        property: true,
        tenants: true,
        ruleSet: {
          include: {
            citations: true,
            penalties: true,
          },
        },
      },
    });

    console.log("[API CASES POST] Case created successfully:", newCase.id, "for user:", newCase.userId);
    return NextResponse.json(newCase, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating case:", error);
    // Return more specific error message for debugging
    const err = error as { message?: string; code?: string; stack?: string };
    const errorMessage = err?.message || "Failed to create case";
    const errorCode = err?.code || "UNKNOWN";
    return NextResponse.json(
      {
        error: `Failed to create case: ${errorMessage}`,
        code: errorCode,
        details: process.env.NODE_ENV === "development" ? err?.stack : undefined
      },
      { status: 500 }
    );
  }
}
