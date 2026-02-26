import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMessagingAuthorized } from "@/lib/messaging/auth";

export async function GET(req: NextRequest) {
  if (!isMessagingAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await db.contact.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      zipCode: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const normalized = contacts.map((c) => ({
    id: c.id,
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email,
    phone: c.phone || "",
    zip_code: c.zipCode || "",
    plan_type: "unknown",
    lead_source: "crm",
    tags: [],
    opted_in_channels: ["email", "in_app"],
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  }));

  return NextResponse.json(normalized);
}
