# LandlordComply — Screen-by-Screen Wireframe Spec (MVP)
Version: v1.0  

Goal: Describe each screen’s layout, components, states, and primary actions so an AI dev agent can implement with minimal ambiguity.

UI principle: **One primary action per screen**, timeline + countdown visible, always show coverage + disclaimers.

---

## Global Layout

### App Shell
- Left sidebar (desktop) / bottom nav (mobile):
  - Dashboard
  - Cases
  - Coverage
  - Documents
  - Settings
- Top bar:
  - “New Case” primary button
  - User menu

### Persistent elements
- Trust banner (always visible somewhere):
  - “Educational use only — not legal advice.”
- Coverage badge:
  - “City ordinance coverage: Included / Not Included” (per case/property)

---

## 1) Auth — Sign In / Sign Up
**Components**
- Email + password
- Optional Google SSO
- CTA: Sign in / Create account

**States**
- Error: invalid credentials
- Loading: spinner on CTA

---

## 2) Onboarding — “Create your first packet”
**Goal**
Get to first case fast; avoid long setup.

**Sections**
1) Welcome card
- “Generate a Security Deposit Disposition Pack in minutes.”
- CTA: “Add property address”

2) Address entry
- Address autocomplete input
- Jurisdiction stack preview:
  - State
  - City
  - Coverage badge (Included / Not Included)

3) CTA
- “Create first case”

**States**
- Address not found
- City not supported → message: “We’ll apply state rules only. City overrides coming soon.”

---

## 3) Dashboard — “Deadline Radar”
**Primary job**
Know what’s urgent and what’s missing.

**Layout**
- KPI strip: Active cases / Due in 7 days / Due in 3 days
- Table: Case, Property, Due Date, Days Left, Status, Blockers
- Secondary: Recent exports list

**Empty state**
- “No active cases yet.” CTA: “Create first case”

---

## 4) Coverage — “What’s supported”
**Purpose**
Prevent trust failures.

**Sections**
- Search: state/city
- Supported list with legend:
  - ✅ Included
  - ⚠️ Partial (shows what’s missing)
  - ❌ Not included
- “Request a jurisdiction” form (address + what they need)

---

## 5) Cases — List
**Components**
- Filters: status, due date, state, city coverage
- Table columns: Tenant, Property, Move-out, Due date, Coverage, Status
- CTA: “New Case”

---

## 6) New Case Wizard (3-step)

### Step 1: Property
- Choose existing property OR add new address
- Show resolved jurisdiction stack + coverage

CTA: Continue

### Step 2: Move-out + Deposit
- Move-out date (required)
- Deposit amount (required)
- Tenant(s): name, forwarding address (optional prompt), email optional

CTA: Generate rules & checklist

### Step 3: Rules Summary + Checklist
- Computed results:
  - Due date + countdown
  - Interest required? (yes/no)
  - Receipt requirements threshold
  - Itemization requirements
- Checklist auto-created:
  - Add deductions (optional)
  - Upload evidence (recommended)
  - Generate notice (required)
  - Choose delivery method (required)

CTA: Open Case Workspace

---

## 7) Case Workspace (Core)
**Layout (desktop)**
- Left: step timeline
- Center: active step panel
- Right: sticky status panel (Due date, Days left, Coverage badge, Blockers, Export button)

### Step: Rules
- Rules Snapshot Card (structured rows)
- “Sources” drawer (citations)
- Checkbox: “I’ve reviewed the rules snapshot.”
- Link: “Flag a rules issue”

### Step: Amounts
- Deposit amount (editable)
- Interest calculator (if required)
- Deductions table:
  - item, category, amount, notes, linked evidence
  - add line item
- Validation banner: totals match / needs review
- Optional AI button: “Suggest line items from receipts/notes”

### Step: Evidence
- Upload dropzone
- Evidence list/gallery with tags
- Checklist prompts (move-in/out photos)

### Step: Documents
- Tabs: Notice Letter / Itemized Statement / Appendix
- Preview pane
- CTA: Generate PDF (required), Regenerate
- Version history list

### Step: Send & Proof
- Delivery method selector
- Proof checklist:
  - mailed date, tracking #, address confirmed
- Audit log preview timeline
- CTA: Export Proof Packet (primary)

### Step: Close
- Mark sent + close case
- Optional: duplicate template

**Gating**
- Export disabled until: move-out set, deposit set, PDF generated, delivery method selected.

---

## 8) Documents — Library
- List: case, doc type, created date, version, download
- Filters by state/city

---

## 9) Settings
- Profile
- Billing (Stripe portal)
- Reminder preferences (7/3/1 default)
- Data export

---

## System States
- Loading: skeletons
- Error: address resolution, rules engine missing, PDF failed (retry)
- Accessibility: keyboard, focus visible, icon+label not color-only
