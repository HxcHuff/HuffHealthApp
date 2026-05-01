"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendOutboundMessage, closeConversation } from "@/lib/twilio/outbound";
import { ConsentRequiredError } from "@/lib/twilio/compliance";
import type { ConversationStatus, ConversationChannel } from "@/generated/prisma/client";

interface ListFilters {
  status?: ConversationStatus;
  channel?: ConversationChannel;
  unreadOnly?: boolean;
  search?: string;
  limit?: number;
}

export async function listConversations(filters: ListFilters = {}) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.channel) where.channel = filters.channel;
  if (filters.unreadOnly) where.unreadCount = { gt: 0 };
  if (filters.search) {
    where.OR = [
      { participantPhone: { contains: filters.search } },
      { lead: { firstName: { contains: filters.search, mode: "insensitive" } } },
      { lead: { lastName: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const conversations = await db.conversation.findMany({
    where,
    take: filters.limit ?? 50,
    orderBy: { lastMessageAt: "desc" },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          insuranceType: true,
          dateOfBirth: true,
          zipCode: true,
        },
      },
      messages: {
        take: 1,
        orderBy: { sentAt: "desc" },
        select: { id: true, body: true, direction: true, sentAt: true },
      },
    },
  });

  const totalUnread = await db.conversation.aggregate({
    where: { status: "ACTIVE", unreadCount: { gt: 0 } },
    _sum: { unreadCount: true },
  });

  return {
    success: true,
    conversations,
    totalUnread: totalUnread._sum.unreadCount ?? 0,
  };
}

export async function getConversationDetails(twilioConversationSid: string) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const conversation = await db.conversation.findUnique({
    where: { twilioConversationSid },
    include: {
      lead: {
        include: {
          consentLogs: {
            orderBy: { consentedAt: "desc" },
            take: 5,
          },
        },
      },
      messages: {
        orderBy: { sentAt: "asc" },
        take: 200,
      },
    },
  });

  if (!conversation) return { error: "Not found" };

  const consentStatus = conversation.lead?.consentLogs?.[0];
  return {
    success: true,
    conversation,
    consentStatus: consentStatus
      ? {
          type: consentStatus.consentType,
          given: consentStatus.consentGiven && !consentStatus.revokedAt,
          revokedAt: consentStatus.revokedAt,
          consentedAt: consentStatus.consentedAt,
        }
      : null,
  };
}

export async function markConversationRead(twilioConversationSid: string) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  await db.conversation.updateMany({
    where: { twilioConversationSid },
    data: { unreadCount: 0 },
  });

  revalidatePath("/conversations");
  return { success: true };
}

export async function sendConversationMessage(args: {
  twilioConversationSid: string;
  body: string;
}) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  if (!args.body || args.body.trim().length === 0) {
    return { error: "Message body required" };
  }

  try {
    const result = await sendOutboundMessage({
      conversationSid: args.twilioConversationSid,
      body: args.body.trim(),
      author: session.user.name ?? "Agent",
      isReplyToInbound: true,
    });
    revalidatePath("/conversations");
    return {
      success: true,
      messageId: result.messageId,
      dryRun: result.dryRun,
    };
  } catch (err) {
    if (err instanceof ConsentRequiredError) {
      return { error: `Compliance: ${err.reasons.join(", ")}` };
    }
    console.error("[conversations] sendMessage failed", err);
    return { error: err instanceof Error ? err.message : "Send failed" };
  }
}

export async function closeConversationAction(args: {
  twilioConversationSid: string;
  reason?: string;
}) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  await closeConversation(args.twilioConversationSid, args.reason ?? `closed by ${session.user.name ?? "agent"}`);
  revalidatePath("/conversations");
  return { success: true };
}
