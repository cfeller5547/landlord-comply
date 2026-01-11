# LandlordComply — PRD (MVP)
Version: v1.0  
Owner: Solo founder (you)  
Doc purpose: Build-ready, AI-agent-executable specification for an MVP that can reach paid subscriptions with minimal support burden.

---

## 1) Product Summary

### One-liner
**LandlordComply** is a jurisdiction-aware compliance engine that turns a rental property address + move-out facts into **exact deadlines, calculations, and court-ready notices** (with citations and audit trail).

### Target outcome
A small landlord or small PM can complete a **security deposit disposition** (rules → amounts → itemization → compliant notice → proof-of-send checklist) in **under 15 minutes**—with fewer mistakes than templates/blogs.

### Why this exists (brutally realistic)
- Most “landlord software” competes on operations (rent collection, maintenance). Compliance is under-served at SMB level.
- Blogs/templates explain law; they do **not**: calculate, generate notices, track deadlines, or produce a defensible “proof packet.”
- The product only works if it is **trustworthy**, **address-aware**, and **fast**.

### What this is NOT
- Not legal advice.
- Not a full PM system.
- Not eviction management (MVP).
- Not attempting 50 states + 100 cities at launch.

---

## 2) ICP, Personas, and Buying Reality

### Ideal Customer Profile (MVP)
Self-managing landlords + small PMs with **1–50 units** who:
- operate in at least one compliance-heavy jurisdiction, or
- have had (or fear) a deposit dispute, or
- manage multi-state/city portfolios and are tired of “checking 10 sources.”

### Personas
1) **DIY Landlord (Owner-Operator)**
- Goal: avoid penalties + win disputes.
- Behavior: Google searches, BiggerPockets lurks, uses templates/spreadsheets.
- Budget: $99–$149/year feels acceptable if ROI is obvious.

2) **Small Property Manager (Ops/Admin)**
- Goal: reduce errors and standardize workflow.
- Behavior: needs repeatable SOPs + audit trail.
- Budget: $15–$50/month if it reduces disputes.

3) **Partner Persona (CPA / Eviction Attorney)**
- Goal: reduce client chaos; provide “prep packets”.
- Behavior: referral relationships; doesn’t want to support software.
- Budget: referral/affiliate incentives; possible “pro tier” later.

### Who pays vs who uses
- Buyer is often the landlord/owner.
- Daily user may be admin/PM.
- Product messaging must be “avoid penalties + prove compliance,” not “cool software.”

---

## 3) Problem & Workflow Reality (MVP Focus)

### MVP workflow you productize: Security Deposit Disposition
**Trigger:** tenant moves out (or gives notice).  
**Outcome:** landlord returns remaining deposit + itemization + delivery method within deadline.

#### Workflow steps (today, messy)
1) Find rules (state + city + special building rules)
2) Calculate: deadline, interest owed (if required), allowable deductions
3) Collect evidence: move-in/out condition, photos, invoices/estimates
4) Draft itemized statement + compliant notice language
5) Send via allowed delivery method (mail/email/hand delivery)
6) Log proof for dispute/court

#### “Oh sh*t” moments (what MVP must handle)
- deadline is shorter than repair/quote timeline → need “estimate allowed?” rule + required follow-ups
- roommates/forwarding address complexities
- deductions disputed as normal wear and tear
- user unsure whether city overrides state

---

## 4) Product Strategy (Differentiation)

### Core differentiation (must be true)
1) **Address-aware rules**: state + city (and optionally county/zip) determines outputs.
2) **Calculated outputs**: not guidance; actual numbers/dates.
3) **One-click notices**: fill in tenant/property/case facts → generate compliant notice + itemization.
4) **Proof packet**: “here’s what I did, when, and why” with citations + timestamps.

### What likely will NOT be a moat (be realistic)
- “AI summary” alone (easily copied).
- Generic templates.
- “modern UI” without substance.

### Where you can stand out
- **City-level** coverage for a small set of major cities (high ROI).
- A **deposit disposition ‘packet’** that’s genuinely court-ready.
- **Deadline engine** that’s reliable and visible (countdowns, reminders).
- Low-support product: “answer fast, generate doc, export proof.”

---

## 5) MVP Scope (What we build first)

### Jurisdictions (initial)
- **States:** pick top 10–12 by demand (you can decide from SEO + landlord concentration).
- **Cities:** pick 5–10 “high-value override” cities (e.g., SF, LA, Seattle, Chicago, NYC-specific rules as feasible).  
Note: store jurisdiction coverage explicitly; do not imply completeness where you’re not.

### MVP Features (must-have)
**F1. Jurisdiction Resolver**
- Input: property address
- Output: jurisdiction stack (state, city, any override flags)
- Confidence indicator (“city ordinance coverage: included / not included”)

**F2. Security Deposit Rules Engine (v1)**
- Output includes:
  - return deadline
  - interest required? rate source? calculation method
  - receipt requirements thresholds
  - itemization requirements
  - penalty summary (high-level)
  - delivery method requirements (if codified)
  - citations + “last verified” date
- Must support “edge-case prompts”: forwarding address missing, multiple tenants

**F3. Deposit Disposition Case**
- Create a “Case” per move-out.
- Case holds:
  - tenant(s), lease dates, move-out date
  - deposit amount, deductions, interest
  - rule outputs snapshot (versioned)
  - generated documents
  - checklist + audit trail

**F4. Calculators**
- Deadline calculator (countdown)
- Interest calculator (where required)
- Itemization math validation (totals, negative/zero scenarios)
- Proration helper (optional MVP if straightforward)

**F5. Notice Generator (PDF)**
- Generate:
  - Itemized statement (line items, totals)
  - Compliant notice letter (jurisdiction-specific language blocks)
- Includes citation appendix (optional toggle) and “not legal advice” footer.
- Exports:
  - PDF (print-ready)

**F6. Proof Packet Export**
- Bundle:
  - generated notice(s)
  - rule snapshot (with citations)
  - checklist completion + timestamps
  - attachments index (photos, invoices)
- Export as ZIP or single PDF packet (MVP: ZIP + manifest PDF).

**F7. Reminders**
- Email reminders for deadlines and blockers.
- MVP: email only; no SMS.

### MVP “Nice to have” (only if time)
- Saved portfolio (multiple properties) + law alerts
- Basic team accounts (PM staff)
- Google Drive export

### Non-goals (explicitly out of scope)
- Eviction notices / pay-or-quit
- Rent collection, maintenance tickets, accounting
- Full local ordinance coverage nationwide
- Attorney marketplace

---

## 6) AI (valuable, not gimmick)

### AI use-case principles
- AI must **reduce time** or **reduce mistakes**, not “chat.”
- AI must never silently apply law or make legal determinations.
- AI outputs are always **reviewed + confirmed** by user.
- AI should operate on **structured data + citations**, not hallucination.

### AI Features (MVP-safe)

**AI-1: Ordinance Gap Finder (assistive)**
- When city coverage is partial:
  - suggests “possible city overrides to verify” based on known patterns
  - UI always shows: “Not guaranteed—verify with official sources.”

**AI-2: Evidence-to-Itemization Assistant**
- Input: uploaded receipts/photos notes (user labels)
- Output: suggested deduction line items with descriptions + totals
- User confirms/edit.

**AI-3: Dispute Packet Builder**
- Input: case facts + deductions + photos list
- Output: a structured “defense narrative” outline (timeline + attachments index)
- No legal arguments; just organization.

---

## 7) User Flows (MVP)

### Flow A — First-time user → “First packet” in 10–15 minutes
1) Sign up
2) Add first property address
3) Create move-out case
4) Rules engine returns deadlines + requirements
5) User enters deposit + deductions
6) Generate notice + itemization
7) Export proof packet

### Flow B — Repeat use
1) Dashboard: active cases + upcoming deadlines
2) Open case → update deductions → regenerate docs
3) Export packet → close case

---

## 8) Information Architecture / Pages (MVP)

### Public
- Landing
- Pricing
- Coverage (states/cities supported)
- Trust/Methodology (sources + update process)
- Terms/Privacy + Disclaimers

### App
- Auth
- Dashboard
- Coverage
- Cases (list + detail workspace)
- Documents library
- Settings

---

## 9) Data Model (MVP)
Keep minimal and versioned to prevent “law changed after you generated doc” disputes.

### Entities
- User
- Property
- Jurisdiction
- RuleSetVersion
- Rule (structured)
- Citation
- Case
- DeductionLineItem
- GeneratedDocument
- Attachment
- AuditEvent
- Reminder

### Version snapshots
When a Case is created, store the **RuleSetVersion** used. Generated docs reference it.

---

## 10) Requirements & Acceptance Criteria (MVP)

### F1 — Jurisdiction Resolver
**Acceptance criteria**
- Given a valid address, returns correct state + city within 3 seconds.
- If city rules not supported, UI clearly shows “City ordinances not included for this address.”
- Address validation errors are actionable (“Please add ZIP code”).

### F2 — Rules Engine (Security Deposits v1)
**Acceptance criteria**
- For supported jurisdictions, displays:
  - deadline (days + computed calendar date from move-out date)
  - interest: yes/no + rate source + calculation method if yes
  - citations accessible via “Sources” drawer
  - “Last verified” date visible
- If move-out date missing, calculator disabled with prompt.
- Disclaimer banner always visible.

### F3 — Case Management
**Acceptance criteria**
- Create a case in <60 seconds.
- Case shows countdown “Days left” and due date.
- Closing a case requires selecting delivery method + marking “sent.”

### F4 — Calculators
**Acceptance criteria**
- Interest calculator matches the stored rule formula.
- Itemization totals always reconcile.
- Validation flags negative refunds (labels as “Tenant owes balance” without advice).

### F5 — Notice Generator
**Acceptance criteria**
- Generated PDF is US Letter print-ready with consistent margins.
- Required clause blocks appear for supported jurisdiction.
- User can preview before export.
- Footer includes “Not legal advice” + RuleSetVersion reference.

### F6 — Proof Packet Export
**Acceptance criteria**
- Export ZIP contains:
  - Notice PDF(s)
  - Rule Snapshot PDF (rules + citations + version)
  - Checklist + audit log PDF
  - Attachment index manifest
- Export completes in <30 seconds for up to 25 attachments.

### F7 — Reminders
**Acceptance criteria**
- Reminder emails sent at configurable thresholds (default 7/3/1 days).
- Emails include case link + blockers summary.

---

## 11) Trust, Safety, and Disclaimers
- Persistent banner: “Educational use only; not legal advice.”
- Coverage page discloses included jurisdictions + limitations.
- “Last verified” shown per rule set.
- Citations exportable.

---

## 12) Metrics
- Activation: % of signups who export first packet within 24h
- Time-to-packet: median minutes from case creation → export
- Conversion: free → paid
- Retention: cases per account per month
- Support load: tickets per 100 active accounts

---

## 13) Pricing (MVP assumption)
- Free: 1 property + 1 active case (value proof)
- Paid: $99–$149/year, unlimited cases, city-level pack, reminders, proof packet exports

---

## 14) Tech + Execution Notes
- Frontend: Next.js + TypeScript + Tailwind + shadcn/ui
- Backend: Postgres + API layer
- Auth: Clerk or Supabase Auth
- Address resolution: provider API + caching
- PDFs: server-side render (HTML→PDF or React PDF)
- Rule versioning: immutable published versions
- AI: gated, reviewed outputs; log prompts/outputs for audit

---

## 15) MVP Launch Plan (realistic)
- Launch with limited jurisdiction coverage + explicit coverage map.
- Sell as “Deposit Disposition Pack,” not “all landlord law.”
- Get 10–20 beta users before paid launch.
