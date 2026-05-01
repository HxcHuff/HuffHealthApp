// Startup-time validation for Twilio environment variables.
// Logs warnings for missing config but does not throw — Twilio is optional
// in dev/staging where LEAD_PIPELINE_DRY_RUN=true.
//
// Call this once from server entry (e.g., proxy.ts or a layout).

let validated = false;

export function validateTwilioEnv(): {
  ok: boolean;
  missing: string[];
  warnings: string[];
} {
  if (validated) return { ok: true, missing: [], warnings: [] };
  validated = true;

  const required = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_CONVERSATIONS_SERVICE_SID",
  ];
  const missing = required.filter((k) => !process.env[k]);

  const warnings: string[] = [];
  if (!process.env.TWILIO_PHONE_NUMBER && !process.env.TWILIO_FROM_NUMBER) {
    warnings.push("TWILIO_PHONE_NUMBER (or TWILIO_FROM_NUMBER) not set");
  }
  if (!process.env.TWILIO_MESSAGING_SERVICE_SID) {
    warnings.push("TWILIO_MESSAGING_SERVICE_SID not set — required for A2P 10DLC routing");
  }
  if (!process.env.TWILIO_WEBHOOK_BASE_URL) {
    warnings.push("TWILIO_WEBHOOK_BASE_URL not set — webhook signature validation may fail");
  }
  if (process.env.LEAD_PIPELINE_DRY_RUN === "true") {
    warnings.push("LEAD_PIPELINE_DRY_RUN=true — Twilio sends are simulated only");
  }

  if (missing.length > 0) {
    console.warn(`[twilio-env] missing required vars: ${missing.join(", ")}`);
  }
  for (const w of warnings) {
    console.warn(`[twilio-env] ${w}`);
  }

  return { ok: missing.length === 0, missing, warnings };
}
