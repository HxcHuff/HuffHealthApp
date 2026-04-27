## HuffHealth App

Next.js + Prisma CRM for leads, clients, tickets, and portal workflows.

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
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Netlify Cost Control (Local-First)

Netlify auto deploys are gated off by default for this repo.

- Any regular Git push build is skipped by `scripts/netlify-ignore-unapproved.sh`.
- Live deploys only run when you explicitly approve with:

```bash
npm run deploy:live -- --approve
```

This command sets `NETLIFY_APPROVED_DEPLOY=true` for that deploy and pushes production only when you intentionally trigger it.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
