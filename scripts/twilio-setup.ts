/**
 * One-shot Twilio configuration script.
 *
 * Idempotent: safe to re-run. Reads TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * TWILIO_WEBHOOK_BASE_URL from .env (or shell). Optionally reads existing
 * SIDs to update them in place; otherwise creates new services.
 *
 * Usage:
 *   npx tsx scripts/twilio-setup.ts                 # plan + apply
 *   npx tsx scripts/twilio-setup.ts --dry-run       # plan only
 *   npx tsx scripts/twilio-setup.ts --skip-messaging # skip Messaging Service config
 *
 * Env it reads:
 *   TWILIO_ACCOUNT_SID                (required)
 *   TWILIO_AUTH_TOKEN                 (required)
 *   TWILIO_WEBHOOK_BASE_URL           (required, e.g. https://app.example.com)
 *   TWILIO_CONVERSATIONS_SERVICE_SID  (optional — update in place)
 *   TWILIO_MESSAGING_SERVICE_SID      (optional — update in place)
 *
 * After it runs, copy the printed SIDs into your .env file.
 */

import "dotenv/config";
import twilio from "twilio";

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_MESSAGING = process.argv.includes("--skip-messaging");
const SKIP_CONVERSATIONS = process.argv.includes("--skip-conversations");

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const WEBHOOK_BASE = process.env.TWILIO_WEBHOOK_BASE_URL?.replace(/\/+$/, "");
let CONVERSATIONS_SERVICE_SID = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;
let MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN. Set them in .env or shell first.");
  process.exit(1);
}
if (!WEBHOOK_BASE) {
  console.error("Missing TWILIO_WEBHOOK_BASE_URL. Set it to your public app URL (e.g. https://app.example.com).");
  process.exit(1);
}

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const CONVERSATIONS_WEBHOOK_URL = `${WEBHOOK_BASE}/api/twilio/conversations/webhook`;
const STATUS_CALLBACK_URL = `${WEBHOOK_BASE}/api/twilio/conversations/status-callback`;
const CONVERSATION_EVENTS = [
  "onMessageAdded",
  "onConversationStateUpdated",
  "onParticipantAdded",
];

function logHeader(title: string) {
  console.log(`\n=== ${title} ===`);
}
function logPlan(action: string, detail: string) {
  console.log(`  [${DRY_RUN ? "DRY-RUN" : "APPLY"}] ${action}: ${detail}`);
}

async function setupConversationsService(): Promise<string | null> {
  if (SKIP_CONVERSATIONS) {
    logHeader("Conversations Service");
    console.log("  skipped (--skip-conversations)");
    return CONVERSATIONS_SERVICE_SID ?? null;
  }
  logHeader("Conversations Service");

  let serviceSid = CONVERSATIONS_SERVICE_SID;

  if (!serviceSid) {
    logPlan("create", "HuffHealth Conversations Service");
    if (!DRY_RUN) {
      const service = await client.conversations.v1.services.create({
        friendlyName: "HuffHealth Conversations",
      });
      serviceSid = service.sid;
      console.log(`  created service: ${serviceSid}`);
    } else {
      serviceSid = "IS_DRY_RUN_PLACEHOLDER";
    }
  } else {
    console.log(`  using existing service: ${serviceSid}`);
  }

  logPlan(
    "configure webhooks",
    `post-event=${CONVERSATIONS_WEBHOOK_URL}, events=${CONVERSATION_EVENTS.join(",")}`,
  );
  if (!DRY_RUN && serviceSid && serviceSid !== "IS_DRY_RUN_PLACEHOLDER") {
    await client.conversations.v1
      .services(serviceSid)
      .configuration.webhooks()
      .update({
        method: "POST",
        postWebhookUrl: CONVERSATIONS_WEBHOOK_URL,
        filters: CONVERSATION_EVENTS,
      });
    console.log("  webhooks updated");
  }

  return serviceSid ?? null;
}

async function setupMessagingService(): Promise<string | null> {
  if (SKIP_MESSAGING) {
    logHeader("Messaging Service");
    console.log("  skipped (--skip-messaging)");
    return MESSAGING_SERVICE_SID ?? null;
  }
  logHeader("Messaging Service");

  let serviceSid = MESSAGING_SERVICE_SID;

  if (!serviceSid) {
    logPlan("create", "HuffHealth A2P Messaging Service");
    if (!DRY_RUN) {
      const service = await client.messaging.v1.services.create({
        friendlyName: "HuffHealth A2P Messaging",
        inboundRequestUrl: CONVERSATIONS_WEBHOOK_URL,
        inboundMethod: "POST",
        statusCallback: STATUS_CALLBACK_URL,
        validityPeriod: 36000,
      });
      serviceSid = service.sid;
      console.log(`  created service: ${serviceSid}`);
    } else {
      serviceSid = "MG_DRY_RUN_PLACEHOLDER";
    }
  } else {
    logPlan(
      "update integration",
      `inbound=${CONVERSATIONS_WEBHOOK_URL}, status=${STATUS_CALLBACK_URL}, validity=36000s`,
    );
    if (!DRY_RUN) {
      await client.messaging.v1.services(serviceSid).update({
        inboundRequestUrl: CONVERSATIONS_WEBHOOK_URL,
        inboundMethod: "POST",
        statusCallback: STATUS_CALLBACK_URL,
        validityPeriod: 36000,
      });
      console.log("  service updated");
    }
  }

  return serviceSid ?? null;
}

async function verify() {
  logHeader("Verification");
  if (CONVERSATIONS_SERVICE_SID && !DRY_RUN) {
    const config = await client.conversations.v1
      .services(CONVERSATIONS_SERVICE_SID)
      .configuration.webhooks()
      .fetch();
    console.log(`  Conversations post-webhook: ${config.postWebhookUrl}`);
    console.log(`  Conversations filters: ${config.filters?.join(", ") ?? "(none)"}`);
  }
  if (MESSAGING_SERVICE_SID && !DRY_RUN) {
    const svc = await client.messaging.v1.services(MESSAGING_SERVICE_SID).fetch();
    console.log(`  Messaging inboundRequestUrl: ${svc.inboundRequestUrl}`);
    console.log(`  Messaging statusCallback: ${svc.statusCallback}`);
    console.log(`  Messaging validityPeriod: ${svc.validityPeriod}s`);
  }
}

async function main() {
  console.log(`Twilio setup ${DRY_RUN ? "(dry-run)" : ""}`);
  console.log(`  Account: ${ACCOUNT_SID}`);
  console.log(`  Webhook base: ${WEBHOOK_BASE}`);

  const convoSid = await setupConversationsService();
  if (convoSid) CONVERSATIONS_SERVICE_SID = convoSid;

  const msgSid = await setupMessagingService();
  if (msgSid) MESSAGING_SERVICE_SID = msgSid;

  await verify();

  logHeader("Summary — copy into .env");
  console.log(`TWILIO_CONVERSATIONS_SERVICE_SID="${CONVERSATIONS_SERVICE_SID ?? ""}"`);
  console.log(`TWILIO_MESSAGING_SERVICE_SID="${MESSAGING_SERVICE_SID ?? ""}"`);
  console.log(`TWILIO_WEBHOOK_BASE_URL="${WEBHOOK_BASE}"`);
  console.log("\nNext manual steps (Twilio API doesn't fully cover these):");
  console.log("  1. Submit / verify A2P 10DLC brand & campaign registration in console");
  console.log("  2. Attach your registered phone number to the Messaging Service Sender Pool");
  console.log("  3. Once approved, set LEAD_PIPELINE_DRY_RUN=false to enable real sends");
}

main().catch((err: unknown) => {
  console.error("\nSetup failed:", err);
  process.exit(1);
});
