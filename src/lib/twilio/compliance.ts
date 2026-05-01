import { db } from "@/lib/db";
import type { InsuranceType } from "@/generated/prisma/client";

export type ComplianceFailureReason =
  | "no_tcpa_consent"
  | "consent_revoked"
  | "medicare_outbound_blocked"
  | "outside_allowed_hours"
  | "lead_not_found"
  | "no_phone";

export interface ComplianceCheckResult {
  ok: boolean;
  reasons: ComplianceFailureReason[];
  details: {
    hasValidTcpa: boolean;
    isMedicare: boolean;
    withinHours: boolean;
    timezone: string;
    nowEt: string;
  };
}

const MEDICARE_TYPES: InsuranceType[] = [
  "MEDICARE_SUPPLEMENT",
  "MEDICARE_ADVANTAGE",
  "PART_D",
];

const ALLOWED_START_HOUR = 8; // 8am
const ALLOWED_END_HOUR = 21; // 9pm

function nowInEasternTime(): { hour: number; iso: string } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const hourPart = parts.find((p) => p.type === "hour");
  const hour = hourPart ? parseInt(hourPart.value, 10) : new Date().getHours();
  const iso = new Date()
    .toLocaleString("sv-SE", { timeZone: "America/New_York" })
    .replace(" ", "T");
  return { hour, iso };
}

function isWithinAllowedHours(): boolean {
  const { hour } = nowInEasternTime();
  return hour >= ALLOWED_START_HOUR && hour < ALLOWED_END_HOUR;
}

export interface ComplianceContext {
  leadId: string;
  /** Set true when this is a direct human-to-human reply to an inbound (bypasses Medicare cold-outbound rule) */
  isReplyToInbound?: boolean;
  /** Set true to skip time-of-day enforcement (e.g. critical service messages). Logs the bypass. */
  bypassHoursCheck?: boolean;
}

export async function checkOutboundCompliance(
  ctx: ComplianceContext,
): Promise<ComplianceCheckResult> {
  const lead = await db.lead.findUnique({
    where: { id: ctx.leadId },
    select: {
      id: true,
      phone: true,
      insuranceType: true,
    },
  });

  const reasons: ComplianceFailureReason[] = [];
  const { hour, iso } = nowInEasternTime();

  if (!lead) {
    return {
      ok: false,
      reasons: ["lead_not_found"],
      details: {
        hasValidTcpa: false,
        isMedicare: false,
        withinHours: hour >= ALLOWED_START_HOUR && hour < ALLOWED_END_HOUR,
        timezone: "America/New_York",
        nowEt: iso,
      },
    };
  }

  if (!lead.phone) reasons.push("no_phone");

  // TCPA consent: most-recent log must be consentGiven=true with no revokedAt
  const latestConsent = await db.consentLog.findFirst({
    where: {
      leadId: ctx.leadId,
      consentType: { in: ["TCPA_EXPRESS_WRITTEN", "INBOUND_INITIATED"] },
    },
    orderBy: { consentedAt: "desc" },
  });

  const hasValidTcpa = Boolean(
    latestConsent && latestConsent.consentGiven && !latestConsent.revokedAt,
  );

  if (!hasValidTcpa) {
    if (latestConsent && latestConsent.revokedAt) {
      reasons.push("consent_revoked");
    } else {
      reasons.push("no_tcpa_consent");
    }
  }

  const isMedicare = lead.insuranceType
    ? MEDICARE_TYPES.includes(lead.insuranceType)
    : false;

  if (isMedicare && !ctx.isReplyToInbound) {
    reasons.push("medicare_outbound_blocked");
  }

  const withinHours = isWithinAllowedHours();
  if (!withinHours && !ctx.bypassHoursCheck) {
    reasons.push("outside_allowed_hours");
  }

  const result: ComplianceCheckResult = {
    ok: reasons.length === 0,
    reasons,
    details: {
      hasValidTcpa,
      isMedicare,
      withinHours,
      timezone: "America/New_York",
      nowEt: iso,
    },
  };

  console.info(
    `[twilio-compliance] lead=${ctx.leadId} ok=${result.ok} reasons=${reasons.join(",") || "none"} medicare=${isMedicare} tcpa=${hasValidTcpa} hours=${withinHours}`,
  );

  return result;
}

export class ConsentRequiredError extends Error {
  constructor(public readonly reasons: ComplianceFailureReason[]) {
    super(`Outbound blocked by compliance: ${reasons.join(", ")}`);
    this.name = "ConsentRequiredError";
  }
}
