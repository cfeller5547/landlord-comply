import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/cases/[id]/deductions - List deductions for a case
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = requireDb();

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const deductions = await db.deduction.findMany({
      where: { caseId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(deductions);
  } catch (error) {
    console.error("Error fetching deductions:", error);
    return NextResponse.json(
      { error: "Failed to fetch deductions" },
      { status: 500 }
    );
  }
}

// POST /api/cases/[id]/deductions - Add a deduction
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = requireDb();
    const body = await request.json();

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const {
      description,
      category,
      amount,
      notes,
      attachmentIds,
      // New risk assessment fields
      riskLevel,
      itemAge,
      damageType,
      hasEvidence,
    } = body;

    const deduction = await db.deduction.create({
      data: {
        caseId: id,
        description,
        category,
        amount,
        notes,
        attachmentIds: attachmentIds || [],
        riskLevel,
        itemAge,
        damageType,
        hasEvidence: hasEvidence || (attachmentIds && attachmentIds.length > 0),
      },
    });

    // Log the addition
    await db.auditEvent.create({
      data: {
        caseId: id,
        action: "deduction_added",
        description: `Added deduction: ${description} ($${amount})`,
        userId: user.id,
      },
    });

    return NextResponse.json(deduction, { status: 201 });
  } catch (error) {
    console.error("Error creating deduction:", error);
    return NextResponse.json(
      { error: "Failed to create deduction" },
      { status: 500 }
    );
  }
}

// PATCH /api/cases/[id]/deductions - Update a deduction
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = requireDb();
    const body = await request.json();
    const {
      deductionId,
      description,
      category,
      amount,
      notes,
      attachmentIds,
      riskLevel,
      itemAge,
      damageType,
      hasEvidence,
    } = body;

    if (!deductionId) {
      return NextResponse.json(
        { error: "deductionId is required" },
        { status: 400 }
      );
    }

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const existingDeduction = await db.deduction.findUnique({
      where: { id: deductionId, caseId: id },
    });

    if (!existingDeduction) {
      return NextResponse.json({ error: "Deduction not found" }, { status: 404 });
    }

    // Build update data - only include fields that were provided
    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (notes !== undefined) updateData.notes = notes;
    if (attachmentIds !== undefined) {
      updateData.attachmentIds = attachmentIds;
      updateData.hasEvidence = attachmentIds.length > 0;
    }
    if (riskLevel !== undefined) updateData.riskLevel = riskLevel;
    if (itemAge !== undefined) updateData.itemAge = itemAge;
    if (damageType !== undefined) updateData.damageType = damageType;
    if (hasEvidence !== undefined) updateData.hasEvidence = hasEvidence;

    const deduction = await db.deduction.update({
      where: { id: deductionId },
      data: updateData,
    });

    // Log the update
    await db.auditEvent.create({
      data: {
        caseId: id,
        action: "deduction_updated",
        description: `Updated deduction: ${deduction.description}`,
        userId: user.id,
        metadata: { deductionId, updatedFields: Object.keys(updateData) },
      },
    });

    return NextResponse.json(deduction);
  } catch (error) {
    console.error("Error updating deduction:", error);
    return NextResponse.json(
      { error: "Failed to update deduction" },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id]/deductions - Delete a deduction (by deductionId in body)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = requireDb();
    const { deductionId } = await request.json();

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const deduction = await db.deduction.findUnique({
      where: { id: deductionId, caseId: id },
    });

    if (!deduction) {
      return NextResponse.json({ error: "Deduction not found" }, { status: 404 });
    }

    await db.deduction.delete({
      where: { id: deductionId },
    });

    // Log the deletion
    await db.auditEvent.create({
      data: {
        caseId: id,
        action: "deduction_deleted",
        description: `Deleted deduction: ${deduction.description}`,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deduction:", error);
    return NextResponse.json(
      { error: "Failed to delete deduction" },
      { status: 500 }
    );
  }
}
