import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMessagingAuthorized } from "@/lib/messaging/auth";

export async function POST(req: NextRequest) {
  if (!isMessagingAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const firstName = payload.first_name || payload.firstName;
    const lastName = payload.last_name || payload.lastName || "";
    const email = payload.email;

    if (!firstName || !email) {
      return NextResponse.json(
        { error: "first_name and email are required" },
        { status: 400 }
      );
    }

    const contact = await db.contact.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        phone: payload.phone || undefined,
        zipCode: payload.zip_code || payload.zipCode || payload.zip || undefined,
      },
      create: {
        firstName,
        lastName,
        email,
        phone: payload.phone || undefined,
        zipCode: payload.zip_code || payload.zipCode || payload.zip || undefined,
      },
      select: { id: true },
    });

    if (payload.crm_lead_id) {
      await db.lead
        .update({
          where: { id: payload.crm_lead_id },
          data: { dripSyncedAt: new Date() },
        })
        .catch(() => null);
    }

    return NextResponse.json({
      contact_id: contact.id,
      enrolled_sequences: [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
