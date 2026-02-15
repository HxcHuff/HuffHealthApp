# HuffHealthApp

CRM + Client Portal web application for managing health/business leads, support tickets, and client communications.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5
- **UI:** React 19, Tailwind CSS 4 (PostCSS plugin), Lucide React icons
- **Database:** PostgreSQL 17 via Prisma 7 (PrismaPg adapter)
- **Auth:** NextAuth v5 (beta) with Credentials provider, JWT strategy
- **Email:** Resend
- **Charts:** Recharts
- **Validation:** Zod
- **Integrations:** Facebook Leads API

## Quick Setup

```bash
brew install postgresql@17
brew services start postgresql@17
createdb huffhealthapp
cp .env.example .env  # then fill in DATABASE_URL and NEXTAUTH_SECRET
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Test Accounts

| Role   | Email                   | Password    |
|--------|-------------------------|-------------|
| Admin  | admin@huffhealth.com    | password123 |
| Staff  | staff@huffhealth.com    | password123 |
| Client | client@example.com      | password123 |

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, register pages
│   ├── (dashboard)/      # Admin/Staff routes (leads, tickets, settings)
│   ├── (portal)/         # Client portal routes
│   └── api/              # API routes (auth, webhooks)
├── actions/              # Server actions (auth, leads, tickets, dashboard, etc.)
├── components/           # React components organized by feature
├── hooks/                # Custom React hooks
├── lib/                  # Utilities, constants, validations, db client
├── providers/            # Context providers (auth, session)
├── types/                # TypeScript type declarations
└── generated/prisma/     # Generated Prisma client (gitignored)
prisma/
├── schema.prisma         # Database schema
├── migrations/           # Migration files
└── seed.ts               # Seed script
```

## Key Conventions

### File Naming
- Files: `kebab-case.tsx` (e.g., `lead-table.tsx`)
- Components: `PascalCase` (e.g., `LeadTable`)
- Functions: `camelCase` (e.g., `createLead`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `LEAD_STATUS_OPTIONS`)

### Imports
- Always use `@/` path alias (maps to `./src/`)
- Order: Next.js → external libraries → local code
- Icons from `lucide-react`

### Components
- `"use client"` directive for interactive components
- Server components are the default (async functions)
- Props defined with `interface` (e.g., `interface LeadTableProps`)
- Named exports (not default) for components

### Server Actions
- `"use server"` directive at top of file
- Auth check: `const session = await auth()`
- Role check: `if (!["ADMIN", "STAFF"].includes(session.user.role))`
- Validation: `Schema.safeParse()` before DB operations
- Return pattern: `{ success: true, id }` or `{ error: "message" }`
- Always call `revalidatePath()` after mutations
- Log activities for audit trail

### Database
- Singleton Prisma client in `src/lib/db.ts` (exported as `db`)
- Generated client at `@/generated/prisma/client`
- Use `include: {}` for related data
- Activity logging for all lead/ticket mutations

### Layouts
- `export const dynamic = "force-dynamic"` on layout files
- Auth redirect in dashboard layout (unauthenticated → `/login`, CLIENT → `/portal`)
- Wrapped with `AuthProvider`

### Validation
- Zod schemas in `src/lib/validations/`
- Separate Create/Update schemas per entity
- Export inferred types: `type CreateLeadInput = z.infer<typeof CreateLeadSchema>`

### Styling
- Tailwind CSS utility classes
- `cn()` helper from `@/lib/utils` for conditional classes (clsx + tailwind-merge)
- Status badges use color maps (blue=NEW, yellow=CONTACTED, purple=QUALIFIED, green=CONVERTED, red=LOST)

## Common Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## User Roles

- **ADMIN** — Full access: manage leads, tickets, users, settings, integrations
- **STAFF** — Manage leads and tickets, limited settings access
- **CLIENT** — Portal access only: view announcements, submit/track tickets

## Data Models

- **User** — Auth, roles, profile
- **Lead** — Status pipeline (NEW → CONTACTED → QUALIFIED → CONVERTED | LOST)
- **LeadList** — Bulk import tracking
- **Contact** — Linked contact info for leads
- **Ticket** — Support tickets with priority (LOW/MEDIUM/HIGH/URGENT) and status
- **TicketComment** — Internal and external comments
- **Activity** — Audit log (notes, status changes, assignments, emails, calls, etc.)
- **Announcement** — Admin-published announcements for portal
- **FacebookIntegration** — Facebook Lead Ad sync configuration
