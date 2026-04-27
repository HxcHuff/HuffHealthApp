"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";

type GoogleCalendarConnection = {
  connected: boolean;
  email?: string;
  name?: string;
  connectedAt?: string;
};

type UserPrefs = Record<string, unknown>;

function readGoogleCalendarConnection(raw: unknown): GoogleCalendarConnection {
  const prefs = (raw as UserPrefs | null) || {};
  const gc = prefs.googleCalendar as Record<string, unknown> | undefined;
  if (!gc || gc.connected !== true) return { connected: false };

  return {
    connected: true,
    email: typeof gc.email === "string" ? gc.email : undefined,
    name: typeof gc.name === "string" ? gc.name : undefined,
    connectedAt: typeof gc.connectedAt === "string" ? gc.connectedAt : undefined,
  };
}

export async function getGoogleCalendarIntegration() {
  const session = await auth();
  if (!session) return { connected: false } as GoogleCalendarConnection;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });

  return readGoogleCalendarConnection(user?.notificationPreferences);
}

export async function disconnectGoogleCalendarIntegration() {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });

  const prefs = ((user?.notificationPreferences as UserPrefs | null) || {}) as UserPrefs;
  const nextPrefs: UserPrefs = { ...prefs, googleCalendar: { connected: false } };

  await db.user.update({
    where: { id: session.user.id },
    data: { notificationPreferences: nextPrefs as Prisma.InputJsonValue },
  });

  revalidatePath("/settings/integrations/google-calendar");
  revalidatePath("/settings");
  revalidatePath("/integrations");
  return { success: true };
}
