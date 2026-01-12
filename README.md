# LandlordComply

A jurisdiction-aware compliance engine for security deposit dispositions. Generate legally compliant notice letters, track deadlines, and avoid costly penalties.

**"A $99 tool to avoid a $5,000 mistake."**

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: PostgreSQL via Supabase + Prisma ORM
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **PDF Generation**: @react-pdf/renderer
- **AI**: Google Gemini API (optional)
- **UI**: Tailwind CSS v4 + shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (or PostgreSQL database)

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env` file with your credentials:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
GOOGLE_AI_API_KEY="your-gemini-api-key"  # Optional
```

3. Initialize the database:

```bash
npx prisma generate
npx prisma db push
npx tsx scripts/setup-storage.ts
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

## Documentation

- `CLAUDE.md` - Full project context and architecture
- `docs/AI_INTEGRATION.md` - AI features documentation

## License

Proprietary - All rights reserved.
