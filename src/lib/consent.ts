import { db } from "@/lib/db";
import type { ConsentMethod, ConsentType } from "@/generated/prisma/client";

export const TCPA_DISCLOSURE_TEXT =
  "By checking this box, you consent to receive automated text messages from David Huff / Lakeland Health Insurance at the phone number provided. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe at any time. This consent is not a condition of purchase.";

export interface RecordConsentInput {
  leadId: string;
  consentType: ConsentType;
  consentMethod: ConsentMethod;
  consentText?: string;
  consentGiven?: boolean;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export async function recordConsent(input: RecordConsentInput) {
  const log = await db.consentLog.create({
    data: {
      leadId: input.leadId,
      consentType: input.consentType,
      consentGiven: input.consentGiven ?? true,
      consentMethod: input.consentMethod,
      consentText: input.consentText ?? TCPA_DISCLOSURE_TEXT,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      source: input.source,
      metadata: (input.metadata as object) ?? undefined,
    },
  });

  await db.leadEvent.create({
    data: {
      leadId: input.leadId,
      type: "CONSENT_RECORDED",
      payload: {
        consentLogId: log.id,
        consentType: input.consentType,
        consentMethod: input.consentMethod,
      },
    },
  });

  return log;
}

export async function revokeConsent(args: {
  leadId: string;
  reason: string;
  source?: string;
}) {
  const latest = await db.consentLog.findFirst({
    where: {
      leadId: args.leadId,
      consentGiven: true,
      revokedAt: null,
    },
    orderBy: { consentedAt: "desc" },
  });
  if (!latest) return null;

  const updated = await db.consentLog.update({
    where: { id: latest.id },
    data: {
      revokedAt: new Date(),
      revokedReason: args.reason,
    },
  });

  await db.leadEvent.create({
    data: {
      leadId: args.leadId,
      type: "CONSENT_REVOKED",
      payload: { consentLogId: updated.id, reason: args.reason, source: args.source },
    },
  });

  return updated;
}

export async function getConsentHistory(leadId: string) {
  return db.consentLog.findMany({
    where: { leadId },
    orderBy: { consentedAt: "desc" },
  });
}

export async function getCurrentConsentStatus(leadId: string) {
  const latest = await db.consentLog.findFirst({
    where: {
      leadId,
      consentType: { in: ["TCPA_EXPRESS_WRITTEN", "INBOUND_INITIATED"] },
    },
    orderBy: { consentedAt: "desc" },
  });
  if (!latest) return { state: "none" as const, log: null };
  if (latest.revokedAt) return { state: "revoked" as const, log: latest };
  if (latest.consentType === "INBOUND_INITIATED") {
    return { state: "inbound_only" as const, log: latest };
  }
  return { state: "valid" as const, log: latest };
}
