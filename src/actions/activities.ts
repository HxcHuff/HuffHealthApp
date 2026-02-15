"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { ActivityType } from "@/generated/prisma/client";

export async function logActivity({
  type,
  description,
  leadId,
  ticketId,
  contactId,
  metadata,
}: {
  type: ActivityType;
  description: string;
  leadId?: string;
  ticketId?: string;
  contactId?: string;
  metadata?: Record<string, unknown>;
}) {
  const session = await auth();
  if (!session) return;

  await db.activity.create({
    data: {
      type,
      description,
      performedById: session.user.id,
      leadId,
      ticketId,
      contactId,
      metadata: metadata ? (metadata as object) : undefined,
    },
  });
}

export async function getRecentActivities(limit = 20) {
  return db.activity.findMany({
    include: {
      performedBy: {
        select: { id: true, name: true, email: true, image: true, role: true },
      },
      lead: { select: { id: true, firstName: true, lastName: true } },
      ticket: { select: { id: true, subject: true, reference: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
