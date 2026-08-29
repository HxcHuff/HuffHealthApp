## Hopper

Next.js + Prisma CRM for leads, clients, tickets, and portal workflows.

Previously HuffHealthApp. GitHub repo name is still `HuffHealthApp` so existing remotes and Netlify links keep working.

## Sandbox Environment (Local)

This project now includes an isolated sandbox environment so you can test new CRM modules without affecting your main local database.

### One-time setup

```bash
cp .env.sandbox.example .env.sandbox.local
npm run sandbox:setup
```

### Run sandbox app

```bash
npm run dev:sandbox
```

### Sandbox control commands

```bash
npm run sandbox:up
npm run sandbox:down
npm run sandbox:reset
```

### Notes
- Sandbox Postgres runs on port `5434`.
- Sandbox script uses `.env.sandbox.local`.
- New workspace scaffold/navigation is controlled by `NEXT_PUBLIC_UI_V2_ENABLED`.
- Default seeded users:
  - `admin@huffhealth.com / password123`
  - `staff@huffhealth.com / password123`
  - `client@example.com / password123`

## Netlify Cost Control (Local-First)

Netlify auto deploys are now gated off by default for this repo.

- Any regular Git push build is skipped by `scripts/netlify-ignore-unapproved.sh`.
- Live deploys only run when you explicitly approve with:

```bash
npm run deploy:live -- --approve
```

This command sets `NETLIFY_APPROVED_DEPLOY=true` for that deploy and pushes production only when you intentionally trigger it.

## Internal Messaging Mode (CRM-Absorbed Drip)

This CRM can now run messaging internally (no separate Drip Engine service required).

- Set `DRIP_ENGINE_MODE="internal"` to use CRM-native endpoints:
  - `/api/messaging/webhook/intake`
  - `/api/messaging/contacts`
  - `/api/messaging/sequences`
- Keep `DRIP_ENGINE_API_KEY` set in staging/production to protect internal messaging routes.
- Use `.env.staging.example` and `.env.production.example` as rollout templates.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
