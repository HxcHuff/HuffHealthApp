/**
 * Lead pipeline test harness.
 *
 * Simulates a public form submission against the ingest API. Use DRY_RUN to
 * verify the full router (classification + admin SMS + speed-to-lead + webhook)
 * without burning Twilio credits.
 *
 *   # Requires LEAD_INGEST_SECRET in env. The dev server must be running.
 *   LEAD_PIPELINE_DRY_RUN=true npx tsx scripts/simulate-lead.ts
 *   LEAD_PIPELINE_DRY_RUN=true npx tsx scripts/simulate-lead.ts --scenario=medicare
 *   LEAD_PIPELINE_DRY_RUN=true npx tsx scripts/simulate-lead.ts --scenario=fb-ad
 *   npx tsx scripts/simulate-lead.ts --scenario=aca --live
 */

import { config as loadEnv } from "dotenv";
loadEnv();

interface Scenario {
  name: string;
  description: string;
  payload: Record<string, unknown>;
}

const NOW = new Date().toISOString();

const SCENARIOS: Record<string, Scenario> = {
  aca: {
    name: "aca",
    description: "ACA marketplace lead from organic website form",
    payload: {
      source: "website_form",
      first_name: "Test",
      last_name: "ACA",
      phone: "8635550101",
      email: "test.aca@example.com",
      zip: "33805",
      household_size: 3,
      estimated_income: 48000,
      qualifying_event: "Lost employer coverage",
      tcpa_consent: true,
      tcpa_consent_text: "I agree to receive calls and texts from HuffHealth.",
      tcpa_timestamp: NOW,
      utm_source: "google",
      utm_campaign: "aca-2026-spring",
    },
  },
  medicare: {
    name: "medicare",
    description: "Medicare Advantage lead from referral",
    payload: {
      source: "referral",
      first_name: "Test",
      last_name: "Medicare",
      phone: "8635550102",
      email: "test.medicare@example.com",
      zip: "33813",
      tcpa_consent: true,
      tcpa_consent_text: "I agree to receive calls and texts from HuffHealth.",
      tcpa_timestamp: NOW,
    },
  },
  "fb-ad": {
    name: "fb-ad",
    description: "Facebook lead ad — should classify HOT/PAID",
    payload: {
      source: "fb_lead_ad",
      campaign: "FB-Spring-Polk-County",
      first_name: "Test",
      last_name: "FbAd",
      phone: "8635550103",
      email: "test.fb@example.com",
      zip: "33801",
      tcpa_consent: true,
      tcpa_consent_text: "I agree to receive calls and texts from HuffHealth.",
      tcpa_timestamp: NOW,
      utm_source: "facebook",
      utm_campaign: "polk-aca",
      utm_content: "carousel-v3",
    },
  },
  organic: {
    name: "organic",
    description: "Organic search lead — should classify WARM/ORGANIC",
    payload: {
      source: "website_form",
      first_name: "Test",
      last_name: "Organic",
      phone: "8635550104",
      email: "test.organic@example.com",
      zip: "33815",
      tcpa_consent: true,
      tcpa_consent_text: "I agree to receive calls and texts from HuffHealth.",
      tcpa_timestamp: NOW,
      utm_source: "organic",
    },
  },
};

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--")) {
      const [k, v] = arg.slice(2).split("=");
      args[k] = v ?? true;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const scenarioName = (args.scenario as string) ?? "aca";
  const live = !!args.live;

  const scenario = SCENARIOS[scenarioName];
  if (!scenario) {
    console.error(`Unknown scenario "${scenarioName}". Options: ${Object.keys(SCENARIOS).join(", ")}`);
    process.exit(1);
  }

  const baseUrl = process.env.SIMULATE_BASE_URL ?? "http://localhost:3000";
  const secret = process.env.LEAD_INGEST_SECRET;
  if (!secret) {
    console.error("LEAD_INGEST_SECRET is not set. Add it to .env or export it before running.");
    process.exit(1);
  }

  const dryRun = process.env.LEAD_PIPELINE_DRY_RUN === "true";

  console.log("─".repeat(60));
  console.log(`Lead pipeline simulation`);
  console.log(`  scenario:  ${scenario.name} — ${scenario.description}`);
  console.log(`  endpoint:  ${baseUrl}/api/leads/ingest`);
  console.log(`  dry run:   ${dryRun ? "YES (Twilio calls will be skipped)" : "NO — real SMS will send"}`);
  console.log(`  live mode: ${live ? "YES" : "NO"}`);
  console.log("─".repeat(60));

  if (!dryRun && !live) {
    console.error(
      "\nRefusing to run: not in DRY_RUN and --live was not passed.\n" +
        "Set LEAD_PIPELINE_DRY_RUN=true OR add --live to confirm real Twilio sends.",
    );
    process.exit(1);
  }

  const start = Date.now();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/leads/ingest`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(scenario.payload),
    });
  } catch (err) {
    console.error("Request failed:", err);
    process.exit(1);
  }

  const elapsed = Date.now() - start;
  const body = await res.text();
  let parsed: unknown = body;
  try {
    parsed = JSON.parse(body);
  } catch {
    /* keep as text */
  }

  console.log(`\nHTTP ${res.status} in ${elapsed}ms`);
  console.log(JSON.stringify(parsed, null, 2));

  if (res.ok) {
    console.log(
      "\nNote: the router runs asynchronously after the response. Check server logs",
    );
    console.log("for [sms] DRY_RUN entries and inspect the LeadEvent rows for ROUTED /");
    console.log("ADMIN_NOTIFIED / SMS_SENT / WEBHOOK_DISPATCHED records.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
