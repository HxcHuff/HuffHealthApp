import type { InsuranceType } from "@/generated/prisma/client";

export type LineOfBusiness =
  | "ACA"
  | "MEDICARE"
  | "DENTAL_VISION"
  | "LIFE"
  | "GENERIC";

export interface SpeedToLeadContext {
  firstName: string;
  agentName?: string;
  insuranceType?: InsuranceType | null;
  qualifyingEvent?: string | null;
}

const STOP_FOOTER = "Reply STOP to opt out.";

export function classifyLineOfBusiness(
  insuranceType: InsuranceType | null | undefined,
): LineOfBusiness {
  if (!insuranceType) return "GENERIC";
  switch (insuranceType) {
    case "ACA":
    case "SHORT_TERM":
    case "GROUP":
      return "ACA";
    case "MEDICARE_SUPPLEMENT":
    case "MEDICARE_ADVANTAGE":
    case "PART_D":
      return "MEDICARE";
    case "DENTAL_VISION":
      return "DENTAL_VISION";
    case "LIFE":
      return "LIFE";
    default:
      return "GENERIC";
  }
}

export function renderSpeedToLeadSms(ctx: SpeedToLeadContext): string {
  const agent = ctx.agentName ?? "David at HuffHealth";
  const lob = classifyLineOfBusiness(ctx.insuranceType);
  const first = ctx.firstName;

  switch (lob) {
    case "ACA":
      return [
        `Hi ${first}, this is ${agent}.`,
        ctx.qualifyingEvent
          ? `Saw you have a qualifying life event (${ctx.qualifyingEvent}) — you may have a Special Enrollment window.`
          : "Saw your request for ACA marketplace coverage.",
        "I can pull subsidy-eligible plans for your ZIP in about 5 minutes. What's a good time to call today?",
        STOP_FOOTER,
      ].join(" ");
    case "MEDICARE":
      return [
        `Hi ${first}, this is ${agent}.`,
        "Thanks for asking about Medicare options. I work with all the major carriers in your area and can compare Advantage, Supplement, and Part D plans side by side — no cost to you.",
        "Want me to call now or pick a time?",
        STOP_FOOTER,
      ].join(" ");
    case "DENTAL_VISION":
      return [
        `Hi ${first}, ${agent} here.`,
        "Got your dental/vision request. I have stand-alone plans starting around $20/mo with no waiting periods on most preventive work.",
        "Easiest is a 5-min call — when works?",
        STOP_FOOTER,
      ].join(" ");
    case "LIFE":
      return [
        `Hi ${first}, this is ${agent}.`,
        "Saw your request for life insurance info. I can quote term, whole, and final-expense without a medical exam in most cases.",
        "What's the best time to talk through what you're looking for?",
        STOP_FOOTER,
      ].join(" ");
    case "GENERIC":
    default:
      return [
        `Hi ${first}, this is ${agent}.`,
        "Got your request — happy to help you find coverage that fits.",
        "What's the best number and time for a quick 5-min call?",
        STOP_FOOTER,
      ].join(" ");
  }
}

export interface AdminAlertContext {
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  zip?: string | null;
  sourceCategory: string;
  source?: string | null;
  campaign?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  priority: "HOT" | "WARM" | "COLD";
  leadId: string;
  appUrl?: string;
}

export function renderAdminAlertSms(ctx: AdminAlertContext): string {
  const flame = ctx.priority === "HOT" ? "🔥 " : "";
  const url = ctx.appUrl ? `${ctx.appUrl}/leads/${ctx.leadId}` : `/leads/${ctx.leadId}`;
  const lines = [
    `${flame}NEW ${ctx.priority} LEAD`,
    `${ctx.firstName} ${ctx.lastName}${ctx.zip ? ` (${ctx.zip})` : ""}`,
    ctx.phone ? `📞 ${ctx.phone}` : null,
    ctx.email ? `✉  ${ctx.email}` : null,
    `Source: ${ctx.sourceCategory}${ctx.source ? ` / ${ctx.source}` : ""}`,
    ctx.campaign ? `Campaign: ${ctx.campaign}` : null,
    url,
  ];
  return lines.filter(Boolean).join("\n");
}
