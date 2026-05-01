import { db } from "@/lib/db";
import {
  createConversation,
  addSmsParticipant,
  sendMessage as twilioSendMessage,
  updateConversationState,
} from "./conversations";
import { isDryRun, isTwilioConfigured, readTwilioEnv } from "./client";
import {
  checkOutboundCompliance,
  ConsentRequiredError,
  type ComplianceContext,
} from "./compliance";
import { TwilioDryRunSkip } from "./types";
import { maskPhone } from "./signature";

export interface StartConversationInput {
  leadId: string;
  channel?: "sms" | "whatsapp";
  initialMessage: string;
  agentIdentity?: string;
  isReplyToInbound?: boolean;
  bypassHoursCheck?: boolean;
}

export interface OutboundMessageResult {
  conversationId: string;
  twilioConversationSid: string;
  messageId: string;
  twilioMessageSid: string | null;
  dryRun: boolean;
}

async function recordOutboundMessage(args: {
  conversationId: string;
  twilioMessageSid: string | null;
  body: string;
  mediaUrl?: string;
  author?: string;
  dryRun: boolean;
}): Promise<{ id: string }> {
  return db.message.create({
    data: {
      conversationId: args.conversationId,
      twilioMessageSid: args.twilioMessageSid,
      direction: "OUTBOUND",
      body: args.body,
      mediaUrl: args.mediaUrl ?? null,
      mediaUrls: args.mediaUrl ? [args.mediaUrl] : [],
      author: args.author ?? null,
      sentAt: new Date(),
      deliveryStatus: args.dryRun ? "QUEUED" : "SENT",
      attributes: args.dryRun ? { dryRun: true } : undefined,
    },
    select: { id: true },
  });
}

export async function startConversation(
  input: StartConversationInput,
): Promise<OutboundMessageResult> {
  const lead = await db.lead.findUnique({
    where: { id: input.leadId },
    select: { id: true, phone: true, firstName: true, lastName: true },
  });
  if (!lead) throw new Error(`Lead ${input.leadId} not found`);
  if (!lead.phone) throw new Error(`Lead ${input.leadId} has no phone number`);

  const compliance = await checkOutboundCompliance({
    leadId: input.leadId,
    isReplyToInbound: input.isReplyToInbound,
    bypassHoursCheck: input.bypassHoursCheck,
  });
  if (!compliance.ok) {
    throw new ConsentRequiredError(compliance.reasons);
  }

  const channel = input.channel ?? "sms";
  const dryRun = isDryRun() || !isTwilioConfigured();

  if (dryRun) {
    console.info(
      `[twilio-outbound] DRY_RUN startConversation lead=${input.leadId} phone=${maskPhone(lead.phone)} channel=${channel}`,
    );
    const sid = `CHDRYRUN${Date.now().toString(36)}`;
    const conversation = await db.conversation.create({
      data: {
        twilioConversationSid: sid,
        leadId: input.leadId,
        channel: channel === "whatsapp" ? "WHATSAPP" : "SMS",
        status: "ACTIVE",
        participantPhone: lead.phone,
        agentIdentity: input.agentIdentity,
        attributes: { dryRun: true },
        lastMessageAt: new Date(),
        lastOutboundAt: new Date(),
      },
      select: { id: true, twilioConversationSid: true },
    });
    const message = await recordOutboundMessage({
      conversationId: conversation.id,
      twilioMessageSid: null,
      body: input.initialMessage,
      author: input.agentIdentity,
      dryRun: true,
    });
    await db.leadEvent.create({
      data: {
        leadId: input.leadId,
        type: "CONVERSATION_STARTED",
        payload: { dryRun: true, channel, sid },
      },
    });
    return {
      conversationId: conversation.id,
      twilioConversationSid: conversation.twilioConversationSid,
      messageId: message.id,
      twilioMessageSid: null,
      dryRun: true,
    };
  }

  const env = readTwilioEnv();
  if (!env) throw new Error("Twilio env not configured");

  let twilioConversation;
  let twilioMessage;
  try {
    twilioConversation = await createConversation({
      friendlyName: `${lead.firstName} ${lead.lastName} (${input.leadId})`,
      attributes: { leadId: input.leadId },
    });
    await addSmsParticipant({
      conversationSid: twilioConversation.sid,
      toPhoneNumber: lead.phone,
      channel,
    });
    twilioMessage = await twilioSendMessage({
      conversationSid: twilioConversation.sid,
      body: input.initialMessage,
      author: input.agentIdentity ?? env.phoneNumber,
    });
  } catch (err) {
    if (err instanceof TwilioDryRunSkip) {
      throw err;
    }
    console.error("[twilio-outbound] startConversation failed", err);
    throw err;
  }

  const conversation = await db.conversation.create({
    data: {
      twilioConversationSid: twilioConversation.sid,
      leadId: input.leadId,
      channel: channel === "whatsapp" ? "WHATSAPP" : "SMS",
      status: "ACTIVE",
      participantPhone: lead.phone,
      agentIdentity: input.agentIdentity,
      attributes: { complianceSnapshot: compliance.details },
      lastMessageAt: new Date(),
      lastOutboundAt: new Date(),
    },
    select: { id: true, twilioConversationSid: true },
  });

  const message = await recordOutboundMessage({
    conversationId: conversation.id,
    twilioMessageSid: twilioMessage.sid,
    body: input.initialMessage,
    author: input.agentIdentity,
    dryRun: false,
  });

  await db.leadEvent.create({
    data: {
      leadId: input.leadId,
      type: "CONVERSATION_STARTED",
      payload: {
        twilioConversationSid: twilioConversation.sid,
        channel,
        initiatedBy: input.agentIdentity ?? "system",
      },
    },
  });

  return {
    conversationId: conversation.id,
    twilioConversationSid: conversation.twilioConversationSid,
    messageId: message.id,
    twilioMessageSid: twilioMessage.sid,
    dryRun: false,
  };
}

export interface SendOutboundMessageInput {
  conversationSid: string;
  body: string;
  mediaUrl?: string;
  author?: string;
  isReplyToInbound?: boolean;
  bypassHoursCheck?: boolean;
  /** Bypass all compliance checks. Use ONLY for required transactional/service messages
   * (e.g., STOP confirmation). Do NOT use for marketing or promotional content. */
  bypassConsentCheck?: boolean;
}

export async function sendOutboundMessage(
  input: SendOutboundMessageInput,
): Promise<OutboundMessageResult> {
  const conversation = await db.conversation.findUnique({
    where: { twilioConversationSid: input.conversationSid },
    select: { id: true, twilioConversationSid: true, leadId: true, status: true },
  });
  if (!conversation) {
    throw new Error(`Conversation ${input.conversationSid} not found`);
  }
  if (conversation.status === "CLOSED" || conversation.status === "ARCHIVED") {
    throw new Error(`Conversation ${input.conversationSid} is ${conversation.status}`);
  }

  if (conversation.leadId && !input.bypassConsentCheck) {
    const ctx: ComplianceContext = {
      leadId: conversation.leadId,
      isReplyToInbound: input.isReplyToInbound,
      bypassHoursCheck: input.bypassHoursCheck,
    };
    const compliance = await checkOutboundCompliance(ctx);
    if (!compliance.ok) throw new ConsentRequiredError(compliance.reasons);
  }

  const dryRun = isDryRun() || !isTwilioConfigured();
  let twilioMessageSid: string | null = null;

  if (!dryRun) {
    const env = readTwilioEnv();
    const sent = await twilioSendMessage({
      conversationSid: input.conversationSid,
      body: input.body,
      author: input.author ?? env?.phoneNumber,
    });
    twilioMessageSid = sent.sid;
  } else {
    console.info(
      `[twilio-outbound] DRY_RUN sendMessage conv=${input.conversationSid} bodyLen=${input.body.length}`,
    );
  }

  const message = await recordOutboundMessage({
    conversationId: conversation.id,
    twilioMessageSid,
    body: input.body,
    mediaUrl: input.mediaUrl,
    author: input.author,
    dryRun,
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      lastOutboundAt: new Date(),
    },
  });

  if (conversation.leadId) {
    await db.leadEvent.create({
      data: {
        leadId: conversation.leadId,
        type: "CONVERSATION_MESSAGE",
        payload: {
          direction: "outbound",
          messageId: message.id,
          conversationSid: input.conversationSid,
          dryRun,
        },
      },
    });
  }

  return {
    conversationId: conversation.id,
    twilioConversationSid: conversation.twilioConversationSid,
    messageId: message.id,
    twilioMessageSid,
    dryRun,
  };
}

export async function closeConversation(
  conversationSid: string,
  reason?: string,
): Promise<void> {
  const conversation = await db.conversation.findUnique({
    where: { twilioConversationSid: conversationSid },
    select: { id: true, status: true },
  });
  if (!conversation) throw new Error(`Conversation ${conversationSid} not found`);

  if (!isDryRun() && isTwilioConfigured()) {
    try {
      await updateConversationState(conversationSid, "closed");
    } catch (err) {
      if (!(err instanceof TwilioDryRunSkip)) {
        console.warn("[twilio-outbound] closeConversation Twilio error", err);
      }
    }
  }

  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedReason: reason ?? "agent_closed",
    },
  });
}

export { ConsentRequiredError };
