import { db } from "@/lib/db";
import type { ConversationChannel as PrismaChannel, MessageDeliveryStatus } from "@/generated/prisma/client";
import { maskPhone } from "./signature";
import {
  findOrCreateMessengerLead,
  parseMessengerId,
} from "./messenger";

const STOP_KEYWORDS = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "QUIT", "END"];
const START_KEYWORDS = ["START", "UNSTOP", "YES"];

export interface InboundMessageEvent {
  conversationSid: string;
  messageSid: string;
  author?: string | null;
  body?: string | null;
  mediaUrls?: string[];
  participantPhone?: string | null;
  channel?: "sms" | "whatsapp" | "webchat" | "facebook_messenger";
  attributes?: Record<string, unknown>;
}

export interface ConversationStateEvent {
  conversationSid: string;
  state: "active" | "inactive" | "closed";
}

export interface MessageStatusEvent {
  messageSid: string;
  status: MessageDeliveryStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
}

function detectOptOut(body: string | null | undefined): boolean {
  if (!body) return false;
  const trimmed = body.trim().toUpperCase();
  return STOP_KEYWORDS.includes(trimmed);
}

function detectOptIn(body: string | null | undefined): boolean {
  if (!body) return false;
  const trimmed = body.trim().toUpperCase();
  return START_KEYWORDS.includes(trimmed);
}

function mapChannel(channel: InboundMessageEvent["channel"]): PrismaChannel {
  switch (channel) {
    case "whatsapp":
      return "WHATSAPP";
    case "webchat":
      return "WEBCHAT";
    case "facebook_messenger":
      return "FACEBOOK_MESSENGER";
    case "sms":
    default:
      return "SMS";
  }
}

function isMessengerChannel(channel: InboundMessageEvent["channel"]): boolean {
  return channel === "facebook_messenger";
}

async function findOrCreateLead(
  phone: string | null | undefined,
  event: InboundMessageEvent,
): Promise<string | null> {
  if (isMessengerChannel(event.channel)) {
    const psid =
      parseMessengerId(phone) ??
      parseMessengerId(typeof event.attributes?.facebookPsid === "string" ? event.attributes.facebookPsid : null);
    if (!psid) return null;
    return findOrCreateMessengerLead({
      psid,
      pageId: typeof event.attributes?.facebookPageId === "string" ? event.attributes.facebookPageId : null,
      profileName: typeof event.attributes?.profileName === "string" ? event.attributes.profileName : null,
    });
  }

  if (!phone) return null;

  const lead = await db.lead.findFirst({
    where: { phone },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  if (lead) return lead.id;

  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) return null;

  const created = await db.lead.create({
    data: {
      firstName: "Unknown",
      lastName: "Inbound",
      phone,
      status: "NEW_LEAD",
      source: "inbound_sms",
      sourceCategory: "DIRECT",
      priority: "WARM",
      createdById: admin.id,
      leadEvents: {
        create: {
          type: "CREATED",
          payload: { source: "inbound_sms", phone },
        },
      },
    },
    select: { id: true },
  });
  return created.id;
}

async function recordOptOut(leadId: string, body: string, source: string): Promise<void> {
  await db.consentLog.create({
    data: {
      leadId,
      consentType: "TCPA_EXPRESS_WRITTEN",
      consentGiven: false,
      consentMethod: "ELECTRONIC",
      consentText: `Opt-out via inbound keyword: ${body.trim()}`,
      revokedAt: new Date(),
      revokedReason: "Inbound STOP keyword",
      source,
    },
  });
  await db.leadEvent.create({
    data: {
      leadId,
      type: "CONSENT_REVOKED",
      payload: { method: "inbound_keyword", body: body.trim(), source },
    },
  });
}

export async function processInboundMessage(event: InboundMessageEvent): Promise<{
  conversationId: string;
  messageId: string;
  optOut: boolean;
  leadId: string | null;
}> {
  const phone = event.participantPhone ?? event.author ?? null;
  const messenger = isMessengerChannel(event.channel);
  console.info(
    `[twilio-inbound] conversation=${event.conversationSid} from=${maskPhone(phone)} channel=${event.channel ?? "sms"} bodyLen=${event.body?.length ?? 0}`,
  );

  let conversation = await db.conversation.findUnique({
    where: { twilioConversationSid: event.conversationSid },
    select: { id: true, leadId: true, channel: true },
  });

  let leadId = conversation?.leadId ?? null;
  if (!conversation) {
    leadId = await findOrCreateLead(phone, event);
    conversation = await db.conversation.create({
      data: {
        twilioConversationSid: event.conversationSid,
        channel: mapChannel(event.channel),
        status: "ACTIVE",
        participantPhone: phone,
        leadId,
        attributes: event.attributes
          ? (event.attributes as object)
          : undefined,
        lastMessageAt: new Date(),
        lastInboundAt: new Date(),
        unreadCount: 1,
      },
      select: { id: true, leadId: true, channel: true },
    });
    if (leadId) {
      const existingConsent = await db.consentLog.findFirst({
        where: { leadId },
        select: { id: true },
      });
      if (!existingConsent) {
        await db.consentLog.create({
          data: {
            leadId,
            consentType: "INBOUND_INITIATED",
            consentGiven: true,
            consentMethod: "INBOUND_INITIATED",
            consentText: messenger
              ? "Inbound Facebook Messenger message initiated this thread. This records reply consent on Messenger only and does not authorize SMS or calls."
              : "Inbound message from lead initiated this conversation. Reply consent recorded under TCPA prior-business-relationship doctrine; promotional outreach still requires express written consent.",
            source: messenger ? "facebook_messenger" : "inbound_sms",
          },
        });
        await db.leadEvent.create({
          data: {
            leadId,
            type: "CONSENT_RECORDED",
            payload: {
              type: "INBOUND_INITIATED",
              method: messenger ? "facebook_messenger" : "inbound_sms",
            },
          },
        });
      }
      await db.leadEvent.create({
        data: {
          leadId,
          type: "CONVERSATION_STARTED",
          payload: {
            twilioConversationSid: event.conversationSid,
            channel: event.channel ?? "sms",
            initiatedBy: "inbound",
          },
        },
      });
    }
  }

  const optOut = detectOptOut(event.body);
  const optIn = detectOptIn(event.body);

  const message = await db.message.upsert({
    where: { twilioMessageSid: event.messageSid },
    create: {
      conversationId: conversation.id,
      twilioMessageSid: event.messageSid,
      direction: "INBOUND",
      body: event.body ?? null,
      mediaUrl: event.mediaUrls?.[0] ?? null,
      mediaUrls: event.mediaUrls ?? [],
      author: phone,
      sentAt: new Date(),
      attributes: event.attributes ? (event.attributes as object) : undefined,
    },
    update: {
      body: event.body ?? null,
      mediaUrl: event.mediaUrls?.[0] ?? null,
      mediaUrls: event.mediaUrls ?? [],
    },
    select: { id: true },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      lastInboundAt: new Date(),
      unreadCount: { increment: 1 },
    },
  });

  if (leadId) {
    await db.leadEvent.create({
      data: {
        leadId,
        type: "CONVERSATION_MESSAGE",
        payload: {
          direction: "inbound",
          messageId: message.id,
          conversationSid: event.conversationSid,
          mediaCount: event.mediaUrls?.length ?? 0,
          channel: event.channel ?? "sms",
        },
      },
    });
  }

  if (optOut && leadId) {
    await recordOptOut(leadId, event.body ?? "", messenger ? "facebook_messenger" : "inbound_sms");
    try {
      const { sendOutboundMessage } = await import("./outbound");
      await sendOutboundMessage({
        conversationSid: event.conversationSid,
        body: messenger
          ? "You have been unsubscribed from this Messenger thread. We will not send further Facebook messages here. This does not change SMS consent."
          : "You have been unsubscribed. You will not receive any more messages from this number. Reply START to re-subscribe.",
        bypassHoursCheck: true,
        bypassConsentCheck: true,
        isReplyToInbound: true,
      });
    } catch (err) {
      console.warn("[twilio-inbound] opt-out confirmation send failed", err);
    }
    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closedReason: "Opt-out",
      },
    });
  }

  if (optIn && leadId) {
    await db.consentLog.create({
      data: {
        leadId,
        consentType: messenger ? "INBOUND_INITIATED" : "TCPA_EXPRESS_WRITTEN",
        consentGiven: true,
        consentMethod: "ELECTRONIC",
        consentText: messenger
          ? `Re-subscribe on Facebook Messenger: ${(event.body ?? "").trim()}`
          : `Re-subscribe via inbound START keyword: ${(event.body ?? "").trim()}`,
        source: messenger ? "facebook_messenger" : "inbound_keyword",
      },
    });
    await db.leadEvent.create({
      data: {
        leadId,
        type: "CONSENT_RECORDED",
        payload: { method: messenger ? "facebook_messenger" : "inbound_keyword", body: (event.body ?? "").trim() },
      },
    });
  }

  return { conversationId: conversation.id, messageId: message.id, optOut, leadId };
}

export async function processConversationState(event: ConversationStateEvent): Promise<void> {
  const status =
    event.state === "active" ? "ACTIVE" : event.state === "closed" ? "CLOSED" : "ARCHIVED";

  await db.conversation.updateMany({
    where: { twilioConversationSid: event.conversationSid },
    data: {
      status,
      ...(status === "CLOSED" ? { closedAt: new Date() } : {}),
    },
  });
}

export async function processMessageStatus(event: MessageStatusEvent): Promise<void> {
  const data: {
    deliveryStatus: MessageDeliveryStatus;
    deliveredAt?: Date;
    failedAt?: Date;
    errorCode?: string;
    errorMessage?: string;
  } = { deliveryStatus: event.status };

  if (event.status === "DELIVERED") data.deliveredAt = new Date();
  if (event.status === "FAILED" || event.status === "UNDELIVERED") {
    data.failedAt = new Date();
    if (event.errorCode) data.errorCode = event.errorCode;
    if (event.errorMessage) data.errorMessage = event.errorMessage;
  }

  await db.message.updateMany({
    where: { twilioMessageSid: event.messageSid },
    data,
  });

  if (event.status === "FAILED" || event.status === "UNDELIVERED") {
    const message = await db.message.findUnique({
      where: { twilioMessageSid: event.messageSid },
      select: { conversationId: true },
    });
    if (message) {
      await db.conversation.update({
        where: { id: message.conversationId },
        data: {
          attributes: {
            flaggedForReview: true,
            flaggedReason: `Message ${event.status}: ${event.errorMessage ?? event.errorCode ?? "unknown"}`,
            flaggedAt: new Date().toISOString(),
          },
        },
      });
    }
  }
}
