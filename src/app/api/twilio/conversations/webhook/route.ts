import { NextRequest, NextResponse } from "next/server";
import {
  processInboundMessage,
  processConversationState,
} from "@/lib/twilio/inbound-processor";
import { validateTwilioSignature } from "@/lib/twilio/signature";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateTwilioEnv } from "@/lib/twilio/env-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

validateTwilioEnv();

function getRequestUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}${req.nextUrl.pathname}`;
  return req.url;
}

async function readForm(req: NextRequest): Promise<Record<string, string>> {
  const form = await req.formData();
  const body: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    body[key] = typeof value === "string" ? value : "";
  }
  return body;
}

function parseMediaUrls(body: Record<string, string>): string[] {
  const urls: string[] = [];
  // Twilio Conversations webhook media format: Media (JSON string array)
  if (body.Media) {
    try {
      const parsed = JSON.parse(body.Media) as Array<{ Sid?: string; Filename?: string }>;
      const accountSid = body.AccountSid;
      const serviceSid = body.ChatServiceSid;
      for (const m of parsed) {
        if (m.Sid && accountSid && serviceSid) {
          urls.push(
            `https://mcs.us1.twilio.com/v1/Services/${serviceSid}/Media/${m.Sid}`,
          );
        }
      }
    } catch {
      // ignore
    }
  }
  // Fallback for MMS-style MediaUrl0..MediaUrl9
  for (let i = 0; i < 10; i++) {
    const url = body[`MediaUrl${i}`];
    if (url) urls.push(url);
  }
  return urls;
}

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Rate limit: 600 requests per minute per source IP — generous for Twilio
  // burst traffic but keeps a single rogue source from melting the DB.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const limit = checkRateLimit({
    key: `twilio-webhook:${ip}`,
    limit: 600,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: Record<string, string>;
  try {
    body = await readForm(req);
  } catch {
    return NextResponse.json({ error: "Invalid form body" }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production") {
    if (!authToken) {
      console.error("[twilio-webhook] TWILIO_AUTH_TOKEN not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const signature = req.headers.get("x-twilio-signature");
    const url = getRequestUrl(req);
    const valid = validateTwilioSignature({ authToken, signatureHeader: signature, url, body });
    if (!valid) {
      console.warn("[twilio-webhook] Invalid Twilio signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const eventType = body.EventType;
  console.info(`[twilio-webhook] event=${eventType} convo=${body.ConversationSid ?? body.Sid ?? "?"}`);

  // Fire-and-forget — return 200 fast, process async
  void (async () => {
    try {
      switch (eventType) {
        case "onMessageAdded": {
          const conversationSid = body.ConversationSid;
          const messageSid = body.MessageSid ?? body.Sid;
          if (!conversationSid || !messageSid) return;
          // Inbound only — skip our own outbound echoes (author === proxy phone)
          const author = body.Author ?? null;
          const phoneNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;
          if (author && phoneNumber && author === phoneNumber) {
            return; // outbound echo — already recorded by sendMessage
          }
          await processInboundMessage({
            conversationSid,
            messageSid,
            author,
            body: body.Body ?? null,
            mediaUrls: parseMediaUrls(body),
            participantPhone: author,
            channel: author?.startsWith("whatsapp:") ? "whatsapp" : "sms",
          });
          break;
        }
        case "onConversationStateUpdated": {
          const conversationSid = body.ConversationSid ?? body.Sid;
          const state = body.State as "active" | "inactive" | "closed";
          if (!conversationSid || !state) return;
          await processConversationState({ conversationSid, state });
          break;
        }
        default:
          // Other events like onParticipantAdded — accept silently
          break;
      }
    } catch (err) {
      console.error("[twilio-webhook] async processing error", err);
    }
  })();

  return NextResponse.json({ ok: true }, { status: 200 });
}
