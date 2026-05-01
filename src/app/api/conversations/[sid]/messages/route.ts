import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  sendConversationMessage,
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
  const conversation = await db.conversation.findUnique({
    where: { twilioConversationSid: sid },
    select: { id: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const messages = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { sentAt: "asc" },
    take: 200,
  });
  await markConversationRead(sid);
  return NextResponse.json({ success: true, messages });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sid: string }> },
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { sid } = await ctx.params;
  const body = (await req.json()) as { body?: string };
  if (!body.body) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  const result = await sendConversationMessage({
    twilioConversationSid: sid,
    body: body.body,
  });
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
