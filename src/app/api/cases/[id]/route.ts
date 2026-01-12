import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

// GET /api/cases/[id] - Get a single case
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = requireDb();

    const caseData = await db.case.findUnique({
      where: { id, userId: user.id },
      include: {
        property: {
          include: {
            jurisdiction: true,
          },
        },
        tenants: true,
        deductions: true,
        documents: true,
        attachments: true,
        auditEvents: {
          orderBy: { timestamp: "desc" },
        },
        checklistItems: {
          orderBy: { sortOrder: "asc" },
        },
        ruleSet: {
          include: {
            citations: true,
            penalties: true,
            jurisdiction: true,
          },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json(caseData);
  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json(
      { error: "Failed to fetch case", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH /api/cases/[id] - Update a case
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = requireDb();
    const body = await request.json();

    // Verify ownership
    const existingCase = await db.case.findUnique({
      where: { id, userId: user.id },
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Extract updatable fields
    const {
      depositAmount,
      depositInterest,
      status,
      deliveryMethod,
      sentDate,
      trackingNumber,
      closedReason,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (depositAmount !== undefined) updateData.depositAmount = depositAmount;
    if (depositInterest !== undefined) updateData.depositInterest = depositInterest;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "CLOSED") {
        updateData.closedAt = new Date();
        if (closedReason) updateData.closedReason = closedReason;
      }
    }
    if (deliveryMethod !== undefined) updateData.deliveryMethod = deliveryMethod;
    if (sentDate !== undefined) updateData.sentDate = new Date(sentDate);
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;

    const updatedCase = await db.case.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
        tenants: true,
        ruleSet: true,
      },
    });

    // Log the update
    await db.auditEvent.create({
      data: {
        caseId: id,
        action: "case_updated",
        description: `Case updated: ${Object.keys(updateData).join(", ")}`,
        userId: user.id,
        metadata: updateData as Record<string, string | number | boolean | Date | null>,
      },
    });

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: "Failed to update case" },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id] - Delete a case
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = requireDb();

    // Verify ownership
    const existingCase = await db.case.findUnique({
      where: { id, userId: user.id },
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    await db.case.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { error: "Failed to delete case" },
      { status: 500 }
    );
  }
}
