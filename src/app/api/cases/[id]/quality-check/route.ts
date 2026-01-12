import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

interface QualityCheck {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  severity: "error" | "warning" | "info";
  details?: string;
}

interface QualityCheckResult {
  ready: boolean;
  score: number; // 0-100
  checks: QualityCheck[];
  blockers: QualityCheck[];
  warnings: QualityCheck[];
}

// GET /api/cases/[id]/quality-check - Run quality checks on a case
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
        ruleSet: true,
        tenants: true,
        deductions: true,
        documents: true,
        attachments: true,
        checklistItems: true,
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const checks: QualityCheck[] = [];

    // 1. Move-out date present
    checks.push({
      id: "move_out_date",
      label: "Move-out date",
      description: "Case has a valid move-out date",
      passed: !!caseData.moveOutDate,
      severity: "error",
      details: caseData.moveOutDate
        ? `Move-out: ${new Date(caseData.moveOutDate).toLocaleDateString()}`
        : "No move-out date set",
    });

    // 2. Deadline check
    const now = new Date();
    const dueDate = new Date(caseData.dueDate);
    const daysUntilDeadline = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isOverdue = daysUntilDeadline < 0;

    checks.push({
      id: "deadline_not_missed",
      label: "Deadline status",
      description: "Return deadline has not passed",
      passed: !isOverdue,
      severity: isOverdue ? "error" : "info",
      details: isOverdue
        ? `OVERDUE by ${Math.abs(daysUntilDeadline)} days!`
        : `${daysUntilDeadline} days remaining`,
    });

    // 3. Totals reconcile
    const depositAmount = Number(caseData.depositAmount);
    const depositInterest = Number(caseData.depositInterest || 0);
    const totalDeductions = caseData.deductions.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    );
    const refundAmount = depositAmount + depositInterest - totalDeductions;
    const totalsValid = refundAmount >= 0;

    checks.push({
      id: "totals_reconcile",
      label: "Totals reconcile",
      description: "Deductions do not exceed deposit amount",
      passed: totalsValid,
      severity: "error",
      details: totalsValid
        ? `Deposit: $${depositAmount.toFixed(2)} | Deductions: $${totalDeductions.toFixed(2)} | Refund: $${refundAmount.toFixed(2)}`
        : `Deductions ($${totalDeductions.toFixed(2)}) exceed deposit ($${depositAmount.toFixed(2)})`,
    });

    // 4. Notice letter generated
    const hasNoticeLetter = caseData.documents.some(
      (d) => d.type === "NOTICE_LETTER"
    );
    checks.push({
      id: "notice_letter",
      label: "Notice letter",
      description: "Notice letter has been generated",
      passed: hasNoticeLetter,
      severity: "error",
    });

    // 5. Itemized statement (if required by jurisdiction)
    const hasItemizedStatement = caseData.documents.some(
      (d) => d.type === "ITEMIZED_STATEMENT"
    );
    const itemizationRequired =
      caseData.ruleSet.itemizationRequired && caseData.deductions.length > 0;

    if (itemizationRequired) {
      checks.push({
        id: "itemized_statement",
        label: "Itemized statement",
        description: "Itemized statement generated (required by jurisdiction)",
        passed: hasItemizedStatement,
        severity: "error",
      });
    }

    // 6. Delivery method selected
    checks.push({
      id: "delivery_method",
      label: "Delivery method",
      description: "A delivery method has been selected",
      passed: !!caseData.deliveryMethod,
      severity: "error",
      details: caseData.deliveryMethod
        ? `Method: ${caseData.deliveryMethod}`
        : undefined,
    });

    // 7. Forwarding address status
    const primaryTenant = caseData.tenants.find((t) => t.isPrimary);
    const hasForwardingAddress = !!primaryTenant?.forwardingAddress;
    const addressStatus = primaryTenant?.forwardingAddressStatus;

    checks.push({
      id: "forwarding_address",
      label: "Forwarding address",
      description: "Tenant forwarding address status is documented",
      passed: hasForwardingAddress || addressStatus === "REQUESTED" || addressStatus === "REFUSED",
      severity: "warning",
      details: hasForwardingAddress
        ? "Address on file"
        : addressStatus === "REQUESTED"
        ? "Requested but not provided (documented)"
        : addressStatus === "REFUSED"
        ? "Tenant refused (documented)"
        : "Not requested - consider documenting",
    });

    // 8. Required checklist items completed
    const incompleteBlockers = caseData.checklistItems.filter(
      (item) => item.blocksExport && !item.completed
    );
    checks.push({
      id: "checklist_complete",
      label: "Required checklist items",
      description: "All required checklist items are completed",
      passed: incompleteBlockers.length === 0,
      severity: "error",
      details:
        incompleteBlockers.length > 0
          ? `${incompleteBlockers.length} incomplete: ${incompleteBlockers.map((i) => i.label).join(", ")}`
          : undefined,
    });

    // 9. Deductions have evidence (warning only)
    const deductionsWithoutEvidence = caseData.deductions.filter(
      (d) => !d.hasEvidence && d.attachmentIds.length === 0
    );
    if (caseData.deductions.length > 0) {
      checks.push({
        id: "deduction_evidence",
        label: "Deduction evidence",
        description: "All deductions have supporting evidence",
        passed: deductionsWithoutEvidence.length === 0,
        severity: "warning",
        details:
          deductionsWithoutEvidence.length > 0
            ? `${deductionsWithoutEvidence.length} deduction(s) without evidence`
            : undefined,
      });
    }

    // 10. High-risk deductions reviewed (warning only)
    const highRiskDeductions = caseData.deductions.filter(
      (d) => d.riskLevel === "HIGH"
    );
    if (highRiskDeductions.length > 0) {
      checks.push({
        id: "high_risk_reviewed",
        label: "High-risk deductions",
        description: "Review deductions flagged as high-risk",
        passed: false, // Always show as warning when there are high-risk items
        severity: "warning",
        details: `${highRiskDeductions.length} deduction(s) flagged as high-risk`,
      });
    }

    // 11. Tenant information complete
    const hasTenantInfo = !!(
      primaryTenant && primaryTenant.name && primaryTenant.name.trim() !== ""
    );
    checks.push({
      id: "tenant_info",
      label: "Tenant information",
      description: "Primary tenant information is complete",
      passed: hasTenantInfo,
      severity: "error",
    });

    // Calculate results
    const blockers = checks.filter((c) => !c.passed && c.severity === "error");
    const warnings = checks.filter(
      (c) => !c.passed && c.severity === "warning"
    );
    const passedCount = checks.filter((c) => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);
    const ready = blockers.length === 0;

    const result: QualityCheckResult = {
      ready,
      score,
      checks,
      blockers,
      warnings,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error running quality check:", error);
    return NextResponse.json(
      { error: "Failed to run quality check" },
      { status: 500 }
    );
  }
}
