import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
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

// Format date for email display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Generate branded email HTML
function generateEmailHtml(preview: {
  deadline: { date: string; daysRemaining: number; deadlineDays: number };
  jurisdiction: { state: string; city: string | null; coverageLevel: string };
  rules: { itemizationRequired: boolean; interestRequired: boolean; interestRate: number | null; allowedDeliveryMethods: string[] };
  checklist: Array<{ label: string; description: string }>;
  ruleSetVersion: string;
  lastVerified: string;
}, actionLink: string, address: string): string {
  const deadlineColor = preview.deadline.daysRemaining <= 3
    ? "#dc2626" // red
    : preview.deadline.daysRemaining <= 7
    ? "#d97706" // amber
    : "#16a34a"; // green

  const deadlineBgColor = preview.deadline.daysRemaining <= 3
    ? "#fef2f2"
    : preview.deadline.daysRemaining <= 7
    ? "#fffbeb"
    : "#f0fdf4";

  const deadlineBorderColor = preview.deadline.daysRemaining <= 3
    ? "#fecaca"
    : preview.deadline.daysRemaining <= 7
    ? "#fde68a"
    : "#bbf7d0";

  const coverageText = preview.jurisdiction.coverageLevel === "FULL"
    ? "State + City Rules"
    : preview.jurisdiction.coverageLevel === "PARTIAL"
    ? "Partial Coverage"
    : "State Rules Only";

  const locationText = preview.jurisdiction.city
    ? `${preview.jurisdiction.city}, ${preview.jurisdiction.state}`
    : preview.jurisdiction.state;

  // Format delivery methods for display
  const deliveryMethodsFormatted = preview.rules.allowedDeliveryMethods
    .map(m => m === "certified_mail" ? "Certified Mail" : m === "first_class_mail" ? "First Class Mail" : m === "hand_delivery" ? "Hand Delivery" : m === "email" ? "Email (if agreed)" : m.replace(/_/g, ' '))
    .slice(0, 3);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Security Deposit Deadline</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

      <!-- Logo Bar -->
      <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:32px;height:32px;background:#0d5c73;border-radius:8px;"></td>
                  <td style="padding-left:12px;font-weight:700;font-size:18px;color:#0f172a;">LandlordComply</td>
                </tr>
              </table>
            </td>
            <td align="right">
              <span style="display:inline-block;font-size:11px;color:#0d5c73;padding:4px 10px;border:1px solid #0d5c73;border-radius:999px;font-weight:600;">BETA</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Disclaimer -->
      <div style="padding:12px 24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <p style="margin:0;font-size:11px;color:#64748b;text-align:center;">
          ⚖️ Educational tool only — not legal advice. Always verify with official sources or a licensed attorney.
        </p>
      </div>

      <!-- Main Content -->
      <div style="padding:24px;">

        <!-- Greeting -->
        <h1 style="margin:0 0 8px 0;font-size:22px;color:#0f172a;font-weight:700;">
          Your security deposit packet is ready
        </h1>
        <p style="margin:0 0 20px 0;font-size:14px;color:#64748b;">
          Property: ${address || "Your rental property"}
        </p>

        <!-- Deadline Card -->
        <div style="padding:20px;background:${deadlineBgColor};border:1px solid ${deadlineBorderColor};border-radius:12px;margin-bottom:20px;">
          <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${deadlineColor};text-transform:uppercase;letter-spacing:0.5px;">
            ⏰ YOUR DEADLINE
          </p>
          <p style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:${deadlineColor};">
            ${formatDate(preview.deadline.date)}
          </p>
          <p style="margin:0;font-size:13px;color:${deadlineColor};">
            <strong>${preview.deadline.daysRemaining} days remaining</strong> · ${preview.deadline.deadlineDays}-day rule in ${locationText}
          </p>
        </div>

        <!-- What You Get Section -->
        <div style="padding:20px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;margin-bottom:20px;">
          <p style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#0c4a6e;">
            📄 Your packet includes:
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#0369a1;">✓ <strong>Notice Letter</strong> — compliant for ${preview.jurisdiction.state}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#0369a1;">✓ <strong>Itemized Statement</strong> — deduction breakdown with totals</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#0369a1;">✓ <strong>Proof Packet</strong> — audit trail + evidence for disputes</td>
            </tr>
          </table>
        </div>

        <!-- Primary CTA: Download PDFs -->
        <div style="text-align:center;margin-bottom:16px;">
          <a href="${actionLink}" style="display:inline-block;background:#0d5c73;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:10px;font-weight:700;font-size:16px;">
            Download Your PDFs →
          </a>
        </div>

        <!-- Secondary CTA -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${actionLink}" style="font-size:13px;color:#0d5c73;text-decoration:underline;">
            Or open case to add deductions & upload receipts
          </a>
          <p style="margin:8px 0 0 0;font-size:11px;color:#94a3b8;">
            No password required — this link signs you in securely
          </p>
        </div>

        <!-- Delivery & Proof Requirements -->
        <div style="padding:16px;background:#fefce8;border:1px solid #fde047;border-radius:10px;margin-bottom:20px;">
          <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#854d0e;">
            📬 How to send it (required for proof):
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-size:12px;color:#a16207;padding:4px 0;">
                <strong>Allowed methods:</strong> ${deliveryMethodsFormatted.join(' · ')}
              </td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#a16207;padding:4px 0;">
                <strong>Keep proof:</strong> USPS receipt, certified mail slip, or delivery confirmation
              </td>
            </tr>
          </table>
        </div>

        <!-- Key Requirements Chips -->
        <div style="margin-bottom:20px;">
          ${preview.rules.itemizationRequired ? `<span style="display:inline-block;font-size:11px;color:#1e40af;background:#dbeafe;padding:6px 12px;border-radius:999px;margin:0 6px 6px 0;font-weight:600;">✓ Itemization required</span>` : ''}
          ${preview.rules.interestRequired ? `<span style="display:inline-block;font-size:11px;color:#92400e;background:#fef3c7;padding:6px 12px;border-radius:999px;margin:0 6px 6px 0;font-weight:600;">$ Interest: ${preview.rules.interestRate ? (preview.rules.interestRate * 100).toFixed(1) + '%/yr' : 'Required'}</span>` : ''}
          <span style="display:inline-block;font-size:11px;color:#166534;background:#dcfce7;padding:6px 12px;border-radius:999px;margin:0 6px 6px 0;font-weight:600;">${coverageText}</span>
        </div>

        <!-- Quick Checklist -->
        <div style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
          <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#334155;">
            ✅ Before sending, make sure you:
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:4px 0;font-size:12px;color:#64748b;">☐ Added all deductions with receipts/photos</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:12px;color:#64748b;">☐ Downloaded and reviewed your Notice Letter</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:12px;color:#64748b;">☐ Got tenant's forwarding address (or documented attempt)</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:12px;color:#64748b;">☐ Planned delivery method + saved proof</td>
            </tr>
          </table>
        </div>

      </div>

      <!-- Footer -->
      <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <p style="margin:0 0 4px 0;font-size:11px;color:#94a3b8;text-align:center;">
          Rules v${preview.ruleSetVersion} · Last verified ${new Date(preview.lastVerified).toLocaleDateString()} · <a href="https://landlordcomply.com/coverage" style="color:#64748b;">View sources</a>
        </p>
        <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
          © ${new Date().getFullYear()} LandlordComply · <a href="https://landlordcomply.com" style="color:#64748b;">landlordcomply.com</a>
        </p>
      </div>

    </div>

    <!-- Unsubscribe -->
    <p style="margin:20px 0 0 0;font-size:11px;color:#94a3b8;text-align:center;">
      You received this because you requested to save a case on LandlordComply.
    </p>

  </div>
</body>
</html>
`;
}

// POST /api/start/email - Send branded magic link email
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

    // Find the draft case with preview data
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
    // Prefer VERCEL_URL in production (auto-set by Vercel), fall back to NEXT_PUBLIC_APP_URL for local dev
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    const redirectTo = `${baseUrl}/start/complete?draftId=${draftId}`;

    // Create Supabase Admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate magic link server-side (does NOT send email)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase(),
      options: {
        redirectTo,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Error generating magic link:", linkError);
      return NextResponse.json(
        { error: "Failed to generate access link. Please try again." },
        { status: 500 }
      );
    }

    const actionLink = linkData.properties.action_link;

    // Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      // Fallback: If no Resend key, use the default Supabase email
      console.warn("RESEND_API_KEY not set, falling back to basic email");

      // Use signInWithOtp as fallback
      const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
      await supabaseAnon.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });
    } else {
      // Send branded email via Resend
      const resend = new Resend(resendApiKey);

      // Parse preview data from draft
      const preview = draftCase.previewJson as {
        deadline: { date: string; daysRemaining: number; deadlineDays: number };
        jurisdiction: { state: string; city: string | null; coverageLevel: string };
        rules: { itemizationRequired: boolean; interestRequired: boolean; interestRate: number | null; allowedDeliveryMethods: string[] };
        checklist: Array<{ label: string; description: string }>;
        ruleSetVersion: string;
        lastVerified: string;
      };

      const emailHtml = generateEmailHtml(preview, actionLink, draftCase.addressRaw);

      const { error: sendError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "LandlordComply <onboarding@resend.dev>",
        to: email.toLowerCase(),
        subject: `Your deposit packet is ready — ${preview.deadline.daysRemaining} days left to send`,
        html: emailHtml,
      });

      if (sendError) {
        console.error("Error sending email via Resend:", sendError);
        return NextResponse.json(
          { error: "Failed to send email. Please try again." },
          { status: 500 }
        );
      }
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
