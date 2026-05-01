import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import {
  renderSpeedToLeadSms,
  renderAdminAlertSms,
  type SpeedToLeadContext,
} from "@/lib/sms-templates";
import type { Lead, LeadPriority, LeadSourceCategory } from "@/generated/prisma/client";

export interface ClassificationInput {
  source?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  campaign?: string | null;
}

export interface ClassificationResult {
  sourceCategory: LeadSourceCategory;
  priority: LeadPriority;
}

const PAID_UTM_SOURCES = new Set([
  "google",
  "google_ads",
  "googleads",
  "adwords",
  "facebook",
  "fb",
  "meta",
  "instagram",
  "ig",
  "bing",
  "microsoft",
  "tiktok",
  "youtube",
  "linkedin",
]);

const ORGANIC_UTM_SOURCES = new Set([
  "organic",
  "seo",
  "google_organic",
  "bing_organic",
  "duckduckgo",
]);

const REFERRAL_SOURCES = new Set(["referral", "bni", "partner", "affiliate"]);

export function classifyLead(input: ClassificationInput): ClassificationResult {
  const utm = (input.utmSource ?? "").toLowerCase().trim();
  const src = (input.source ?? "").toLowerCase().trim();

  if (src === "fb_lead_ad" || src === "fb_traffic" || PAID_UTM_SOURCES.has(utm)) {
    return { sourceCategory: "PAID", priority: "HOT" };
  }
  if (REFERRAL_SOURCES.has(src) || REFERRAL_SOURCES.has(utm)) {
    return { sourceCategory: "REFERRAL", priority: "HOT" };
  }
  if (ORGANIC_UTM_SOURCES.has(utm)) {
    return { sourceCategory: "ORGANIC", priority: "WARM" };
  }
  if (src === "manual") {
    return { sourceCategory: "DIRECT", priority: "WARM" };
  }
  if (src === "website_form" && !utm) {
    return { sourceCategory: "DIRECT", priority: "WARM" };
  }
  return { sourceCategory: "OTHER", priority: "COLD" };
}

export interface RouteOptions {
  adminPhone?: string;
  agentName?: string;
  appUrl?: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface RouteResult {
  leadId: string;
  classification: ClassificationResult;
  speedToLead: { status: string; sid?: string };
  adminAlert: { status: string; sid?: string };
  webhook: { status: "ok" | "skipped" | "failed"; httpStatus?: number; error?: string };
}

async function postWebhook(
  url: string,
  secret: string | undefined,
  payload: Record<string, unknown>,
): Promise<RouteResult["webhook"]> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret ? { "x-webhook-secret": secret } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { status: "failed", httpStatus: res.status };
    }
    return { status: "ok", httpStatus: res.status };
  } catch (err) {
    return {
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Run the full router for a freshly-created lead. Idempotent on routedAt —
 * a lead already routed will be skipped on retry.
 *
 * Side effects: updates Lead with classification, fires admin SMS, fires
 * speed-to-lead SMS to the lead, POSTs to webhook, writes LeadEvent rows.
 */
export async function routeLead(leadId: string, opts: RouteOptions = {}): Promise<RouteResult> {
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });

  if (lead.routedAt) {
    return {
      leadId,
      classification: {
        sourceCategory: lead.sourceCategory ?? "OTHER",
        priority: lead.priority,
      },
      speedToLead: { status: "skipped_already_routed" },
      adminAlert: { status: "skipped_already_routed" },
      webhook: { status: "skipped" },
    };
  }

  const classification = classifyLead({
    source: lead.source,
    utmSource: lead.utmSource,
    utmCampaign: lead.utmCampaign,
    campaign: lead.campaign,
  });

  const adminPhone = opts.adminPhone ?? process.env.ADMIN_NOTIFY_PHONE ?? "";
  const appUrl = opts.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const webhookUrl = opts.webhookUrl ?? process.env.LEAD_ROUTER_WEBHOOK_URL ?? "";
  const webhookSecret = opts.webhookSecret ?? process.env.LEAD_ROUTER_WEBHOOK_SECRET;

  const stlCtx: SpeedToLeadContext = {
    firstName: lead.firstName,
    agentName: opts.agentName ?? process.env.AGENT_DISPLAY_NAME,
    insuranceType: lead.insuranceType,
    qualifyingEvent: lead.qualifyingEvent,
  };

  const speedToLeadResult = lead.phone && lead.tcpaConsent
    ? await sendSms({ to: lead.phone, body: renderSpeedToLeadSms(stlCtx) })
    : { status: "skipped_no_consent" as const };

  const adminAlertResult = adminPhone
    ? await sendSms({
        to: adminPhone,
        body: renderAdminAlertSms({
          firstName: lead.firstName,
          lastName: lead.lastName,
          phone: lead.phone,
          email: lead.email,
          zip: lead.zipCode,
          sourceCategory: classification.sourceCategory,
          source: lead.source,
          campaign: lead.campaign,
          utmSource: lead.utmSource,
          utmCampaign: lead.utmCampaign,
          priority: classification.priority,
          leadId: lead.id,
          appUrl,
        }),
      })
    : { status: "skipped_no_admin_phone" as const };

  const webhookResult = webhookUrl
    ? await postWebhook(webhookUrl, webhookSecret, {
        leadId: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        zip: lead.zipCode,
        source: lead.source,
        campaign: lead.campaign,
        utmSource: lead.utmSource,
        utmCampaign: lead.utmCampaign,
        utmContent: lead.utmContent,
        sourceCategory: classification.sourceCategory,
        priority: classification.priority,
        createdAt: lead.createdAt.toISOString(),
      })
    : { status: "skipped" as const };

  const now = new Date();
  await db.$transaction([
    db.lead.update({
      where: { id: leadId },
      data: {
        priority: classification.priority,
        sourceCategory: classification.sourceCategory,
        routedAt: now,
        speedToLeadAt:
          speedToLeadResult.status === "sent" ||
          speedToLeadResult.status === "skipped_dry_run"
            ? now
            : undefined,
      },
    }),
    db.leadEvent.create({
      data: {
        leadId,
        type: "ROUTED",
        payload: {
          priority: classification.priority,
          sourceCategory: classification.sourceCategory,
        },
      },
    }),
    db.leadEvent.create({
      data: {
        leadId,
        type: "ADMIN_NOTIFIED",
        payload: { ...adminAlertResult },
      },
    }),
    db.leadEvent.create({
      data: {
        leadId,
        type: "SMS_SENT",
        payload: {
          to: "lead",
          template: stlCtx.insuranceType ?? "GENERIC",
          ...speedToLeadResult,
        },
      },
    }),
    db.leadEvent.create({
      data: {
        leadId,
        type: "WEBHOOK_DISPATCHED",
        payload: { ...webhookResult },
      },
    }),
  ]);

  return {
    leadId,
    classification,
    speedToLead: speedToLeadResult,
    adminAlert: adminAlertResult,
    webhook: webhookResult,
  };
}

/**
 * Fire-and-forget wrapper for use inside the ingest handler so the response
 * doesn't block on Twilio / webhook latency. Errors are logged, not thrown.
 */
export function routeLeadAsync(leadId: string, opts: RouteOptions = {}): void {
  routeLead(leadId, opts).catch((err) => {
    console.error(`[lead-router] failed for lead ${leadId}:`, err);
  });
}

export type LeadForRouter = Pick<
  Lead,
  | "id"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "zipCode"
  | "source"
  | "campaign"
  | "utmSource"
  | "utmCampaign"
  | "priority"
  | "sourceCategory"
>;
