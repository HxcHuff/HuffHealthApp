import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getConversationAnalytics, type AnalyticsPeriod } from "@/lib/twilio/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const periodParam = url.searchParams.get("period") ?? "week";
  const valid: AnalyticsPeriod[] = ["today", "week", "month", "quarter"];
  const period = valid.includes(periodParam as AnalyticsPeriod)
    ? (periodParam as AnalyticsPeriod)
    : "week";

  const data = await getConversationAnalytics(period);
  return NextResponse.json({ success: true, ...data });
}
