import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { processIncomingFacebookLead } from "@/lib/facebook-leads";

// Webhook verification (Facebook sends GET request)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// Receive lead events from Facebook
export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify signature
  const signature = request.headers.get("x-hub-signature-256");
  if (signature && process.env.FACEBOOK_APP_SECRET) {
    const expected =
      "sha256=" +
      createHmac("sha256", process.env.FACEBOOK_APP_SECRET)
        .update(body)
        .digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const data = JSON.parse(body);

  if (data.object !== "page") {
    return NextResponse.json({ status: "ignored" });
  }

  for (const entry of data.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field === "leadgen") {
        const { leadgen_id, page_id, form_id } = change.value;
        // Process asynchronously - don't block the webhook response
        void processIncomingFacebookLead(leadgen_id, page_id, form_id);
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
