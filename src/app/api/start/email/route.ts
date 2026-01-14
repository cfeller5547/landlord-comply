import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Rate limiting: simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// POST /api/start/email - Send magic link email
export async function POST(request: Request) {
  try {
    const db = requireDb();
    const body = await request.json();

    const { draftId, email } = body;

    if (!draftId || !email) {
      return NextResponse.json(
        { error: "Draft ID and email are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Rate limit by email (3 requests per hour)
    const emailHash = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
    if (!checkRateLimit(`email:${emailHash}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Rate limit by draft (2 resends per draft)
    if (!checkRateLimit(`draft:${draftId}`, 2, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Maximum resends reached for this session." },
        { status: 429 }
      );
    }

    // Find the draft case
    const draftCase = await db.draftCase.findUnique({
      where: { id: draftId },
    });

    if (!draftCase) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }

    if (draftCase.status === "CLAIMED") {
      return NextResponse.json(
        { error: "This case has already been claimed" },
        { status: 400 }
      );
    }

    if (draftCase.status === "EXPIRED" || draftCase.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This draft has expired. Please start a new session." },
        { status: 400 }
      );
    }

    // Build the redirect URL with draft ID
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const redirectTo = `${baseUrl}/start/complete?draftId=${draftId}`;

    // Create Supabase client for OTP (magic link) sending
    // Using the anon key is fine for signInWithOtp - it will auto-create users
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Send magic link using signInWithOtp
    // This works for both new and existing users
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true, // Auto-create user if doesn't exist
      },
    });

    if (otpError) {
      console.error("Error sending OTP:", otpError);
      return NextResponse.json(
        { error: "Failed to send access link. Please try again." },
        { status: 500 }
      );
    }

    // Update draft case
    await db.draftCase.update({
      where: { id: draftId },
      data: {
        email: email.toLowerCase(),
        emailHash,
        emailSentAt: new Date(),
        status: "EMAIL_SENT",
      },
    });

    // Return success with masked email
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

    return NextResponse.json({
      success: true,
      message: "Check your email for your secure access link",
      email: maskedEmail,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
