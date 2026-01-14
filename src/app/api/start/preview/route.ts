import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";

// POST /api/start/preview - Generate instant preview for beta flow
export async function POST(request: Request) {
  try {
    const db = requireDb();
    const body = await request.json();

    const {
      addressRaw,
      city,
      state,
      moveOutDate,
      depositAmount,
      utmSource,
      utmCampaign,
      utmMedium,
    } = body;

    // Validate required fields
    if (!addressRaw || !state || !moveOutDate) {
      return NextResponse.json(
        { error: "Address, state, and move-out date are required" },
        { status: 400 }
      );
    }

    const moveOut = new Date(moveOutDate);
    if (isNaN(moveOut.getTime())) {
      return NextResponse.json(
        { error: "Invalid move-out date" },
        { status: 400 }
      );
    }

    // Look up jurisdiction - try city first, then fall back to state
    let jurisdiction = null;

    if (city) {
      jurisdiction = await db.jurisdiction.findFirst({
        where: {
          stateCode: state.toUpperCase(),
          city: { equals: city, mode: "insensitive" },
          isActive: true,
        },
        include: {
          ruleSets: {
            where: { effectiveDate: { lte: new Date() } },
            orderBy: { effectiveDate: "desc" },
            take: 1,
            include: {
              citations: true,
              penalties: true,
            },
          },
        },
      });
    }

    // Fall back to state-level
    if (!jurisdiction) {
      jurisdiction = await db.jurisdiction.findFirst({
        where: {
          stateCode: state.toUpperCase(),
          city: null,
          isActive: true,
        },
        include: {
          ruleSets: {
            where: { effectiveDate: { lte: new Date() } },
            orderBy: { effectiveDate: "desc" },
            take: 1,
            include: {
              citations: true,
              penalties: true,
            },
          },
        },
      });
    }

    if (!jurisdiction || jurisdiction.ruleSets.length === 0) {
      return NextResponse.json(
        {
          error: "Jurisdiction not covered",
          message: `We don't have coverage for ${state}${city ? ` / ${city}` : ""} yet. We're expanding quickly!`,
        },
        { status: 404 }
      );
    }

    const ruleSet = jurisdiction.ruleSets[0];

    // Calculate deadline
    const dueDate = new Date(moveOut);
    dueDate.setDate(dueDate.getDate() + ruleSet.returnDeadlineDays);

    // Calculate days until deadline
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateNormalized = new Date(dueDate);
    dueDateNormalized.setHours(0, 0, 0, 0);
    const daysUntilDeadline = Math.ceil(
      (dueDateNormalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Build checklist based on rules
    const checklist = [
      {
        label: "Complete move-out inspection",
        required: true,
        description: "Document property condition with photos/video",
      },
      {
        label: "Calculate all deductions",
        required: true,
        description: "Itemize repairs, cleaning, and damages with costs",
      },
    ];

    if (ruleSet.itemizationRequired) {
      checklist.push({
        label: "Prepare itemized statement",
        required: true,
        description: ruleSet.itemizationRequirements || "List each deduction with amount and reason",
      });
    }

    if (ruleSet.interestRequired && ruleSet.interestRate) {
      checklist.push({
        label: "Calculate deposit interest",
        required: true,
        description: `Interest at ${Number(ruleSet.interestRate) * 100}% annually is required`,
      });
    }

    if (ruleSet.receiptRequirementThreshold) {
      checklist.push({
        label: "Gather receipts/invoices",
        required: true,
        description: `Receipts required for repairs over $${ruleSet.receiptRequirementThreshold}`,
      });
    }

    checklist.push({
      label: "Generate notice letter",
      required: true,
      description: "Create compliant disposition notice with required language",
    });

    checklist.push({
      label: "Send via approved delivery method",
      required: true,
      description: `Allowed: ${ruleSet.allowedDeliveryMethods.join(", ")}`,
    });

    checklist.push({
      label: "Document proof of delivery",
      required: true,
      description: "Keep tracking number, certified mail receipt, or delivery confirmation",
    });

    // Build preview JSON
    const previewJson = {
      deadline: {
        date: dueDate.toISOString(),
        daysRemaining: daysUntilDeadline,
        deadlineDays: ruleSet.returnDeadlineDays,
        description: ruleSet.returnDeadlineDescription,
      },
      jurisdiction: {
        state: jurisdiction.state,
        stateCode: jurisdiction.stateCode,
        city: jurisdiction.city,
        coverageLevel: jurisdiction.coverageLevel,
      },
      rules: {
        interestRequired: ruleSet.interestRequired,
        interestRate: ruleSet.interestRate ? Number(ruleSet.interestRate) : null,
        itemizationRequired: ruleSet.itemizationRequired,
        maxDepositMonths: ruleSet.maxDepositMonths,
        allowedDeliveryMethods: ruleSet.allowedDeliveryMethods,
      },
      checklist,
      citations: ruleSet.citations.map((c) => ({
        code: c.code,
        title: c.title,
        url: c.url,
      })),
      penalties: ruleSet.penalties.map((p) => ({
        condition: p.condition,
        penalty: p.penalty,
        description: p.description,
      })),
      ruleSetVersion: ruleSet.version,
      lastVerified: ruleSet.verifiedAt.toISOString(),
    };

    // Create draft case
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const draftCase = await db.draftCase.create({
      data: {
        addressRaw,
        city,
        state: state.toUpperCase(),
        moveOutDate: moveOut,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        jurisdictionId: jurisdiction.id,
        ruleSetId: ruleSet.id,
        previewJson,
        utmSource,
        utmCampaign,
        utmMedium,
        status: "PREVIEW_GENERATED",
        expiresAt,
      },
    });

    return NextResponse.json({
      draftId: draftCase.id,
      preview: previewJson,
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
