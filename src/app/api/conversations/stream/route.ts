import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-Sent Events stream that polls the DB and emits a snapshot
// of conversation list state + most-recent message ids. Clients use
// this to invalidate caches when something changes.
//
// Polling-on-server is intentional — Postgres LISTEN/NOTIFY would be
// nicer but requires DB-side wiring we don't have yet. Each connected
// client adds one query/second to the DB.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let lastSignature = "";
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send("connected", { ts: new Date().toISOString() });

      const tick = async () => {
        if (cancelled) return;
        try {
          const conversations = await db.conversation.findMany({
            where: { status: "ACTIVE" },
            orderBy: { lastMessageAt: "desc" },
            take: 100,
            select: {
              twilioConversationSid: true,
              unreadCount: true,
              lastMessageAt: true,
            },
          });
          const signature = conversations
            .map(
              (c) =>
                `${c.twilioConversationSid}:${c.unreadCount}:${c.lastMessageAt?.getTime() ?? 0}`,
            )
            .join("|");
          if (signature !== lastSignature) {
            lastSignature = signature;
            send("update", { conversations });
          } else {
            send("ping", { ts: new Date().toISOString() });
          }
        } catch (err) {
          send("error", { message: err instanceof Error ? err.message : "stream error" });
        }
      };

      await tick();
      const interval = setInterval(tick, 4000);
      const onAbort = () => {
        cancelled = true;
        clearInterval(interval);
        controller.close();
      };
      req.signal.addEventListener("abort", onAbort);
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
