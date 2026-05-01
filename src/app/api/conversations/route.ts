import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listConversations } from "@/actions/conversations";
import type { ConversationStatus, ConversationChannel } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const result = await listConversations({
    status: (url.searchParams.get("status") as ConversationStatus) || undefined,
    channel: (url.searchParams.get("channel") as ConversationChannel) || undefined,
    unreadOnly: url.searchParams.get("unreadOnly") === "true",
    search: url.searchParams.get("search") || undefined,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
  });

  if ("error" in result) {
    return NextResponse.json(result, { status: 401 });
  }

  return NextResponse.json(result);
}
