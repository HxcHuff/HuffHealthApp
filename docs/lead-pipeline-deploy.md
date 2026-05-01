# Lead Pipeline Deploy Checklist

End-to-end runbook for shipping the lead-ingest → router → speed-to-lead → CRM
pipeline. Follow in order. Every section is gated by the previous one.

---

## 0. What this pipeline does

```
Public form  ─►  POST /api/leads/ingest  ─►  Lead row + LeadEvent(CREATED)
                                              │
                                              ├─►  classifyLead() ── PAID? → priority=HOT
                                              ├─►  Twilio SMS to ADMIN_NOTIFY_PHONE
                                              ├─►  Twilio SMS to lead (LOB-templated)
                                              └─►  POST LEAD_ROUTER_WEBHOOK_URL
```

The router runs **fire-and-forget** after the ingest response, so the public
endpoint stays fast and Twilio outages cannot block lead capture.

---

## 1. Twilio A2P 10DLC registration (REQUIRED — do this first)

US carriers reject business SMS from un-registered 10-digit numbers. Plan for
**1–3 weeks** between brand submission and a campaign that can send.

1. Twilio Console → **Messaging → Regulatory Compliance → Brand**
   - Pick **Standard Brand** (Sole Prop is cheaper but capped at 3,000 msgs/day).
   - Submit EIN, legal business name, address, website, vertical = `INSURANCE`.
2. Once the brand is **VERIFIED**, create a **Campaign**.
   - Use case: **Customer Care** (some agents also add **Marketing** if they
     plan promotional drips).
   - Sample messages: paste the actual templates from
     `src/lib/sms-templates.ts` so the carrier review matches what we send.
   - Opt-in description: describe the form. Reference the TCPA consent text
     we store on every lead.
   - Help/STOP keywords are auto-handled by Twilio — verify they're enabled.
3. After campaign is **READY**, attach a phone number:
   Console → **Messaging → Senders → Add Sender → Phone Numbers**.
4. Copy the verified number (E.164) into `TWILIO_FROM_NUMBER`.
5. Generate an Auth Token with messaging scope and copy it into
   `TWILIO_AUTH_TOKEN`. Account SID → `TWILIO_ACCOUNT_SID`.

> **Compliance reminder:** the speed-to-lead SMS already includes
> `Reply STOP to opt out.` — do not remove it. The TCPA consent timestamp,
> consent text, and IP are persisted on every lead row for evidence.

---

## 2. Database migration

```bash
# In the deploy environment:
npx prisma migrate deploy
```

This applies `20260501120000_add_lead_router_fields`, which:
- Adds enums `LeadPriority`, `LeadSourceCategory`.
- Adds enum values `ROUTED`, `ADMIN_NOTIFIED`, `WEBHOOK_DISPATCHED` to `LeadEventType`.
- Adds columns `priority`, `sourceCategory`, `routedAt`, `speedToLeadAt` to `Lead`.
- Adds two indexes on `Lead(priority)` and `Lead(sourceCategory)`.

Existing rows backfill `priority = COLD` and `sourceCategory = NULL`. If you
want to retro-classify history, run a one-off script that calls `classifyLead`
on each row. The migration is forward-only safe.

---

## 3. Environment variables

Add these to Netlify (Site → Environment variables) for each environment:

| Variable | Required? | Notes |
|---|---|---|
| `LEAD_INGEST_SECRET` | yes | Already exists. Bearer token for the ingest endpoint. |
| `LEAD_PIPELINE_DRY_RUN` | dev/staging | `"true"` to skip real Twilio sends. **Unset or `"false"` in prod.** |
| `ADMIN_NOTIFY_PHONE` | yes (prod) | E.164. Receives the instant new-lead alert. |
| `AGENT_DISPLAY_NAME` | recommended | Shown in the speed-to-lead SMS (e.g. `David at HuffHealth`). |
| `LEAD_ROUTER_WEBHOOK_URL` | optional | Posts a classified-lead JSON. Use for Zapier, Make, or a downstream CRM mirror. |
| `LEAD_ROUTER_WEBHOOK_SECRET` | optional | Sent as `x-webhook-secret`. Verify it on the receiver. |
| `TWILIO_ACCOUNT_SID` | yes (prod) | From step 1. |
| `TWILIO_AUTH_TOKEN` | yes (prod) | From step 1. |
| `TWILIO_MESSAGING_SERVICE_SID` | recommended (prod) | E.g. `MGxxxxxxxx`. Preferred for A2P 10DLC — sends via the campaign-attributed Messaging Service, gets STOP/HELP auto-handling and number fallback. |
| `TWILIO_FROM_NUMBER` | required if MSG_SERVICE not set | E.164. Used only when `TWILIO_MESSAGING_SERVICE_SID` is unset. |
| `NEXT_PUBLIC_APP_URL` | yes | Used to build the deep link in the admin alert SMS. |

---

## 4. Pre-deploy verification (staging)

```bash
# In a staging branch with LEAD_PIPELINE_DRY_RUN=true and the dev server running:
npm run db:migrate
npm run dev

# In another terminal:
npm run simulate:lead -- --scenario=fb-ad
npm run simulate:lead -- --scenario=aca
npm run simulate:lead -- --scenario=medicare
npm run simulate:lead -- --scenario=organic
```

Verify in the server logs:
- `[lead-ingest]` line shows `Created lead: <id>`
- `[sms] DRY_RUN to=+1...` lines for both the admin alert and the lead text
- No `[lead-router] failed` errors

Verify in the database:
```sql
SELECT id, "firstName", priority, "sourceCategory", "routedAt"
FROM "Lead" ORDER BY "createdAt" DESC LIMIT 4;

SELECT type, "createdAt", payload
FROM "LeadEvent" WHERE "leadId" = '<the lead id>' ORDER BY "createdAt";
-- Expect: CREATED, ROUTED, ADMIN_NOTIFIED, SMS_SENT, WEBHOOK_DISPATCHED
```

`fb-ad` should be `priority=HOT, sourceCategory=PAID`.
`organic` should be `priority=WARM, sourceCategory=ORGANIC`.

---

## 5. Production cutover

1. Merge to `main`. Netlify deploy will run `prisma migrate deploy` per the
   existing build pipeline.
2. Confirm env vars in Netlify Production:
   - `LEAD_PIPELINE_DRY_RUN` is **unset** or `"false"`.
   - `TWILIO_*` and `ADMIN_NOTIFY_PHONE` are populated.
3. Send a single live test:
   ```bash
   SIMULATE_BASE_URL=https://YOUR-DOMAIN \
   LEAD_INGEST_SECRET=$(netlify env:get LEAD_INGEST_SECRET) \
   tsx scripts/simulate-lead.ts --scenario=aca --live
   ```
   You should receive: (a) the admin alert on `ADMIN_NOTIFY_PHONE`, and (b) the
   speed-to-lead SMS on the test phone (use a number you control for the
   payload).
4. Hit `/api/leads?priority=HOT&limit=5` while authenticated — confirm the
   test lead appears with `routedAt` populated.

---

## 6. Rollback plan

If Twilio starts erroring or the router misbehaves:

```bash
# Fast disable: flip dry-run on in Netlify env (no redeploy needed for new requests).
netlify env:set LEAD_PIPELINE_DRY_RUN true --context production
```

The ingest endpoint keeps working. Speed-to-lead and admin alerts log only.

To roll back the schema (only if you absolutely must):
```bash
# WARNING: drops priority/sourceCategory data.
psql "$DATABASE_URL" -c '
  ALTER TABLE "Lead"
    DROP COLUMN "priority",
    DROP COLUMN "sourceCategory",
    DROP COLUMN "routedAt",
    DROP COLUMN "speedToLeadAt";
  DROP TYPE "LeadPriority";
  DROP TYPE "LeadSourceCategory";
'
```

The new `LeadEventType` values cannot be removed without dropping and
recreating the enum, so leave them in place — they're inert if unused.

---

## 7. Operational checks (first 48h)

- Twilio Console → **Monitor → Messaging Logs**: watch error rate. Common
  rejections: unverified number, opt-out list hits (expected), missing brand.
- Netlify function logs: `[lead-router] failed for lead` lines indicate
  webhook outages or DB issues — investigate, the router is idempotent on
  `routedAt` so re-running is safe.
- DB query weekly:
  ```sql
  SELECT date_trunc('day', "createdAt") AS day,
         "sourceCategory",
         "priority",
         count(*)
  FROM "Lead"
  WHERE "createdAt" > now() - interval '7 days'
  GROUP BY 1, 2, 3
  ORDER BY 1 DESC, 2;
  ```
  Use this to validate that PAID classification matches what your ad spend
  reports show.

---

## 8. File map

| Path | Purpose |
|---|---|
| `src/app/api/leads/ingest/route.ts` | Public ingest endpoint. Validates, dedupes, creates the lead, fires the router. |
| `src/app/api/leads/route.ts` | Authenticated list endpoint with status / priority / sourceCategory filters and cursor pagination. |
| `src/app/api/leads/[id]/route.ts` | Authenticated GET (with events) and PATCH for status/priority/assignment. |
| `src/lib/lead-router.ts` | `classifyLead()` + `routeLead()` + `routeLeadAsync()`. |
| `src/lib/sms.ts` | Twilio sender. Honors `LEAD_PIPELINE_DRY_RUN`. |
| `src/lib/sms-templates.ts` | LOB-aware speed-to-lead templates + admin alert template. |
| `prisma/migrations/20260501120000_add_lead_router_fields/` | Schema migration. |
| `scripts/simulate-lead.ts` | DRY_RUN harness. Four scenarios: aca, medicare, fb-ad, organic. |
