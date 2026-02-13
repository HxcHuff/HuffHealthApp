import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import {
  fetchSingleLead,
  getFormLeads,
  mapFacebookLeadToLead,
} from "@/lib/facebook";

export async function processIncomingFacebookLead(
  leadgenId: string,
  pageId: string,
  formId: string
) {
  const integration = await db.facebookIntegration.findUnique({
    where: { pageId },
    include: { createdBy: { select: { id: true } } },
  });

  if (!integration || !integration.isActive) {
    console.warn(`No active Facebook integration for page ${pageId}`);
    return;
  }

  const accessToken = decrypt(integration.accessToken);
  const fbLead = await fetchSingleLead(leadgenId, accessToken);
  if (!fbLead) {
    console.error(`Failed to fetch Facebook lead ${leadgenId}`);
    return;
  }

  const leadData = mapFacebookLeadToLead(fbLead);

  // Deduplication by email
  if (leadData.email) {
    const existing = await db.lead.findFirst({
      where: { email: leadData.email },
    });
    if (existing) {
      // Update custom fields with latest Facebook data
      const existingCustom = (existing.customFields as Record<string, string> | null) || {};
      const mergedFields = {
        ...existingCustom,
        ...leadData.customFields,
      } as Record<string, string>;
      await db.lead.update({
        where: { id: existing.id },
        data: { customFields: mergedFields as unknown as import("@/generated/prisma/client").Prisma.InputJsonValue },
      });
      return;
    }
  }

  await db.lead.create({
    data: {
      ...leadData,
      customFields: leadData.customFields || undefined,
      createdById: integration.createdById,
    },
  });
}

export async function syncFacebookLeads(integrationId: string) {
  const integration = await db.facebookIntegration.findUnique({
    where: { id: integrationId },
    include: { createdBy: { select: { id: true } } },
  });

  if (!integration || !integration.isActive) {
    return { error: "Integration not found or inactive" };
  }

  const accessToken = decrypt(integration.accessToken);
  let synced = 0;
  let duplicates = 0;
  let errors = 0;

  for (const formId of integration.formIds) {
    try {
      const fbLeads = await getFormLeads(
        formId,
        accessToken,
        integration.lastSyncAt || undefined
      );

      for (const fbLead of fbLeads) {
        try {
          const leadData = mapFacebookLeadToLead(fbLead);

          // Deduplication
          if (leadData.email) {
            const existing = await db.lead.findFirst({
              where: { email: leadData.email },
            });
            if (existing) {
              duplicates++;
              continue;
            }
          }

          // Also check by fb_lead_id in customFields
          const existingByFbId = await db.lead.findFirst({
            where: {
              customFields: {
                path: ["fb_lead_id"],
                equals: fbLead.id,
              },
            },
          });
          if (existingByFbId) {
            duplicates++;
            continue;
          }

          await db.lead.create({
            data: {
              ...leadData,
              customFields: leadData.customFields || undefined,
              createdById: integration.createdById,
            },
          });
          synced++;
        } catch {
          errors++;
        }
      }
    } catch {
      errors++;
    }
  }

  await db.facebookIntegration.update({
    where: { id: integrationId },
    data: { lastSyncAt: new Date() },
  });

  return { synced, duplicates, errors };
}
