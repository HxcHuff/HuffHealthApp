import { NextRequest, NextResponse } from "next/server";
import { isMessagingAuthorized } from "@/lib/messaging/auth";

// Placeholder until full automations/sequences persistence is moved into CRM.
export async function GET(req: NextRequest) {
  if (!isMessagingAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json([]);
}
