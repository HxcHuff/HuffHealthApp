import { NextRequest, NextResponse } from "next/server";
import type { MessageDeliveryStatus } from "@/generated/prisma/client";
import { processMessageStatus } from "@/lib/twilio/inbound-processor";
import { validateTwilioSignature } from "@/lib/twilio/signature";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequestUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}${req.nextUrl.pathname}`;
  return req.url;
}

function mapStatus(raw: string | undefined): MessageDeliveryStatus | null {
  switch ((raw ?? "").toLowerCase()) {
    case "queued":
      return "QUEUED";
    case "sent":
      return "SENT";
    case "delivered":
      return "DELIVERED";
    case "read":
      return "READ";
    case "failed":
      return "FAILED";
    case "undelivered":
      return "UNDELIVERED";
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const limit = checkRateLimit({
    key: `twilio-status:${ip}`,
    limit: 1200,
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
    const form = await req.formData();
    body = {};
    for (const [k, v] of form.entries()) body[k] = typeof v === "string" ? v : "";
  } catch {
    return NextResponse.json({ error: "Invalid form body" }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production") {
    if (!authToken) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const signature = req.headers.get("x-twilio-signature");
    const url = getRequestUrl(req);
    const valid = validateTwilioSignature({ authToken, signatureHeader: signature, url, body });
    if (!valid) {
      console.warn("[twilio-status] Invalid Twilio signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const messageSid = body.MessageSid ?? body.SmsSid;
  const status = mapStatus(body.MessageStatus ?? body.SmsStatus);

  if (!messageSid || !status) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  void (async () => {
    try {
      await processMessageStatus({
        messageSid,
        status,
        errorCode: body.ErrorCode || null,
        errorMessage: body.ErrorMessage || null,
      });
    } catch (err) {
      console.error("[twilio-status] async processing error", err);
    }
  })();

  return NextResponse.json({ ok: true }, { status: 200 });
}
