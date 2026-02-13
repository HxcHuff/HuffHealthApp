"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { subscribePageToWebhook } from "@/lib/facebook";
import { syncFacebookLeads } from "@/lib/facebook-leads";

export async function saveFacebookIntegration({
  pageId,
  pageName,
  accessToken,
  formIds,
}: {
  pageId: string;
  pageName: string;
  accessToken: string;
  formIds: string[];
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const encryptedToken = encrypt(accessToken);

  await db.facebookIntegration.upsert({
    where: { pageId },
    create: {
      pageId,
      pageName,
      accessToken: encryptedToken,
      formIds,
      createdById: session.user.id,
    },
    update: {
      pageName,
      accessToken: encryptedToken,
      formIds,
      isActive: true,
    },
  });

  // Subscribe page to webhook for real-time leads
  try {
    await subscribePageToWebhook(pageId, accessToken);
  } catch (error) {
    console.error("Failed to subscribe page to webhook:", error);
  }

  revalidatePath("/settings/integrations/facebook");
  return { success: true };
}

export async function disconnectFacebookIntegration(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  await db.facebookIntegration.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/settings/integrations/facebook");
  return { success: true };
}

export async function triggerFacebookSync(integrationId: string) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const result = await syncFacebookLeads(integrationId);
  revalidatePath("/leads");
  return result;
}

export async function getFacebookIntegrations() {
  const integrations = await db.facebookIntegration.findMany({
    where: { isActive: true },
    select: {
      id: true,
      pageId: true,
      pageName: true,
      formIds: true,
      isActive: true,
      lastSyncAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return integrations;
}
