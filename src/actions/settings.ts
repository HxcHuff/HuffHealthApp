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

export async function updateProfile(data: { name: string; email: string }) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const existing = await db.user.findFirst({
    where: { email: data.email, NOT: { id: session.user.id } },
  });
  if (existing) return { error: "Email already in use" };

  await db.user.update({
    where: { id: session.user.id },
    data: { name: data.name, email: data.email },
  });

  revalidatePath("/settings/profile");
  return { success: true };
}

export async function getProfile() {
  const session = await auth();
  if (!session) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

export async function getLeadSources() {
  return db.leadSource.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createLeadSource(name: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  const existing = await db.leadSource.findUnique({ where: { name: trimmed } });
  if (existing) {
    if (!existing.isActive) {
      await db.leadSource.update({ where: { id: existing.id }, data: { isActive: true } });
      revalidatePath("/settings/sources");
      return { success: true };
    }
    return { error: "Source already exists" };
  }

  await db.leadSource.create({ data: { name: trimmed } });
  revalidatePath("/settings/sources");
  return { success: true };
}

export async function updateLeadSource(id: string, name: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  await db.leadSource.update({ where: { id }, data: { name: trimmed } });
  revalidatePath("/settings/sources");
  return { success: true };
}

export async function deleteLeadSource(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return { error: "Unauthorized" };

  await db.leadSource.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/settings/sources");
  return { success: true };
}
