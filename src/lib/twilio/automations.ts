import { db } from "@/lib/db";
import type { InsuranceType } from "@/generated/prisma/client";
import { startConversation, sendOutboundMessage, ConsentRequiredError } from "./outbound";
import { maskPhone } from "./signature";

export const AUTOMATION_FLAGS = {
  newLead: process.env.TWILIO_AUTOMATION_NEW_LEAD !== "false",
  enrollmentComplete: process.env.TWILIO_AUTOMATION_ENROLLMENT !== "false",
  renewalReminder: process.env.TWILIO_AUTOMATION_RENEWAL !== "false",
  sepTriggered: process.env.TWILIO_AUTOMATION_SEP !== "false",
} as const;

const DAILY_AUTOMATION_LIMIT = 1;
const MEDICARE_TYPES: InsuranceType[] = [
  "MEDICARE_SUPPLEMENT",
  "MEDICARE_ADVANTAGE",
  "PART_D",
];

const STOP_FOOTER = "Reply STOP to opt out.";

interface LeadForAutomation {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  zipCode: string | null;
  insuranceType: InsuranceType | null;
  source: string | null;
  qualifyingEvent: string | null;
}

async function loadLead(leadId: string): Promise<LeadForAutomation | null> {
  return db.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      city: true,
      zipCode: true,
      insuranceType: true,
      source: true,
      qualifyingEvent: true,
    },
  });
}

async function withinDailyLimit(leadId: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await db.message.count({
    where: {
      direction: "OUTBOUND",
      sentAt: { gte: since },
      conversation: { leadId },
      attributes: { path: ["automation"], not: undefined },
    } as never,
  });
  // Fallback (Prisma JSON path filter may not match older runtimes): also do a manual check
  if (count >= DAILY_AUTOMATION_LIMIT) return false;
  return true;
}

function isMedicareLead(lead: LeadForAutomation): boolean {
  return lead.insuranceType ? MEDICARE_TYPES.includes(lead.insuranceType) : false;
}

interface AutomationResult {
  triggered: boolean;
  conversationSid?: string;
  messageId?: string;
  reason?: string;
  dryRun?: boolean;
}

async function dispatch(
  lead: LeadForAutomation,
  body: string,
  automationKey: string,
): Promise<AutomationResult> {
  if (!lead.phone) {
    return { triggered: false, reason: "no_phone" };
  }
  try {
    const result = await startConversation({
      leadId: lead.id,
      channel: "sms",
      initialMessage: body,
      agentIdentity: process.env.AGENT_DISPLAY_NAME ?? "David at HuffHealth",
    });
    // Tag the message with automation key for daily-limit accounting
    await db.message.update({
      where: { id: result.messageId },
      data: {
        attributes: { automation: automationKey, sentAt: new Date().toISOString() },
      },
    });
    console.info(
      `[twilio-automation] ${automationKey} triggered lead=${lead.id} phone=${maskPhone(lead.phone)} dryRun=${result.dryRun}`,
    );
    return {
      triggered: true,
      conversationSid: result.twilioConversationSid,
      messageId: result.messageId,
      dryRun: result.dryRun,
    };
  } catch (err) {
    if (err instanceof ConsentRequiredError) {
      console.warn(
        `[twilio-automation] ${automationKey} blocked lead=${lead.id} reasons=${err.reasons.join(",")}`,
      );
      return { triggered: false, reason: `compliance:${err.reasons.join(",")}` };
    }
    throw err;
  }
}

export async function onNewLead(leadId: string): Promise<AutomationResult> {
  if (!AUTOMATION_FLAGS.newLead) return { triggered: false, reason: "automation_disabled" };

  const lead = await loadLead(leadId);
  if (!lead) return { triggered: false, reason: "lead_not_found" };
  if (isMedicareLead(lead)) {
    return { triggered: false, reason: "medicare_lead_no_outbound" };
  }
  if (!(await withinDailyLimit(leadId))) {
    return { triggered: false, reason: "daily_limit_exceeded" };
  }

  const first = lead.firstName;
  const cityOrCounty = lead.city ?? "Polk County";
  const source = (lead.source ?? "").toLowerCase();

  let template: string | null = null;
  if (source.includes("facebook") || source.includes("meta")) {
    template = `Hi ${first}, thanks for reaching out about health insurance! I'm David Huff, a licensed broker here in Lakeland. I can help you find the best plan for your situation. When's a good time to chat? ${STOP_FOOTER}`;
  } else if (
    source.includes("website") ||
    source.includes("get-help") ||
    source.includes("lakelandhealth")
  ) {
    template = `Hi ${first}, I got your request from lakelandhealthinsurance.com. I specialize in finding the right ACA or Medicare plan for folks in ${cityOrCounty}. I'll give you a call shortly — or reply here if you prefer texting. ${STOP_FOOTER}`;
  } else if (source.includes("bni") || source.includes("referral")) {
    return { triggered: false, reason: "bni_referral_manual_only" };
  } else if (source.includes("inbound") || source.includes("call")) {
    return { triggered: false, reason: "inbound_call_already_engaged" };
  } else {
    template = `Hi ${first}, thanks for reaching out — this is David Huff with Lakeland Health Insurance. I'd love to help you find the right plan. When's a good time for a quick call? ${STOP_FOOTER}`;
  }

  return dispatch(lead, template, "new_lead");
}

export interface EnrollmentInput {
  leadId: string;
  planType: string;
  carrierName: string;
  effectiveDate: string;
}

export async function onEnrollmentComplete(input: EnrollmentInput): Promise<AutomationResult> {
  if (!AUTOMATION_FLAGS.enrollmentComplete) return { triggered: false, reason: "automation_disabled" };
  const lead = await loadLead(input.leadId);
  if (!lead) return { triggered: false, reason: "lead_not_found" };
  if (!(await withinDailyLimit(input.leadId))) {
    return { triggered: false, reason: "daily_limit_exceeded" };
  }
  const body = `Great news, ${lead.firstName}! Your ${input.planType} enrollment is confirmed with ${input.carrierName}. Your coverage starts ${input.effectiveDate}. I'll send you a summary shortly. Save this number — I'm your broker year-round. Questions? Just text me here.`;
  return dispatch(lead, body, "enrollment_complete");
}

export interface RenewalReminderInput {
  leadId: string;
  daysUntilRenewal: 60 | 30 | 7;
  planType: string;
  renewalDate: string;
}

export async function onRenewalReminder(
  input: RenewalReminderInput,
): Promise<AutomationResult> {
  if (!AUTOMATION_FLAGS.renewalReminder) return { triggered: false, reason: "automation_disabled" };
  const lead = await loadLead(input.leadId);
  if (!lead) return { triggered: false, reason: "lead_not_found" };
  if (isMedicareLead(lead)) {
    return { triggered: false, reason: "medicare_lead_no_outbound" };
  }
  if (!(await withinDailyLimit(input.leadId))) {
    return { triggered: false, reason: "daily_limit_exceeded" };
  }

  let body: string;
  switch (input.daysUntilRenewal) {
    case 60:
      body = `Hi ${lead.firstName}, your ${input.planType} plan renews in about 60 days. I'll be reviewing your options to make sure you're still getting the best deal. No action needed from you yet — I'll reach out with details soon.`;
      break;
    case 30:
      body = `Hi ${lead.firstName}, I've reviewed your renewal options. Let's schedule a quick call to go over any changes. What day works best this week?`;
      break;
    case 7:
      body = `Hi ${lead.firstName}, your plan renewal deadline is coming up on ${input.renewalDate}. If we haven't connected yet, please call or text me ASAP so we can make sure you're covered.`;
      break;
  }

  return dispatch(lead, body, `renewal_${input.daysUntilRenewal}d`);
}

export interface SepTriggerInput {
  leadId: string;
  sepReason: string;
}

export async function onSEPTriggered(input: SepTriggerInput): Promise<AutomationResult> {
  if (!AUTOMATION_FLAGS.sepTriggered) return { triggered: false, reason: "automation_disabled" };
  const lead = await loadLead(input.leadId);
  if (!lead) return { triggered: false, reason: "lead_not_found" };
  if (isMedicareLead(lead)) {
    return { triggered: false, reason: "medicare_lead_no_outbound" };
  }
  if (!(await withinDailyLimit(input.leadId))) {
    return { triggered: false, reason: "daily_limit_exceeded" };
  }
  const body = `Hi ${lead.firstName}, based on your ${input.sepReason}, you may qualify for a Special Enrollment Period. This means you can enroll in a new health plan outside of Open Enrollment. Let's connect — I can walk you through your options. Call or text me anytime.`;
  return dispatch(lead, body, "sep_triggered");
}

export async function replyToInbound(args: {
  conversationSid: string;
  body: string;
  agentIdentity?: string;
}): Promise<AutomationResult> {
  try {
    const result = await sendOutboundMessage({
      conversationSid: args.conversationSid,
      body: args.body,
      author: args.agentIdentity,
      isReplyToInbound: true,
    });
    return {
      triggered: true,
      conversationSid: result.twilioConversationSid,
      messageId: result.messageId,
      dryRun: result.dryRun,
    };
  } catch (err) {
    if (err instanceof ConsentRequiredError) {
      return { triggered: false, reason: `compliance:${err.reasons.join(",")}` };
    }
    throw err;
  }
}
