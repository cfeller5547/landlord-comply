import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

// POST /api/start/complete - Finalize draft case into real case
export async function POST(request: Request) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = requireDb();
    const { draftId } = await request.json();

    if (!draftId) {
      return NextResponse.json(
        { error: "Draft ID is required" },
        { status: 400 }
      );
    }

    // Find the draft case
    const draftCase = await db.draftCase.findUnique({
      where: { id: draftId },
      include: {
        jurisdiction: true,
      },
    });

    if (!draftCase) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }

    if (draftCase.status === "CLAIMED") {
      // Already claimed - return the existing case
      const existingCase = await db.case.findFirst({
        where: {
          userId: user.id,
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingCase) {
        return NextResponse.json({
          success: true,
          caseId: existingCase.id,
          alreadyClaimed: true,
        });
      }
    }

    if (draftCase.status === "EXPIRED" || draftCase.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This draft has expired. Please start a new session." },
        { status: 400 }
      );
    }

    if (!draftCase.jurisdictionId || !draftCase.ruleSetId) {
      return NextResponse.json(
        { error: "Draft is missing jurisdiction data" },
        { status: 400 }
      );
    }

    // Get the rule set
    const ruleSet = await db.ruleSet.findUnique({
      where: { id: draftCase.ruleSetId },
    });

    if (!ruleSet) {
      return NextResponse.json(
        { error: "Rule set not found" },
        { status: 400 }
      );
    }

    // Create property from draft data
    const property = await db.property.create({
      data: {
        userId: user.id,
        address: draftCase.addressRaw,
        city: draftCase.city || "",
        state: draftCase.state || "",
        zipCode: "", // Not collected in draft
        jurisdictionId: draftCase.jurisdictionId,
      },
    });

    // Calculate due date
    const moveOut = new Date(draftCase.moveOutDate);
    const dueDate = new Date(moveOut);
    dueDate.setDate(dueDate.getDate() + ruleSet.returnDeadlineDays);

    // Calculate interest if required
    let depositInterest = 0;
    if (ruleSet.interestRequired && ruleSet.interestRate && draftCase.depositAmount) {
      // Assume 1 year of interest for now (will be refined with lease dates)
      depositInterest = Number(draftCase.depositAmount) * Number(ruleSet.interestRate);
      depositInterest = Math.round(depositInterest * 100) / 100;
    }

    // Create the case
    const newCase = await db.case.create({
      data: {
        userId: user.id,
        propertyId: property.id,
        ruleSetId: draftCase.ruleSetId,
        leaseStartDate: new Date(moveOut.getFullYear() - 1, moveOut.getMonth(), 1), // Default: 1 year before move-out
        leaseEndDate: moveOut,
        moveOutDate: moveOut,
        depositAmount: draftCase.depositAmount || 0,
        depositInterest,
        dueDate,
        status: "ACTIVE",
        // Create default tenant placeholder
        tenants: {
          create: {
            name: "Tenant", // User will update this
            isPrimary: true,
          },
        },
        // Create default checklist items
        checklistItems: {
          create: [
            { label: "Review jurisdiction rules", sortOrder: 1 },
            { label: "Add tenant information", sortOrder: 2, blocksExport: true },
            { label: "Calculate deductions", sortOrder: 3 },
            { label: "Upload evidence for deductions", sortOrder: 4 },
            { label: "Generate itemized statement", sortOrder: 5, blocksExport: true },
            { label: "Generate notice letter", sortOrder: 6, blocksExport: true },
            { label: "Send to tenant(s)", sortOrder: 7 },
            { label: "Record proof of delivery", sortOrder: 8 },
          ],
        },
        // Create audit event
        auditEvents: {
          create: {
            action: "beta_case_created_from_draft",
            description: "Case created from beta entry flow",
            userId: user.id,
            metadata: {
              draftId,
              utmSource: draftCase.utmSource,
              utmCampaign: draftCase.utmCampaign,
              utmMedium: draftCase.utmMedium,
            },
          },
        },
      },
    });

    // Mark draft as claimed
    await db.draftCase.update({
      where: { id: draftId },
      data: {
        status: "CLAIMED",
        claimedByUserId: user.id,
        claimedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      caseId: newCase.id,
    });
  } catch (error) {
    console.error("Error completing draft:", error);
    return NextResponse.json(
      { error: "Failed to complete draft" },
      { status: 500 }
    );
  }
}
