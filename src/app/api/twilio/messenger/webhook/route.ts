import { NextRequest, NextResponse } from "next/server";
import { processInboundMessage } from "@/lib/twilio/inbound-processor";
import { validateTwilioSignature } from "@/lib/twilio/signature";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  detectChannelFromAddress,
  emptyTwiml,
  isMessengerAddress,
  messengerConversationSid,
  parseMessengerId,
} from "@/lib/twilio/messenger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const count = Number.parseInt(body.NumMedia || "0", 10);
  const max = Number.isFinite(count) ? Math.min(count, 10) : 10;
  for (let i = 0; i < max; i++) {
    const url = body[`MediaUrl${i}`];
    if (url) urls.push(url);
  }
  return urls;
}

function twimlOk(): NextResponse {
  return new NextResponse(emptyTwiml(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const limit = checkRateLimit({
    key: `twilio-messenger:${ip}`,
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
      console.error("[twilio-messenger] TWILIO_AUTH_TOKEN not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const signature = req.headers.get("x-twilio-signature");
    const url = getRequestUrl(req);
    const valid = validateTwilioSignature({
      authToken,
      signatureHeader: signature,
      url,
      body,
    });
    if (!valid) {
      console.warn("[twilio-messenger] Invalid Twilio signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const from = body.From ?? "";
  const to = body.To ?? "";
  const messageSid = body.MessageSid ?? body.SmsSid;
  const channel = detectChannelFromAddress(from);

  console.info(
    `[twilio-messenger] inbound from=${from ? "messenger:***" : "?"} to=${to || "?"} sid=${messageSid ?? "?"}`,
  );

  if (channel !== "facebook_messenger" && from && !isMessengerAddress(from)) {
    console.warn(
      `[twilio-messenger] refusing non-Messenger inbound From=${from.slice(0, 12)} — will not treat as SMS`,
    );
    return twimlOk();
  }

  const psid = parseMessengerId(from);
  if (!psid || !messageSid) {
    return twimlOk();
  }

  const conversationSid =
    body.ConversationSid || messengerConversationSid(psid);
  const pageId = parseMessengerId(to);

  void (async () => {
    try {
      await processInboundMessage({
        conversationSid,
        messageSid,
        author: from,
        body: body.Body ?? null,
        mediaUrls: parseMediaUrls(body),
        participantPhone: `messenger:${psid}`,
        channel: "facebook_messenger",
        attributes: {
          facebookPsid: psid,
          facebookPageId: pageId,
          profileName: body.ProfileName || null,
          channel: "facebook_messenger",
        },
      });
    } catch (err) {
      console.error("[twilio-messenger] async processing error", err);
    }
  })();

  return twimlOk();
}
