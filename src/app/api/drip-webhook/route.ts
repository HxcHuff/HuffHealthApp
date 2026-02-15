import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ActivityType } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = process.env.DRIP_WEBHOOK_SECRET;

  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { crm_lead_id, crm_contact_id, channel, status, template_name, sent_at, error } = body;

    if (!channel || !status) {
      return NextResponse.json({ error: "channel and status required" }, { status: 400 });
    }

    // Map drip channel to activity type
    const activityType: ActivityType = channel === "email" ? "EMAIL" : "NOTE";
    const statusLabel = status === "sent" ? "sent" : status === "failed" ? "failed" : status;
    const description = `Drip ${channel} ${statusLabel}: ${template_name || "unknown template"}${error ? ` (${error})` : ""}`;

    // Find the performer — use lead's creator or first admin
    let performedById: string | null = null;

    if (crm_lead_id) {
      const lead = await db.lead.findUnique({
        where: { id: crm_lead_id },
        select: { createdById: true },
      });
      performedById = lead?.createdById || null;
    }

    if (!performedById) {
      const admin = await db.user.findFirst({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      });
      performedById = admin?.id || null;
    }

    if (!performedById) {
      return NextResponse.json({ error: "No user found for activity" }, { status: 500 });
    }

    await db.activity.create({
      data: {
        type: activityType,
        description,
        performedById,
        leadId: crm_lead_id || undefined,
        contactId: crm_contact_id || undefined,
        metadata: { channel, status, template_name, sent_at, source: "drip_engine" },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
