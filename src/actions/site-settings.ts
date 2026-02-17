"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getSiteSettings() {
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
  });
  return settings;
}

export async function updateSiteSettings(data: { landingPageUrl?: string }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const settings = await db.siteSettings.upsert({
    where: { id: "default" },
    update: {
      landingPageUrl: data.landingPageUrl || null,
    },
    create: {
      id: "default",
      landingPageUrl: data.landingPageUrl || null,
    },
  });

  return { success: true, settings };
}
