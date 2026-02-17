"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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

  try {
    const settings = await db.siteSettings.upsert({
      where: { id: "default" },
      update: {
        landingPageUrl: data.landingPageUrl?.trim() || null,
      },
      create: {
        id: "default",
        landingPageUrl: data.landingPageUrl?.trim() || null,
      },
    });

    revalidatePath("/", "layout");
    return { success: true, settings };
  } catch (error) {
    console.error("Failed to update site settings:", error);
    return { error: "Failed to save settings" };
  }
}
