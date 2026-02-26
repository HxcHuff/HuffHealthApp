# Huff Health Business Continuity Log

Purpose: timestamped operational record of infrastructure, integration, deploy-gating, and go-live readiness decisions.

## Update Protocol
- Add a new dated entry for each major change or decision.
- Keep exact paths, commands, and validation outcomes.
- Treat this as the single source of truth for launch-readiness history.

## 2026-02-20 13:09:13 EST
- Added Netlify deploy-cost control in both local HuffHealth repos using approval-only deploy gating.
- Added scripts: `scripts/netlify-ignore-unapproved.sh`, `scripts/netlify-deploy-approved.sh` and `deploy:live` npm command.
- Added bulk rollout script: `/Users/david_huff/HuffHealthApp/scripts/apply-netlify-deploy-gate-all-repos.sh` and applied it across local repos.
- Brought up local Drip Engine sandbox at `http://localhost:8888`; validated `/api/health` returns 200.
- Brought up Huff Health sandbox at `http://localhost:3000` with sandbox Postgres on `localhost:5434`.
- Began cross-app local wiring so Huff Health and Drip Engine can communicate through sandbox env variables.
- Identified API key generator dependency: Huff Health requires `ENCRYPTION_KEY` (64-hex) for key encryption before save.
- Added server-action error handling in `/Users/david_huff/HuffHealthApp/src/actions/api-keys.ts` so generation failures surface clean messages.

## 2026-02-20 15:20:32 EST
- Rebranded Drip Engine admin UI from Lakeland naming to AI Applied in /Users/david_huff/lakeland-drip-engine/public/index.html.
- Updated visible NPN references to 18213932 in dashboard and unsubscribe experience.
- Added hover quick-links dropdown menu in admin header for direct section and CRM integration access.
- Added per-tab entry pages (channels.html, templates.html, sequences.html, segments.html, contacts.html, testsend.html, compliance.html, apikeys.html, analytics.html) routing to index.html?page=<tab>.

## 2026-02-20 15:54:38 EST
- Began CRM absorption of Drip Engine by adding CRM-native messaging endpoints:
  - /api/messaging/webhook/intake
  - /api/messaging/contacts
  - /api/messaging/sequences
- Updated drip client routing in /Users/david_huff/HuffHealthApp/src/lib/drip-engine.ts to use internal CRM endpoints by default (`DRIP_ENGINE_MODE=internal`) with external fallback mode retained.
- Hardened drip callback handling in /Users/david_huff/HuffHealthApp/src/app/api/drip-webhook/route.ts:
  - Production now requires webhook secret to be configured.
  - Added idempotency via DripWebhookReceipt event ledger.
- Added schema + migration for callback idempotency receipts:
  - model DripWebhookReceipt
  - migration 20260220160000_add_drip_webhook_receipts
- Added scaling setup artifacts:
  - /Users/david_huff/HuffHealthApp/.env.staging.example
  - /Users/david_huff/HuffHealthApp/.env.production.example
  - /Users/david_huff/HuffHealthApp/scripts/preflight-scale.sh
  - /Users/david_huff/HuffHealthApp/docs/scale-readiness-checklist.md
- Improved lint signal quality by ignoring generated Netlify artifacts in ESLint config.

## 2026-02-20 16:16:26 EST
- Converted Command Center from mock-only to live CRM-driven data for health-insurance operations.
- Added `getCommandCenterData()` in /Users/david_huff/HuffHealthApp/src/actions/dashboard.ts to aggregate live KPIs, priority queue, team pulse, operational buckets, and compliance watch metrics.
- Updated /Users/david_huff/HuffHealthApp/src/components/v2/workspaces/command-center-workspace.tsx to accept and render backend-provided data while preserving existing UI structure.
- Updated /Users/david_huff/HuffHealthApp/src/app/(dashboard)/dashboard/page.tsx to fetch and pass live command center data when UI v2 is enabled.

## 2026-02-25 20:16:49 EST
- Simplified Command Center visual density while preserving workflows in /Users/david_huff/HuffHealthApp/src/components/v2/workspaces/command-center-workspace.tsx.
- Added display theme controls (`Light`, `Dark`, `System`) with persisted preference and startup theme bootstrap:
  - /Users/david_huff/HuffHealthApp/src/components/settings/display-settings-card.tsx
  - /Users/david_huff/HuffHealthApp/src/app/layout.tsx
  - /Users/david_huff/HuffHealthApp/src/app/globals.css
- Fixed sidebar hydration mismatch by switching collapsed-state persistence to `useSyncExternalStore` in /Users/david_huff/HuffHealthApp/src/components/layout/sidebar.tsx.
- Reduced collapsed sidebar icon overload, removed bottom Drip Engine shortcut, and promoted Actions into primary navigation in /Users/david_huff/HuffHealthApp/src/components/layout/sidebar.tsx.
- Upgraded `/settings/sources` into a functional lead-source workspace with drag/drop agent-priority scoring model and editable block labels in /Users/david_huff/HuffHealthApp/src/components/settings/lead-source-manager.tsx.
- Added per-agent Google Calendar OAuth connection flow:
  - /Users/david_huff/HuffHealthApp/src/app/api/integrations/google/calendar/callback/route.ts
  - /Users/david_huff/HuffHealthApp/src/actions/google-calendar.ts
  - /Users/david_huff/HuffHealthApp/src/components/settings/google-calendar-integration.tsx
  - /Users/david_huff/HuffHealthApp/src/app/(dashboard)/settings/integrations/google-calendar/page.tsx
- Added Client Management Script Sandbox (create/save/load/delete/templates) in:
  - /Users/david_huff/HuffHealthApp/src/components/actions/client-script-sandbox.tsx
  - /Users/david_huff/HuffHealthApp/src/app/(dashboard)/actions/client-management/page.tsx
- Implemented secure temporary CRM Drop Box with 96-hour auto-purge policy:
  - API upload/list/delete/download routes under /Users/david_huff/HuffHealthApp/src/app/api/dropbox/
  - storage/purge service in /Users/david_huff/HuffHealthApp/src/lib/dropbox.ts
  - UI operationalization in /Users/david_huff/HuffHealthApp/src/components/v2/workspaces/documents-workspace.tsx and /Users/david_huff/HuffHealthApp/src/app/(dashboard)/documents/page.tsx
- Prepared calendar operationalization backend by adding calendar revalidation and month task query helper in /Users/david_huff/HuffHealthApp/src/actions/tasks.ts (UI completion deferred while integration/security priorities were handled first).

## 2026-02-25 20:18:57 EST
- Ran full lint as a stabilization checkpoint before extended sandbox iteration.
- Resolved blocking lint failures from `react-hooks/error-boundaries` by removing JSX `try/catch` wrapping in /Users/david_huff/HuffHealthApp/src/app/(dashboard)/dashboard/page.tsx and relying on framework error boundaries.
- Validation result: lint now passes with warnings only (no errors), enabling continued dev flow without build/lint blockers.
