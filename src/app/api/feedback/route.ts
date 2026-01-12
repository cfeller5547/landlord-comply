import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser, getCurrentUser } from "@/lib/auth";

// POST /api/feedback - Submit feedback
export async function POST(request: Request) {
  try {
    const db = requireDb();
    const body = await request.json();

    const {
      type,
      category,
      message,
      rating,
      pageUrl,
      trigger,
      caseId,
    } = body;

    // Validate required fields
    if (!type || !message) {
      return NextResponse.json(
        { error: "Type and message are required" },
        { status: 400 }
      );
    }

    // Get user info if authenticated (feedback can be anonymous)
    let userId: string | undefined;
    let userEmail: string | undefined;

    try {
      const dbUser = await getDbUser();
      if (dbUser) {
        userId = dbUser.id;
        userEmail = dbUser.email;
      }
    } catch {
      // User not authenticated - allow anonymous feedback
      const authUser = await getCurrentUser();
      userEmail = authUser?.email;
    }

    // Get user agent from headers
    const userAgent = request.headers.get("user-agent") || undefined;

    // Create feedback record
    const feedback = await db.feedback.create({
      data: {
        type,
        category: category || null,
        message,
        rating: rating || null,
        pageUrl: pageUrl || null,
        trigger: trigger || null,
        caseId: caseId || null,
        userId: userId || null,
        userEmail: userEmail || null,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({ success: true, id: feedback.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

// GET /api/feedback - List feedback (admin only in future)
export async function GET(request: Request) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin check here
    // For now, only allow users to see their own feedback
    const db = requireDb();

    const feedback = await db.feedback.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
