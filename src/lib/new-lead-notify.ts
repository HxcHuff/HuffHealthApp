import { db } from "@/lib/db";
import { sendEmail, type SendEmailResult } from "@/lib/email";
import { sendSms, type SendSmsResult } from "@/lib/sms";
import { getCurrentConsentStatus } from "@/lib/consent";
import { renderFirstTouchEmail, renderFirstTouchSms } from "@/lib/first-touch";

interface LeadNotifyFields {
  id: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  tcpaConsent?: boolean | null;
  firstName: string;
}

/**
 * Paid / purchased sources must never get SMS from a boolean flag alone.
 * Missing permission is not permission.
 */
export const UNTRUSTED_SMS_SOURCES = new Set([
  "google_lead_form",
  "google_ads",
  "leadconnect",
  "lead_connect",
  "purchased",
  "purchased_list",
]);

export type SmsNotifySkipReason =
  | "no_phone"
  | "no_tcpa_consent"
  | "consent_revoked"
  | "untrusted_source_no_consent";

export type EmailNotifySkipReason = "no_email" | "email_suppressed";

export interface NewLeadNotifyResult {
  leadId: string;
  email: SendEmailResult | { status: EmailNotifySkipReason };
  sms: SendSmsResult | { status: SmsNotifySkipReason };
}

export function isUntrustedSmsSource(source?: string | null): boolean {
  if (!source) return false;
  const normalized = source.toLowerCase().trim();
  if (UNTRUSTED_SMS_SOURCES.has(normalized)) return true;
  if (normalized.includes("leadconnect")) return true;
  if (normalized.includes("purchased")) return true;
  return false;
}

export function isEmailOnSuppressionList(email: string): boolean {
  const raw = process.env.EMAIL_SUPPRESSION_LIST ?? "";
  if (!raw.trim()) return false;
  const needle = email.trim().toLowerCase();
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(needle);
}

export async function isEmailSuppressed(lead: Pick<LeadNotifyFields, "id" | "email">): Promise<boolean> {
  if (!lead.email) return true;
  if (isEmailOnSuppressionList(lead.email)) return true;

  const latestMarketing = await db.consentLog.findFirst({
    where: { leadId: lead.id, consentType: "MARKETING_OPT_IN" },
    orderBy: { consentedAt: "desc" },
  });
  if (!latestMarketing) return false;
  return Boolean(latestMarketing.revokedAt) || latestMarketing.consentGiven === false;
}

export async function evaluateSmsConsent(
  lead: Pick<LeadNotifyFields, "id" | "phone" | "source" | "tcpaConsent">,
): Promise<{ ok: true } | { ok: false; reason: SmsNotifySkipReason }> {
  if (!lead.phone) return { ok: false, reason: "no_phone" };

  const consent = await getCurrentConsentStatus(lead.id);
  if (consent.state === "revoked") return { ok: false, reason: "consent_revoked" };

  const documented = consent.state === "valid";
  if (isUntrustedSmsSource(lead.source) && !documented) {
    return { ok: false, reason: "untrusted_source_no_consent" };
  }
  if (documented) return { ok: true };
  if (lead.tcpaConsent === true && !isUntrustedSmsSource(lead.source)) {
    return { ok: true };
  }
  return { ok: false, reason: "no_tcpa_consent" };
}

export async function evaluateEmailConsent(
  lead: Pick<LeadNotifyFields, "id" | "email">,
): Promise<{ ok: true } | { ok: false; reason: EmailNotifySkipReason }> {
  if (!lead.email?.trim()) return { ok: false, reason: "no_email" };
  if (await isEmailSuppressed(lead)) return { ok: false, reason: "email_suppressed" };
  return { ok: true };
}

/**
 * First-touch email + SMS after a newly created lead.
 * Both channels are independently gated. Live transport is fail-closed.
 */
export async function notifyNewLead(leadId: string): Promise<NewLeadNotifyResult> {
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });

  const smsGate = await evaluateSmsConsent(lead);
  const emailGate = await evaluateEmailConsent(lead);

  const smsCopy = renderFirstTouchSms({ firstName: lead.firstName });
  const emailCopy = renderFirstTouchEmail({ firstName: lead.firstName });

  const sms: NewLeadNotifyResult["sms"] = smsGate.ok
    ? await sendSms({ to: lead.phone!, body: smsCopy })
    : { status: smsGate.reason };

  const email: NewLeadNotifyResult["email"] = emailGate.ok
    ? await sendEmail({
        to: lead.email!,
        subject: emailCopy.subject,
        html: emailCopy.html,
      })
    : { status: emailGate.reason };

  return { leadId, email, sms };
}

export function wasSmsAttempted(status: string): boolean {
  return (
    status === "sent" ||
    status === "skipped_dry_run" ||
    status === "skipped_outbound_disabled" ||
    status === "skipped_no_credentials" ||
    status === "failed"
  );
}
