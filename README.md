# LandlordComply

A jurisdiction-aware compliance engine for security deposit dispositions. Generate legally compliant notice letters, track deadlines, and avoid costly penalties.

**"A $99 tool to avoid a $5,000 mistake."**

## Features

### Core Functionality
- **Jurisdiction-Aware Rules Engine**: Automatically applies state and city-specific deposit return rules
- **PDF Generation**: Professional notice letters and itemized statements using React PDF
- **Deadline Tracking**: Real-time countdown with penalty exposure calculations
- **Audit Trail**: Complete history of all actions for legal defensibility

### MVP Features

#### 1. Delivery Proof + "Sent Correctly" Flow
*"Not just a letter—proof you sent it correctly."*
- Jurisdiction-specific allowed delivery methods display
- Record: method, date, address used, tracking number
- Upload proof (USPS receipt, certified mail slip, email screenshot)
- Delivery proof included in audit trail

#### 2. Forwarding Address Capture + Logging
*"Never get burned by missing forwarding address."*
- Request forwarding address template (email + printable)
- Track status: Provided / Not provided / Requested on [date]
- Auto-includes in notice: "Forwarding address requested on X; not received"

#### 3. Wear & Tear / Deduction Risk Guidance
*"Know what's risky before your tenant disputes it."*
- Risk level per deduction: Low / Medium / High
- Item age tracking for proration awareness
- Damage type classification: Normal wear, Beyond normal, Intentional, Negligence
- Evidence attachment indicator

#### 4. Exposure / Penalty Risk Calculator
*"A $99 tool to avoid a $5,000 mistake."*
- Potential penalty exposure based on jurisdiction + deposit amount
- Deadline risk and documentation risk assessment
- Citations and legal references included

#### 5. AI Deduction Description Writer (Google Gemini)
*"Write deductions that hold up in court."*
- One-click description improvement per deduction
- Context inputs: what happened, location, why beyond wear, invoice info
- Generates court-defensible, specific language
- AI-generated indicator stored in audit log

#### 6. Packet Quality Checklist
*"Catch mistakes before your tenant does."*
- Pre-export checklist with hard gates:
  - Move-out date present
  - Deadline not missed (or warned)
  - Totals reconcile
  - Required documents generated
  - Delivery method selected
- Output: "Ready to send" vs "Fix these issues"

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Supabase + Prisma ORM
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (for attachments and documents)
- **PDF Generation**: @react-pdf/renderer
- **AI**: Google Gemini API (@google/generative-ai)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Styling**: CSS variables, dark mode support

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase account)
- Google AI API key (for AI features)

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Google AI (Gemini) - for AI deduction description improvement
GOOGLE_AI_API_KEY="your-gemini-api-key"
```

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Set up storage bucket (requires SUPABASE_SERVICE_ROLE_KEY)
npx tsx scripts/setup-storage.ts

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated app routes
│   │   ├── cases/          # Case management
│   │   ├── dashboard/      # Dashboard
│   │   └── settings/       # User settings
│   ├── api/                # API routes
│   │   ├── cases/          # Case CRUD + status + checklist
│   │   ├── deductions/     # Deduction management + AI improvement
│   │   └── jurisdictions/  # Jurisdiction lookup
│   ├── login/              # Auth pages
│   └── signup/
├── components/
│   ├── domain/             # Business components (StatusBadge, DeadlineChip)
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── ai/                 # Gemini AI integration
│   ├── pdf/                # PDF templates
│   ├── supabase/           # Supabase client
│   └── db.ts               # Prisma client
└── prisma/
    └── schema.prisma       # Database schema
```

## API Routes

### Cases
- `GET/POST /api/cases` - List/create cases
- `GET/PATCH/DELETE /api/cases/[id]` - Case CRUD
- `PATCH /api/cases/[id]/status` - Update case status with delivery proof
- `GET/PATCH/POST/DELETE /api/cases/[id]/checklist` - Checklist items
- `GET/POST/DELETE /api/cases/[id]/attachments` - File attachments
- `POST /api/cases/[id]/documents/generate` - Generate PDFs
- `GET /api/cases/[id]/exposure` - Penalty exposure calculation
- `GET /api/cases/[id]/quality-check` - Pre-send quality check

### Deductions
- `GET/POST/PATCH/DELETE /api/cases/[id]/deductions` - Deduction CRUD
- `POST /api/deductions/[id]/improve` - AI description improvement

### Tenants
- `PATCH/GET /api/cases/[id]/tenants/[tenantId]/forwarding-address` - Forwarding address management + templates

### Jurisdictions
- `GET /api/jurisdictions` - List jurisdictions
- `GET /api/jurisdictions/lookup` - Lookup by state/city

## Database Schema

Key models:
- **User**: Account with subscription plan
- **Property**: Address linked to jurisdiction
- **Jurisdiction**: State/city with coverage level
- **RuleSet**: Versioned deposit return rules
- **Case**: Active deposit disposition case
- **Deduction**: Itemized deduction with risk assessment
- **Document**: Generated PDFs
- **Attachment**: Uploaded evidence files
- **AuditEvent**: Complete action history

## AI Integration (Google Gemini)

The AI features use Google's Gemini 1.5 Flash model for:

1. **Deduction Description Improvement**: Transforms vague descriptions into court-defensible language
2. **Risk Assessment**: Analyzes deduction risk factors (with rule-based fallback)

To enable AI features:
1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add `GOOGLE_AI_API_KEY` to your `.env` file

Without the API key, the app works normally but AI features are disabled.

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard.

### Self-Hosted

```bash
# Build
npm run build

# Start production server
npm start
```

## Legal Disclaimer

LandlordComply provides tools and templates based on publicly available legal information. It does not provide legal advice. Users should consult with a qualified attorney for legal matters. The AI-generated content is a starting point and should be reviewed before use.

## License

Proprietary - All rights reserved.
