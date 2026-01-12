import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { improveDeductionDescription, DeductionContext } from "@/lib/ai/gemini";

// POST /api/deductions/[id]/improve - Improve deduction description with AI
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: deductionId } = await params;
    const db = requireDb();
    const body = await request.json();
    const { whatHappened, whereLocated, whyBeyondWear, invoiceInfo } = body;

    // Find deduction and verify ownership
    const deduction = await db.deduction.findUnique({
      where: { id: deductionId },
      include: {
        case: {
          select: { userId: true },
        },
      },
    });

    if (!deduction) {
      return NextResponse.json({ error: "Deduction not found" }, { status: 404 });
    }

    if (deduction.case.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build context for AI
    const context: DeductionContext = {
      description: deduction.description,
      category: deduction.category,
      amount: Number(deduction.amount),
      itemAge: deduction.itemAge || undefined,
      damageType: deduction.damageType || undefined,
      hasEvidence: deduction.hasEvidence,
      whatHappened,
      whereLocated,
      whyBeyondWear,
      invoiceInfo,
    };

    // Call AI to improve description
    const improved = await improveDeductionDescription(context);

    // Update deduction with improved description
    const updatedDeduction = await db.deduction.update({
      where: { id: deductionId },
      data: {
        originalDescription: deduction.aiGenerated ? deduction.originalDescription : deduction.description,
        description: improved.description,
        aiGenerated: true,
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        caseId: deduction.caseId,
        action: "deduction_ai_improved",
        description: `AI improved description for: ${deduction.category}`,
        userId: user.id,
        metadata: {
          deductionId,
          originalDescription: deduction.description,
          improvedDescription: improved.description,
          reasoning: improved.reasoning,
        },
      },
    });

    return NextResponse.json({
      deduction: updatedDeduction,
      reasoning: improved.reasoning,
    });
  } catch (error) {
    console.error("Error improving deduction:", error);
    const message = error instanceof Error ? error.message : "Failed to improve deduction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
