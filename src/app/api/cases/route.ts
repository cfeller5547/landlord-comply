import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/cases - List user's cases
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
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
        ...(status && { status: status as any }),
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
    const user = await getCurrentUser();
    if (!user) {
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
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const ruleSet = property.jurisdiction.ruleSets[0];
    if (!ruleSet) {
      return NextResponse.json(
        { error: "No rules found for this jurisdiction" },
        { status: 400 }
      );
    }

    // Calculate due date based on move-out date and rules
    const moveOut = new Date(moveOutDate);
    const dueDate = new Date(moveOut);
    dueDate.setDate(dueDate.getDate() + ruleSet.returnDeadlineDays);

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
        dueDate,
        status: "ACTIVE",
        tenants: {
          create: tenants.map((t: any, index: number) => ({
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

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    );
  }
}
