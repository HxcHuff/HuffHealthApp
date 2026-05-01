import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getConversationDetails,
  closeConversationAction,
  markConversationRead,
} from "@/actions/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ sid: string }> },
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { sid } = await ctx.params;
  const result = await getConversationDetails(sid);
  if ("error" in result) {
    return NextResponse.json(result, { status: 404 });
  }
  // Loading the thread means the agent has seen it — clear unread.
  await markConversationRead(sid);
  return NextResponse.json(result);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ sid: string }> },
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { sid } = await ctx.params;
  const body = (await req.json()) as { action?: string; reason?: string };

  if (body.action === "close") {
    const result = await closeConversationAction({
      twilioConversationSid: sid,
      reason: body.reason,
    });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
