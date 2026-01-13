import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

type CaseStatus = "ACTIVE" | "PENDING_SEND" | "SENT" | "CLOSED";

const validTransitions: Record<CaseStatus, CaseStatus[]> = {
  ACTIVE: ["PENDING_SEND", "SENT", "CLOSED"], // Allow direct ACTIVE → SENT for simpler UX
  PENDING_SEND: ["ACTIVE", "SENT", "CLOSED"],
  SENT: ["CLOSED"],
  CLOSED: [], // Cannot transition out of closed
};

// PATCH /api/cases/[id]/status - Update case status
export async function PATCH(
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
    const body = await request.json();
    const {
      status,
      deliveryMethod,
      sentDate,
      trackingNumber,
      deliveryAddress,
      deliveryProofIds,
      closedReason,
    } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
      include: {
        checklistItems: {
          where: { blocksExport: true, completed: false },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const currentStatus = caseData.status as CaseStatus;
    const newStatus = status as CaseStatus;

    // Validate status transition
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // Check blockers for certain transitions
    // When marking as SENT, exclude items that will be auto-completed by the send action
    const itemsToExcludeWhenSending = ["send to tenant", "record proof of delivery", "delivery method"];
    const relevantBlockers = newStatus === "SENT"
      ? caseData.checklistItems.filter(
          (i) => !itemsToExcludeWhenSending.some(
            (exclude) => i.label.toLowerCase().includes(exclude)
          )
        )
      : caseData.checklistItems;

    if (
      (newStatus === "PENDING_SEND" || newStatus === "SENT") &&
      relevantBlockers.length > 0
    ) {
      return NextResponse.json(
        {
          error: "Cannot proceed - there are incomplete required checklist items",
          blockers: relevantBlockers.map((i) => i.label),
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === "SENT") {
      if (!deliveryMethod) {
        return NextResponse.json(
          { error: "Delivery method is required when marking as sent" },
          { status: 400 }
        );
      }
      updateData.deliveryMethod = deliveryMethod;
      updateData.sentDate = sentDate ? new Date(sentDate) : new Date();
      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }
      if (deliveryAddress) {
        updateData.deliveryAddress = deliveryAddress;
      }
      if (deliveryProofIds && deliveryProofIds.length > 0) {
        updateData.deliveryProofIds = deliveryProofIds;
      }
    }

    if (newStatus === "CLOSED") {
      updateData.closedAt = new Date();
      if (closedReason) {
        updateData.closedReason = closedReason;
      }
    }

    // Update case
    const updatedCase = await db.case.update({
      where: { id: caseId },
      data: updateData,
      include: {
        property: true,
        tenants: true,
      },
    });

    // Create appropriate audit event
    let auditDescription = "";
    switch (newStatus) {
      case "PENDING_SEND":
        auditDescription = "Case marked as ready to send";
        break;
      case "SENT":
        auditDescription = `Notice sent via ${deliveryMethod}${
          trackingNumber ? ` (Tracking: ${trackingNumber})` : ""
        }${deliveryAddress ? ` to ${deliveryAddress}` : ""}`;
        break;
      case "CLOSED":
        auditDescription = closedReason
          ? `Case closed: ${closedReason}`
          : "Case closed";
        break;
      default:
        auditDescription = `Status changed to ${newStatus}`;
    }

    await db.auditEvent.create({
      data: {
        caseId,
        action: `status_${newStatus.toLowerCase()}`,
        description: auditDescription,
        userId: user.id,
        metadata: {
          previousStatus: currentStatus,
          newStatus,
          deliveryMethod,
          trackingNumber,
          deliveryAddress,
          deliveryProofIds,
          closedReason,
        },
      },
    });

    // Auto-complete relevant checklist items when marking as sent
    if (newStatus === "SENT") {
      // Complete "Send to tenant(s)", "Record proof of delivery", and delivery method items
      await db.checklistItem.updateMany({
        where: {
          caseId,
          OR: [
            { label: { contains: "send to tenant", mode: "insensitive" } },
            { label: { contains: "record proof of delivery", mode: "insensitive" } },
            { label: { contains: "delivery method", mode: "insensitive" } },
          ],
        },
        data: { completed: true, completedAt: new Date() },
      });
    }

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Error updating case status:", error);
    return NextResponse.json(
      { error: "Failed to update case status" },
      { status: 500 }
    );
  }
}

// POST /api/cases/[id]/status/mark-ready - Helper to mark case as ready to send
export async function POST(
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

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
      include: {
        documents: true,
        checklistItems: {
          where: { blocksExport: true, completed: false },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Check if required documents exist
    const hasNoticeLetter = caseData.documents.some(
      (d) => d.type === "NOTICE_LETTER"
    );
    const hasItemizedStatement = caseData.documents.some(
      (d) => d.type === "ITEMIZED_STATEMENT"
    );

    const issues: string[] = [];

    if (!hasNoticeLetter) {
      issues.push("Notice letter has not been generated");
    }
    if (!hasItemizedStatement) {
      issues.push("Itemized statement has not been generated");
    }
    if (caseData.checklistItems.length > 0) {
      issues.push(
        `${caseData.checklistItems.length} required checklist item(s) incomplete`
      );
    }

    if (issues.length > 0) {
      return NextResponse.json(
        {
          ready: false,
          issues,
        },
        { status: 200 }
      );
    }

    // Update status to PENDING_SEND
    const updatedCase = await db.case.update({
      where: { id: caseId },
      data: { status: "PENDING_SEND" },
    });

    await db.auditEvent.create({
      data: {
        caseId,
        action: "status_pending_send",
        description: "Case marked as ready to send",
        userId: user.id,
      },
    });

    return NextResponse.json({
      ready: true,
      case: updatedCase,
    });
  } catch (error) {
    console.error("Error checking case readiness:", error);
    return NextResponse.json(
      { error: "Failed to check case readiness" },
      { status: 500 }
    );
  }
}
