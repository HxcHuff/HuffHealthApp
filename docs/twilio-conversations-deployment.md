# Twilio Conversations — Deployment Checklist

## Pre-flight items required in the Twilio Console (NOT code changes)

These must be configured manually in https://console.twilio.com before
the integration is functional in production:

1. **A2P 10DLC brand & campaign registration** — required for US business SMS.
   Status as of 2026-05-01: registration in progress (see memory/lead-pipeline-a2p-status.md).
2. **Conversations Service** — create one, copy the SID into `TWILIO_CONVERSATIONS_SERVICE_SID`.
3. **Messaging Service** — attach your registered phone numbers, copy the SID into `TWILIO_MESSAGING_SERVICE_SID`.
4. **Webhook URLs** in Conversations Service settings:
   - `Pre-Event URL`: leave unset
   - `Post-Event URL`: `https://<your-domain>/api/twilio/conversations/webhook`
   - Subscribed events: `onMessageAdded`, `onConversationStateUpdated`, `onParticipantAdded`
5. **Status callback URL** on the Messaging Service:
   `https://<your-domain>/api/twilio/conversations/status-callback`
6. **WhatsApp** (optional) — Sender registration via WhatsApp Business API.

## Environment variables

Required (production):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` (or `TWILIO_FROM_NUMBER`)
- `TWILIO_CONVERSATIONS_SERVICE_SID`
- `TWILIO_MESSAGING_SERVICE_SID`
- `TWILIO_WEBHOOK_BASE_URL` — used for signature validation

Optional:
- `TWILIO_AUTOMATION_NEW_LEAD=false` — disable new-lead first-touch automation
- `TWILIO_AUTOMATION_ENROLLMENT=false` — disable enrollment confirmations
- `TWILIO_AUTOMATION_RENEWAL=false` — disable renewal reminders
- `TWILIO_AUTOMATION_SEP=false` — disable SEP outreach
- `HEALTHSHERPA_AGENT_ID` — broker ID embedded in enrollment URLs
- `HEALTHSHERPA_MEDICARE_AGENT_EMAIL` — fallback email shown in document requests
- `LEAD_PIPELINE_DRY_RUN=true` — simulate sends, never call Twilio (recommended until A2P approval)

## Compliance posture (verified)

- ✅ TCPA consent checked before every outbound (`src/lib/twilio/compliance.ts`)
- ✅ Medicare leads blocked from automated outbound (CMS cold-outbound rule)
- ✅ Time-of-day enforcement: 8am–9pm America/New_York
- ✅ Daily automation limit: 1 outbound per lead per 24h
- ✅ STOP/UNSUBSCRIBE/CANCEL/QUIT keywords trigger immediate consent revocation
- ✅ Standard STOP confirmation reply sent (bypasses consent check as a TCPA-required service message)
- ✅ All automated templates include "Reply STOP to opt out."
- ✅ Webhook signature validation enforced when `NODE_ENV === "production"`
- ✅ ConsentLog is append-only (revocations set `revokedAt`, never delete rows)
- ✅ Phone numbers masked in logs via `maskPhone()` (no full E.164 in console output)

## Open TODOs (not blocking initial deploy)

- **Failed message retry queue** — currently `MessageDeliveryStatus = FAILED` flags the conversation
  for review but doesn't auto-retry with exponential backoff. Add a background worker (or
  Netlify scheduled function) that picks up failed messages and re-tries up to 3 times before
  moving to a dead-letter state.
- **Media storage** — inbound MMS URLs from Twilio's MCS endpoint require auth-on-fetch.
  We store the URL but don't yet stream the bytes into our own HIPAA-controlled storage
  (e.g., Supabase Storage with RLS). Until done, treat media URLs as ephemeral.
- **Postgres LISTEN/NOTIFY for SSE** — current `/api/conversations/stream` polls the DB
  every 4 seconds per connected client. Switch to LISTEN/NOTIFY for true push, or to
  Supabase Realtime if migrating.
- **Rate limiter is in-memory** — fine for single-instance Netlify; replace with Redis
  (Upstash) when scaling horizontally.
- **Migration not yet applied** — run `npx prisma migrate deploy` in target environment
  to apply `20260501150000_add_conversations_messages_consent`.

## Smoke test checklist

After Twilio account config:

1. POST to `/api/leads/ingest` with `tcpa_consent: true`, `tcpa_consent_text: "..."` →
   verify `ConsentLog` row created with `consentMethod: WEB_FORM`.
2. From the dashboard, open the lead and click "Send enrollment link" → message appears
   in conversation thread, Activity log records the send.
3. Reply to the SMS from a real phone → inbound message appears in dashboard within 5s.
4. Reply "STOP" → status becomes CLOSED, ConsentLog row gets `revokedAt`, confirmation SMS
   delivered, lead's outbound is blocked on next attempt.
5. Open `/api/analytics/conversations?period=week` → JSON response with totals & funnel.
