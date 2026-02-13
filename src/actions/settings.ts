"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function updateNotificationPreferences(preferences: {
  ticketUpdates: boolean;
  leadAssignments: boolean;
  announcements: boolean;
}) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  await db.user.update({
    where: { id: session.user.id },
    data: { notificationPreferences: preferences },
  });

  revalidatePath("/settings/notifications");
  return { success: true };
}

export async function getNotificationPreferences() {
  const session = await auth();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });

  const raw = user?.notificationPreferences as Record<string, boolean> | null;
  return {
    ticketUpdates: raw?.ticketUpdates !== false,
    leadAssignments: raw?.leadAssignments !== false,
    announcements: raw?.announcements !== false,
  };
}
