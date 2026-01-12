import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

// GET /api/cases/[id] - Get a single case
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("[API CASE GET] Fetching case...");
    const user = await getDbUser();
    console.log("[API CASE GET] User:", user?.id || "NO USER", user?.email || "N/A");
    if (!user) {
      console.log("[API CASE GET] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("[API CASE GET] Case ID:", id, "User ID:", user.id);
    const db = requireDb();

    // First, check if the case exists at all (simple query without includes)
    const basicCase = await db.case.findUnique({
      where: { id },
      select: { id: true, userId: true, ruleSetId: true, propertyId: true },
    });
    console.log("[API CASE GET] Basic case lookup:", basicCase ? { id: basicCase.id, userId: basicCase.userId } : "NOT FOUND");

    if (!basicCase) {
      console.log("[API CASE GET] Case does not exist in database");
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (basicCase.userId !== user.id) {
      console.log("[API CASE GET] User ID mismatch - case belongs to:", basicCase.userId, "but user is:", user.id);
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Now fetch with full includes
    console.log("[API CASE GET] Fetching full case data...");
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
    console.log("[API CASE GET] Full case data retrieved:", caseData ? "SUCCESS" : "FAILED");

    if (!caseData) {
      console.log("[API CASE GET] Full case query returned null despite basic query success");
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    console.log("[API CASE GET] Case found:", caseData.id, "Status:", caseData.status);
    return NextResponse.json(caseData);
  } catch (error) {
    console.error("[API CASE GET] Error fetching case:", error);
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
