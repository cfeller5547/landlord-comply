import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

interface ExposureCalculation {
  depositAmount: number;
  totalDeductions: number;
  refundAmount: number;
  daysUntilDeadline: number;
  isOverdue: boolean;

  // Penalty exposure
  penalties: {
    condition: string;
    potentialPenalty: string;
    calculatedAmount: number | null;
    likelihood: "LOW" | "MEDIUM" | "HIGH";
  }[];

  // Risk factors
  riskFactors: {
    category: string;
    issue: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
  }[];

  // Summary
  minExposure: number;
  maxExposure: number;
  citations: { code: string; title: string | null; url: string | null }[];
}

// GET /api/cases/[id]/exposure - Calculate penalty exposure for a case
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;
    const db = requireDb();

    // Fetch case with all related data
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
      include: {
        property: {
          include: { jurisdiction: true },
        },
        ruleSet: {
          include: {
            penalties: true,
            citations: true,
          },
        },
        deductions: true,
        tenants: true,
        documents: true,
        checklistItems: {
          where: { blocksExport: true, completed: false },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const depositAmount = Number(caseData.depositAmount);
    const totalDeductions = caseData.deductions.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    );
    const refundAmount = depositAmount - totalDeductions;

    // Calculate days until deadline
    const now = new Date();
    const dueDate = new Date(caseData.dueDate);
    const daysUntilDeadline = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isOverdue = daysUntilDeadline < 0;

    // Calculate penalties based on jurisdiction rules
    const penalties: ExposureCalculation["penalties"] = [];

    for (const penalty of caseData.ruleSet.penalties) {
      let calculatedAmount: number | null = null;
      let likelihood: "LOW" | "MEDIUM" | "HIGH" = "LOW";

      // Parse penalty and calculate potential amount
      const penaltyText = penalty.penalty.toLowerCase();

      if (penaltyText.includes("2x") || penaltyText.includes("double")) {
        calculatedAmount = depositAmount * 2;
      } else if (penaltyText.includes("3x") || penaltyText.includes("triple")) {
        calculatedAmount = depositAmount * 3;
      } else if (penaltyText.includes("1.5x")) {
        calculatedAmount = depositAmount * 1.5;
      } else if (penaltyText.includes("full deposit")) {
        calculatedAmount = depositAmount;
      }

      // Determine likelihood based on case status
      const condition = penalty.condition.toLowerCase();

      if (condition.includes("late") || condition.includes("deadline")) {
        likelihood = isOverdue ? "HIGH" : daysUntilDeadline < 3 ? "MEDIUM" : "LOW";
      } else if (condition.includes("bad faith")) {
        // Bad faith is hard to prove
        likelihood = "LOW";
      } else if (condition.includes("itemiz")) {
        // Check if we have proper itemization
        const hasItemizedStatement = caseData.documents.some(
          (d) => d.type === "ITEMIZED_STATEMENT"
        );
        likelihood = hasItemizedStatement ? "LOW" : "MEDIUM";
      }

      penalties.push({
        condition: penalty.condition,
        potentialPenalty: penalty.penalty,
        calculatedAmount,
        likelihood,
      });
    }

    // Identify risk factors
    const riskFactors: ExposureCalculation["riskFactors"] = [];

    // Deadline risk
    if (isOverdue) {
      riskFactors.push({
        category: "Deadline",
        issue: `Notice is ${Math.abs(daysUntilDeadline)} days overdue`,
        severity: "HIGH",
      });
    } else if (daysUntilDeadline <= 3) {
      riskFactors.push({
        category: "Deadline",
        issue: `Only ${daysUntilDeadline} days remaining until deadline`,
        severity: "MEDIUM",
      });
    }

    // Documentation risks
    const hasNoticeLetter = caseData.documents.some(
      (d) => d.type === "NOTICE_LETTER"
    );
    const hasItemizedStatement = caseData.documents.some(
      (d) => d.type === "ITEMIZED_STATEMENT"
    );

    if (!hasNoticeLetter) {
      riskFactors.push({
        category: "Documentation",
        issue: "Notice letter not yet generated",
        severity: "HIGH",
      });
    }

    if (!hasItemizedStatement && caseData.ruleSet.itemizationRequired) {
      riskFactors.push({
        category: "Documentation",
        issue: "Itemized statement required but not generated",
        severity: "HIGH",
      });
    }

    // Forwarding address risks
    const primaryTenant = caseData.tenants.find((t) => t.isPrimary);
    if (primaryTenant) {
      if (!primaryTenant.forwardingAddress) {
        if (primaryTenant.forwardingAddressStatus === "REQUESTED") {
          riskFactors.push({
            category: "Forwarding Address",
            issue: "Requested but not received - document this in your notice",
            severity: "LOW",
          });
        } else if (primaryTenant.forwardingAddressStatus === "NOT_REQUESTED") {
          riskFactors.push({
            category: "Forwarding Address",
            issue: "No forwarding address - consider requesting one",
            severity: "MEDIUM",
          });
        }
      }
    }

    // Deduction risks
    const highRiskDeductions = caseData.deductions.filter(
      (d) => d.riskLevel === "HIGH"
    );
    const noEvidenceDeductions = caseData.deductions.filter(
      (d) => !d.hasEvidence
    );

    if (highRiskDeductions.length > 0) {
      riskFactors.push({
        category: "Deductions",
        issue: `${highRiskDeductions.length} deduction(s) flagged as high risk`,
        severity: "HIGH",
      });
    }

    if (noEvidenceDeductions.length > 0) {
      riskFactors.push({
        category: "Deductions",
        issue: `${noEvidenceDeductions.length} deduction(s) without supporting evidence`,
        severity: "MEDIUM",
      });
    }

    // Incomplete checklist items
    if (caseData.checklistItems.length > 0) {
      riskFactors.push({
        category: "Checklist",
        issue: `${caseData.checklistItems.length} required item(s) incomplete`,
        severity: "HIGH",
      });
    }

    // Calculate min/max exposure
    const validPenalties = penalties.filter((p) => p.calculatedAmount !== null);
    const minExposure = 0; // Best case: no penalties
    const maxExposure = validPenalties.reduce(
      (sum, p) => sum + (p.calculatedAmount || 0),
      0
    );

    const calculation: ExposureCalculation = {
      depositAmount,
      totalDeductions,
      refundAmount,
      daysUntilDeadline,
      isOverdue,
      penalties,
      riskFactors,
      minExposure,
      maxExposure,
      citations: caseData.ruleSet.citations.map((c) => ({
        code: c.code,
        title: c.title,
        url: c.url,
      })),
    };

    return NextResponse.json(calculation);
  } catch (error) {
    console.error("Error calculating exposure:", error);
    return NextResponse.json(
      { error: "Failed to calculate exposure" },
      { status: 500 }
    );
  }
}
