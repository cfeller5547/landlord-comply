# LandlordComply Beta “Instant Packet” Entry Flow — Implementation Plan

## Goal
Maximize beta conversions from cold traffic (Reddit/Facebook/BiggerPockets) by:

1) Delivering immediate value (deadline + requirements + citations) with minimal friction  
2) Capturing email only after value is proven (“email me my results / save my case”)  
3) Deep-linking into the full app (case workspace) via magic link/OTP  
4) Converting “one-off help seekers” into real users in your system without a traditional signup wall

This should feel:
- modern, minimal, trustworthy
- “compliance tool,” not “marketing funnel”
- fast and obvious for a stressed landlord

---

# UX / UI Flow

## Entry point link you share publicly
Use a dedicated public URL, not the normal app:
- `https://landlord-comply.vercel.app/start`  
Add UTM support for attribution:
- `/start?utm_source=reddit&utm_campaign=beta_packet`

## Step 1 — Minimal Wizard (Public)
**Purpose:** “Get my deadline + required steps” in under 60 seconds.

### Fields (MVP minimal)
- Property Address (single input)
- Move-out Date
- Deposit Amount (optional but recommended for exposure messaging)
- (Optional toggle) “I’m in a city with stricter rules (SF/LA/NYC/etc.)” if your resolver is still limited

### UX
- 3-step card wizard with a progress indicator (Step 1/3 etc.)
- Calm Ledger styling
- Trust banner always visible: “Educational tool, not legal advice”
- Primary CTA: **“Calculate deadline + required steps”**

### Validation
- Date required
- Address required
- Deposit amount optional (but if entered, must be numeric)

## Step 2 — Results Preview (Public, No Email Required)
**Purpose:** deliver the “wow” moment immediately.

Show clearly:
- **Exact deadline date** (and countdown)
- **Required items checklist** (itemization, receipts/estimates rules, interest if required)
- **Allowed delivery methods** (and proof tips)
- **Citations + last verified** (trust)

**Important:** Don’t make this feel gimmicky.  
Show real results in clean typography. Gate “persistence/export,” not the core answer.

### What gets gated behind email (to pull them into app)
Under the results, show a “Your packet” section with locked actions:
- 🔒 Download compliant Notice PDF + Itemized Statement
- 🔒 Save this case (audit trail, versioning)
- 🔒 Reminders (7/3/1)
- 🔒 Upload evidence + Proof packet export

Add a **PDF thumbnail preview** with a watermark like:
> “Preview — email required to download”

This achieves the same effect as “screenshot-only,” but feels professional.

## Step 3 — Email Capture (Framed as Save/Send, not signup)
Under results:

- **Header:** “Send me my results + save this case”  
- **Field:** Email  
- **Button:** **“Email me my packet link”**

### Microcopy (trust-critical)
- “No password required. We’ll send a secure access link.”
- “We only use your email to send this case + important reminders you request.”
- “Unsubscribe anytime.”

After submit:
- Confirm screen: “Check your email for your secure link”
- Buttons: “Resend” + “Wrong email?”
- Keep results on-screen (don’t punish them if email deliverability lags)

## Step 4 — Magic Link → Full App Case Workspace
When they click the email link:
- They are authenticated (Supabase)
- Draft is finalized into a real `Case`
- Redirect directly to `/cases/{caseId}`

**First in-app screen should be action-first:**
- “Generate Notice PDF” (primary)
- “Add deductions” (secondary)
- “Record delivery method” (secondary)

No dashboard detours. Completion beats exploration.

---

# Data + System Architecture

## New Concept: Draft Case (Pre-auth)
Create a lightweight `DraftCase` record that stores pre-auth inputs and computed preview outputs.

## DraftCase (new DB table)
### Fields
- `id` (uuid)
- `createdAt`
- `expiresAt` (e.g., +7 days)
- `source` (utm_source, utm_campaign)
- `addressRaw` (string)
- `moveOutDate`
- `depositAmount` (nullable)
- `jurisdictionId` (nullable if not resolvable)
- `ruleSetId` (nullable)
- `previewJson` (json: deadline, checklist, delivery methods, citations, lastVerified, version)
- `status` (PREVIEWED | EMAIL_SENT | CLAIMED | EXPIRED)
- `emailHash` (optional; store hash if you want fraud/rate limiting without storing plain email pre-consent)
- `claimedAt`

### Retention
- Purge drafts older than 7–14 days automatically (cron/scheduled job)

## Finalization logic (post-auth)
When magic link returns and you have a real Supabase user session:
- Load `DraftCase`
- Create a real `Case` linked to `userId`
- Copy relevant fields + attach selected `ruleSetId`
- Write an `AuditEvent`: `BETA_CASE_CREATED_FROM_DRAFT`
- Mark draft `CLAIMED`
- Redirect to case page

---

# Backend Endpoints / Server Actions

## 1) Generate Preview (Public)
- **Route:** `POST /api/start/preview`
- **Input:** addressRaw, moveOutDate, depositAmount, utm params
- **Output:** draftId + previewJson

### Server responsibilities
- Resolve jurisdiction (best effort)
- Load RuleSet
- Compute due date
- Compute interest requirement (if applicable; exact interest may need more inputs—ok)
- Compose checklist + citations + version/last verified
- Save DraftCase

## 2) Send Packet Email + Create Auth Link (Public)
- **Route:** `POST /api/start/email`
- **Input:** draftId, email
- **Output:** success (and maybe masked email)

### Server responsibilities
- Rate limit per IP + per draft (anti-abuse)
- Generate a Supabase auth link (magic link) with a redirect containing `draftId`
- Send **your own email** (recommended) so you can include:
  - results summary
  - CTA button “Open your saved case”
  - additional CTA “Generate PDFs / Proof packet inside”
- Mark DraftCase `EMAIL_SENT`

### Auth link generation
Use Supabase Admin to generate the link so you control the email content:
- For new users: generate signup link
- For existing users: generate magic link  
(Implement whichever Supabase admin method is available in your setup.)

## 3) Complete (Post-auth)
- **Route:** `/start/complete?draftId=...`

This page/route:
- verifies session user
- finalizes draft → case
- redirects to `/cases/{id}`

---

# Email Content (Professional + Conversion-Oriented)

## Subject lines (pick 1–2; A/B later)
- “Your security deposit deadline + steps (saved case link)”
- “Your deposit disposition checklist + compliant packet link”
- “Your deadline is {{date}} — here’s your saved case”

## Email layout
1) **Deadline summary** (big, clear)
2) Key checklist bullets
3) Citations + last verified (small)
4) Primary button: **Open your saved case (secure link)**
5) Secondary CTA: “Generate compliant PDFs + proof packet inside”
6) Disclaimer footer + unsubscribe

---

# UI Copy & Trust Signals (Non-negotiables)

On `/start` and results:
- “Not legal advice” disclaimer visible (trust banner)
- “Primary sources” citations shown
- “Last verified” + “Ruleset version”
- Clear coverage statement: FULL / PARTIAL / STATE-ONLY coverage badge

Avoid any wording like “invisible signup.” Prefer:
- “Save your case”
- “Secure link”
- “No password required”

---

# Conversion Optimizations (Small but Huge)

## 1) Keep results visible after email submission
Don’t make them depend on inbox to continue feeling value.

## 2) Offer a “concierge sanity check” CTA under results (optional but powerful)
> “Want a free beta sanity check? Reply to the email with your situation and we’ll confirm your packet is ready.”

## 3) Keep the wizard extremely short
If you add too many fields, completion drops. Start minimal.

---

# Analytics & Tracking (So you can see if it’s working)
Log these events:
- `start_viewed` (utm)
- `preview_generated`
- `email_submitted`
- `email_sent_success`
- `magic_link_clicked` (on `/start/complete`)
- `case_created_from_draft`
- `pdf_generated`
- `case_marked_sent` (later)

Measure real conversion: **preview → email → case → pdf**.

---

# Security / Abuse Controls
Public endpoints will get abused. Minimum controls:
- Rate limit `/api/start/email` (per IP + per draft)
- Don’t allow infinite resends
- Draft expiry
- Don’t store sensitive tenant info in the draft flow
- Ensure magic-link redirect only to your domain
- Add bot protection later (captcha) if abuse appears

---

# UI Integration Points in Existing App
- Landing page CTA: “Get my deadline now” → `/start`
- Authenticated app remains unchanged
- Case workspace remains the core product

---

# Acceptance Criteria (Definition of Done)
1) Cold user can go to `/start`, enter minimal inputs, and see deadline/checklist instantly  
2) User enters email and receives a professional email with:
   - results summary
   - “Open saved case” deep link  
3) Clicking the link authenticates them and drops them directly into `/cases/{id}` with the case created  
4) PDF generation and core features work normally inside the case  
5) Tracking events recorded for funnel visibility  
6) Clean, calm, professional UI consistent with Calm Ledger
