# Scale Readiness Checklist (Pilot -> 2k Users)

## 1) Environment Baseline
- Use `/Users/david_huff/HuffHealthApp/.env.staging.example` for staging.
- Use `/Users/david_huff/HuffHealthApp/.env.production.example` for production.
- Keep `DRIP_ENGINE_MODE=internal` to run messaging inside CRM.
- Set `DRIP_ENGINE_API_KEY` and `DRIP_WEBHOOK_SECRET` before production.

## 2) Providers & Domains
- Configure SendGrid sender identity + SPF/DKIM/DMARC.
- Configure Twilio number + status callback URL.
- Point callbacks to CRM routes, not standalone Drip service.
- Validate HTTPS and correct subdomain routing.

## 3) Data & DB
- Run Prisma schema sync/migrations before pilot traffic.
- Verify indexes exist for high-traffic lists and timeline queries.
- Enable automated DB backups and test restore.

## 4) Security
- Enforce API key auth on messaging intake routes.
- Enforce webhook secret on drip callback route.
- Rotate keys every 90 days.
- Keep all secrets in provider secret manager (never in code).

## 5) Reliability
- Add queue/outbox worker for outbound messaging (next phase).
- Add retry + dead-letter policy for failed sends.
- Add idempotency on inbound callbacks.

## 6) Monitoring
- Track `/api/health`, messaging intake errors, callback failures.
- Set alerts on 5xx spikes and provider failures.
- Track delivery rates by channel.

## 7) Go-Live Controls
- Keep Netlify auto-deploy gate enabled.
- Deploy only with approved command.
- Roll out pilot team first, then staged expansion.
