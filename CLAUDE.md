# CLAUDE.md - LandlordComply Project Context

## The Problem We're Solving

### Security Deposit Disposition is a Legal Minefield

When a tenant moves out, landlords must return the security deposit (minus legitimate deductions) within a strict deadline. This sounds simple, but:

1. **Deadlines vary wildly**: California gives 21 days, Texas gives 30, NYC gives 14. Miss it by one day and you may forfeit the right to deduct anything.

2. **City ordinances override state law**: San Francisco requires interest payments. Chicago has specific receipt rules. NYC limits deposits to 1 month. State law alone isn't enough.

3. **Penalties are severe**: Bad faith retention or missed deadlines can mean owing 2-3x the deposit amount, plus attorney fees.

4. **The current workflow is a mess**:
   - Google "California security deposit rules"
   - Read 5 conflicting blog posts
   - Find an old template
   - Hope you got the deadline right
   - No audit trail if disputed

### Why Existing Solutions Fail

- **Blogs and templates** explain law but don't calculate deadlines, generate notices, or produce proof packets
- **Property management software** focuses on rent collection and maintenance, not compliance
- **Lawyers** are expensive for a routine move-out

---

## What LandlordComply Does

**One-liner**: A jurisdiction-aware compliance engine that turns a rental property address + move-out facts into exact deadlines, calculations, and court-ready notices (with citations and audit trail).

**Target Outcome**: Complete a security deposit disposition in under 15 minutes with fewer mistakes than templates/blogs.

### The Core Workflow We Productize

**Trigger**: Tenant moves out (or gives notice)
**Outcome**: Landlord returns remaining deposit + itemization + delivery method within deadline

| Step | Today (Messy) | With LandlordComply |
|------|---------------|---------------------|
| 1. Find rules | Google, blogs, guessing | Enter address → instant jurisdiction resolution |
| 2. Calculate deadline | Manual, often wrong | Automatic countdown with reminders |
| 3. Calculate interest | Forget it exists | Auto-calculated if required |
| 4. Collect evidence | Scattered photos/receipts | Upload, tag, link to deductions |
| 5. Draft notice | Old Word template | Generate compliant PDF with required language |
| 6. Send properly | Hope for the best | Checklist of allowed delivery methods |
| 7. Prove compliance | Nothing | Proof packet with citations + timestamps |

### "Oh Shit" Moments We Handle

- Deadline is shorter than repair/quote timeline → "estimate allowed?" rule + required follow-ups
- Roommates with different forwarding addresses
- Deductions disputed as "normal wear and tear"
- User unsure whether city overrides state
- Law changed after move-out but before deadline

---

## Target Audience

### Ideal Customer Profile
Self-managing landlords + small PMs with **1-50 units** who:
- Operate in at least one compliance-heavy jurisdiction (CA, NY, WA, IL), OR
- Have had (or fear) a deposit dispute, OR
- Manage multi-state/city portfolios and are tired of "checking 10 sources"

### Primary Persona: DIY Landlord (Owner-Operator)
- **Goal**: Avoid penalties, win disputes
- **Behavior**: Google searches, BiggerPockets lurks, uses templates/spreadsheets
- **Pain**: Spends hours researching rules, still unsure if compliant
- **Budget**: $99-149/year feels acceptable if ROI is obvious (one dispute avoided = $3,000+ saved)

### Secondary Persona: Small Property Manager (Ops/Admin)
- **Goal**: Reduce errors, standardize workflow across properties
- **Behavior**: Needs repeatable SOPs + audit trail for owners
- **Pain**: Different rules for each property, no central tracking
- **Budget**: $15-50/month if it reduces disputes

### Who Pays vs Who Uses
- Buyer is often the landlord/owner
- Daily user may be admin/PM
- Messaging must be "avoid penalties + prove compliance," not "cool software"

---

## Core Differentiation (What Makes This Work)

### What We MUST Deliver
1. **Address-aware rules**: State + city (+ county/zip where relevant) determines outputs
2. **Calculated outputs**: Not guidance—actual numbers and dates
3. **One-click notices**: Fill in facts → generate compliant notice + itemization
4. **Proof packet**: "Here's what I did, when, and why" with citations + timestamps

### What's NOT a Moat (Be Realistic)
- "AI summary" alone (easily copied)
- Generic templates
- "Modern UI" without substance

### Where We Stand Out
- **City-level coverage** for major metros (high ROI jurisdictions)
- **Deposit disposition "packet"** that's genuinely dispute-ready
- **Deadline engine** that's reliable and visible (countdowns, reminders)
- **Low-support product**: Answer fast, generate doc, export proof

---

## Trust is Everything

This is a legal-adjacent product. Users must trust our accuracy.

### How We Build Trust
1. **Primary sources only**: Every rule links to state statutes and city ordinances. No blog interpretations.
2. **Version-controlled rules**: Each rule set has a version number and "last verified" date. When you generate a notice, the version is locked to your case.
3. **Clear coverage boundaries**: We explicitly state which jurisdictions are covered. No implied completeness.
4. **Visible citations**: Every rule shows its statutory source.
5. **Persistent disclaimers**: "Educational tool only—not legal advice" appears throughout.

### What We Display for Every Rule
- The rule itself (e.g., "21 days to return deposit")
- Statute citation (e.g., "Cal. Civ. Code § 1950.5")
- Link to official source
- Version number (e.g., "2026.1")
- Last verified date (e.g., "January 2026")

---

## Product Scope (MVP)

### Jurisdictions Covered
- **States**: CA, NY, TX, WA, IL, CO, FL, MA, AZ, OR, GA, NC (top by landlord concentration)
- **Cities with overrides**: San Francisco, Los Angeles, Seattle, NYC, Chicago (high-value metros)

### MVP Features
| Feature | Description |
|---------|-------------|
| F1. Jurisdiction Resolver | Address → state + city + coverage level |
| F2. Rules Engine | Deadlines, interest, itemization, penalties, citations |
| F3. Case Management | One "case" per move-out with all related data |
| F4. Calculators | Deadline countdown, interest, itemization math |
| F5. Notice Generator | Compliant PDF with jurisdiction-specific language |
| F6. Proof Packet Export | ZIP with notices, rules snapshot, audit log, attachments |
| F7. Reminders | Email alerts at 7/3/1 days before deadline |

### Explicitly Out of Scope (MVP)
- Eviction notices / pay-or-quit
- Rent collection, maintenance, accounting
- Full local ordinance coverage nationwide
- Attorney marketplace
- SMS reminders

---

## Pricing Model

| Plan | Price | Includes |
|------|-------|----------|
| Free | $0 | 1 property, 1 active case, state-level rules, PDF notice |
| Single Packet | $29 one-time | 1 complete case, city + state rules, proof packet export |
| Pro | $99/year | Unlimited properties/cases, city rules, reminders, exports |

**Upsell path**: $29 single packet can be applied toward Pro within 7 days.

---

## User Flows

### Flow A: First-Time User → First Packet in 15 Minutes
1. Sign up
2. Add property address → jurisdiction auto-detected
3. Create move-out case → rules displayed with deadline
4. Enter deposit amount + deductions
5. Generate notice + itemization (PDF)
6. Export proof packet
7. Close case when sent

### Flow B: Repeat Use (Active Landlord)
1. Dashboard shows active cases + upcoming deadlines
2. Open case → update deductions → regenerate docs
3. Export packet → mark delivered → close case

---

## Information Architecture

### Public Pages
- `/` - Landing page with address input demo
- `/coverage` - States/cities supported
- `/pricing` - Plan comparison
- Terms, Privacy, Disclaimers

### App Pages (Authenticated)
- `/dashboard` - Active cases, deadline radar, quick actions
- `/cases` - List with filters
- `/cases/new` - 3-step wizard (property → tenant → deposit)
- `/cases/[id]` - Case workspace with 6-step workflow
- `/documents` - All generated documents
- `/settings` - Profile, billing, reminders
- `/coverage` - Request new jurisdictions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Icons | lucide-react |
| Fonts | Inter |
| Toast | Sonner |
| Theme | Custom "Calm Ledger" design system |

### Design System: "Calm Ledger"
- **Primary**: Deep teal `hsl(198 83% 23%)` - professional, trustworthy
- **Success**: Green `hsl(142 45% 35%)` - on-time, complete
- **Warning**: Amber `hsl(38 92% 50%)` - approaching deadline
- **Danger**: Red `hsl(0 62% 45%)` - overdue, errors
- **Background**: Light gray `hsl(210 33% 97%)` - clean, minimal

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                # Landing page (address demo, conversion-focused)
│   ├── globals.css             # Calm Ledger theme
│   ├── (public)/layout.tsx     # Public pages wrapper
│   └── (app)/
│       ├── layout.tsx          # App shell with sidebar
│       ├── dashboard/page.tsx  # KPI cards + Deadline Radar table
│       ├── cases/
│       │   ├── page.tsx        # Cases list
│       │   ├── new/page.tsx    # 3-step new case wizard
│       │   └── [id]/page.tsx   # Case workspace (6 tabs)
│       ├── coverage/page.tsx   # Jurisdiction grid
│       ├── documents/page.tsx  # Document library
│       └── settings/page.tsx   # Account settings
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/sidebar.tsx      # App navigation
│   └── domain/                 # Business-specific components
│       ├── deadline-chip.tsx   # Color-coded countdown
│       ├── coverage-badge.tsx  # full/partial/state_only
│       ├── status-badge.tsx    # active/pending/sent/closed
│       └── trust-banner.tsx    # "Not legal advice" disclaimer
└── lib/
    ├── types.ts                # TypeScript interfaces
    ├── mock-data.ts            # Sample jurisdictions + cases
    └── utils.ts                # Helpers (cn function)
```

---

## Data Model

### Core Entities
```typescript
Case {
  property: Property           // Address + jurisdiction
  tenants: Tenant[]           // Names, emails, forwarding addresses
  moveOutDate: Date           // Triggers deadline calculation
  depositAmount: number
  depositInterest: number     // Auto-calculated if required
  deductions: DeductionItem[] // Line items with evidence links
  dueDate: Date              // Calculated from rules
  status: 'active' | 'pending_send' | 'sent' | 'closed'
  ruleSet: RuleSet           // Versioned snapshot of rules used
  documents: GeneratedDocument[]
  auditEvents: AuditEvent[]  // Timestamp log of all actions
}

Jurisdiction {
  state: string
  city?: string
  coverageLevel: 'full' | 'partial' | 'state_only'
  lastVerified: Date
}

DepositRules {
  returnDeadlineDays: number
  interestRequired: boolean
  interestRate?: number
  itemizationRequired: boolean
  maxDepositMonths?: number
  penalties: PenaltyInfo[]
  citations: Citation[]      // Links to statutes
}
```

---

## Current State

### What's Built
- All pages styled and functional
- Interactive landing page with address autocomplete demo
- Case workspace with 6-step workflow
- Responsive design (mobile + desktop)
- Domain components for deadlines, coverage, status
- **Supabase project**: `txziykaoatbqvihveasu` (West US)
- **Database**: Postgres with full schema deployed
- **Authentication**: Supabase Auth with email/password
- **Seed data**: 13 jurisdictions with rules (CA, NY, TX, WA, IL, CO, FL, MA + major cities)

### What's Needed (Next Steps)
- API routes for CRUD operations (cases, properties, deductions)
- Connect frontend pages to real database (replace mock data)
- Real address validation/geocoding API
- Server-side PDF generation
- Email service for reminders
- Payment processing (Stripe)

---

## Supabase Project

- **Dashboard**: https://supabase.com/dashboard/project/txziykaoatbqvihveasu
- **Project Ref**: `txziykaoatbqvihveasu`
- **Region**: West US (North California)

---

## Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
npm run db:push   # Push Prisma schema to database
npm run db:seed   # Seed jurisdictions and rules
npm run db:studio # Open Prisma Studio (database GUI)
```

---

## Documentation

Full specs in `/docs/`:
- `LandlordComply_PRD.md` - Complete product requirements
- `LandlordComply_Wireframes.md` - Screen specifications
- `LandlordComply_DesignSystem.md` - Visual design guide

---

## Key Reminders

1. **Trust is everything**: Always show citations, version numbers, verification dates
2. **Not legal advice**: Disclaimer must appear persistently
3. **Address-aware**: The property address determines all rules
4. **Calculated, not guidance**: Show actual dates and amounts
5. **Proof packet**: The export is the product—everything builds toward it
6. **City overrides state**: This is the key insight most landlords miss
