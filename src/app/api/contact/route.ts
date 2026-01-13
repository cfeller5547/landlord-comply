import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { FeedbackCategory } from "@prisma/client";

// POST /api/contact - Submit contact form
export async function POST(request: Request) {
  try {
    const db = requireDb();
    const body = await request.json();

    const { name, email, reason, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message must be 2000 characters or less" },
        { status: 400 }
      );
    }

    // Map contact reason to feedback category
    const categoryMap: Record<string, FeedbackCategory | null> = {
      general: null,
      bug: FeedbackCategory.UI_UX,
      feature: FeedbackCategory.OTHER,
      support: FeedbackCategory.WORKFLOW,
      partnership: FeedbackCategory.OTHER,
    };

    // Get user agent from headers
    const userAgent = request.headers.get("user-agent") || undefined;

    // Store in feedback table with type CONTACT
    const contact = await db.feedback.create({
      data: {
        type: "CONTACT",
        category: categoryMap[reason] || null,
        message: `[Contact Form - ${reason || "general"}]\n\nFrom: ${name}\nEmail: ${email}\n\n${message}`,
        userEmail: email,
        userAgent: userAgent || null,
        trigger: "contact_form",
        metadata: {
          name,
          email,
          reason: reason || "general",
          submittedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(
      { success: true, id: contact.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form. Please try again." },
      { status: 500 }
    );
  }
}
