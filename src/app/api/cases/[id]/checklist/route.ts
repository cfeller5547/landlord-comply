import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/cases/[id]/checklist - List checklist items for a case
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

    const checklistItems = await db.checklistItem.findMany({
      where: { caseId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(checklistItems);
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklist" },
      { status: 500 }
    );
  }
}

// PATCH /api/cases/[id]/checklist - Update a checklist item
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;
    const db = requireDb();
    const body = await request.json();
    const { itemId, completed } = body;

    if (!itemId || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "itemId and completed status are required" },
        { status: 400 }
      );
    }

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Find checklist item
    const item = await db.checklistItem.findUnique({
      where: { id: itemId, caseId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Checklist item not found" },
        { status: 404 }
      );
    }

    // Update item
    const updatedItem = await db.checklistItem.update({
      where: { id: itemId },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        caseId,
        action: completed ? "checklist_item_completed" : "checklist_item_uncompleted",
        description: `${completed ? "Completed" : "Uncompleted"}: ${item.label}`,
        userId: user.id,
        metadata: { itemId, label: item.label },
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating checklist item:", error);
    return NextResponse.json(
      { error: "Failed to update checklist item" },
      { status: 500 }
    );
  }
}

// POST /api/cases/[id]/checklist - Add a custom checklist item
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;
    const db = requireDb();
    const body = await request.json();
    const { label, blocksExport = false } = body;

    if (!label) {
      return NextResponse.json(
        { error: "Label is required" },
        { status: 400 }
      );
    }

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Get max sort order
    const maxOrder = await db.checklistItem.aggregate({
      where: { caseId },
      _max: { sortOrder: true },
    });

    const newSortOrder = (maxOrder._max.sortOrder || 0) + 1;

    // Create item
    const item = await db.checklistItem.create({
      data: {
        caseId,
        label,
        completed: false,
        blocksExport,
        sortOrder: newSortOrder,
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        caseId,
        action: "checklist_item_added",
        description: `Added checklist item: ${label}`,
        userId: user.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error adding checklist item:", error);
    return NextResponse.json(
      { error: "Failed to add checklist item" },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id]/checklist - Delete a checklist item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;
    const db = requireDb();
    const { itemId } = await request.json();

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const item = await db.checklistItem.findUnique({
      where: { id: itemId, caseId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Checklist item not found" },
        { status: 404 }
      );
    }

    await db.checklistItem.delete({
      where: { id: itemId },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        caseId,
        action: "checklist_item_deleted",
        description: `Deleted checklist item: ${item.label}`,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    return NextResponse.json(
      { error: "Failed to delete checklist item" },
      { status: 500 }
    );
  }
}
