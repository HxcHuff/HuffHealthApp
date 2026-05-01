import { db } from "@/lib/db";

export type AnalyticsPeriod = "today" | "week" | "month" | "quarter";

function rangeStart(period: AnalyticsPeriod): Date {
  const now = new Date();
  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "quarter":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
}

export interface ConversationAnalytics {
  period: AnalyticsPeriod;
  startedAt: string;
  totals: {
    conversations: number;
    activeConversations: number;
    inboundMessages: number;
    outboundMessages: number;
    optOuts: number;
  };
  byChannel: Array<{ channel: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  responseTime: {
    avgFirstResponseMs: number | null;
    sample: number;
  };
  funnel: {
    leadsCreated: number;
    firstMessageSent: number;
    responseReceived: number;
    enrolled: number;
  };
  optOutRate: number;
}

export async function getConversationAnalytics(
  period: AnalyticsPeriod = "week",
): Promise<ConversationAnalytics> {
  const start = rangeStart(period);

  const [
    conversations,
    activeConversations,
    inboundCount,
    outboundCount,
    optOutCount,
    byChannelRaw,
    leadsInRange,
    convosWithFirstMessage,
    convosWithResponse,
    enrolled,
  ] = await Promise.all([
    db.conversation.count({ where: { createdAt: { gte: start } } }),
    db.conversation.count({ where: { status: "ACTIVE" } }),
    db.message.count({ where: { sentAt: { gte: start }, direction: "INBOUND" } }),
    db.message.count({ where: { sentAt: { gte: start }, direction: "OUTBOUND" } }),
    db.consentLog.count({
      where: { revokedAt: { gte: start }, consentType: "TCPA_EXPRESS_WRITTEN" },
    }),
    db.conversation.groupBy({
      by: ["channel"],
      where: { createdAt: { gte: start } },
      _count: { _all: true },
    }),
    db.lead.count({ where: { createdAt: { gte: start } } }),
    db.conversation.count({
      where: { createdAt: { gte: start }, lastOutboundAt: { not: null } },
    }),
    db.conversation.count({
      where: { createdAt: { gte: start }, lastInboundAt: { not: null } },
    }),
    db.lead.count({ where: { status: "ENROLLED", createdAt: { gte: start } } }),
  ]);

  // Source breakdown by joining conversations -> leads.source
  const sourceData = await db.lead.groupBy({
    by: ["source"],
    where: {
      createdAt: { gte: start },
      conversations: { some: {} },
    },
    _count: { _all: true },
  });

  // Average first-response time: time between first inbound and first outbound
  const sampleConversations = await db.conversation.findMany({
    where: {
      createdAt: { gte: start },
      lastInboundAt: { not: null },
      lastOutboundAt: { not: null },
    },
    take: 200,
    select: {
      messages: {
        orderBy: { sentAt: "asc" },
        take: 50,
        select: { direction: true, sentAt: true },
      },
    },
  });

  const responseDurations: number[] = [];
  for (const c of sampleConversations) {
    let firstInbound: number | null = null;
    for (const m of c.messages) {
      if (m.direction === "INBOUND" && firstInbound === null) {
        firstInbound = m.sentAt.getTime();
      } else if (firstInbound !== null && m.direction === "OUTBOUND") {
        responseDurations.push(m.sentAt.getTime() - firstInbound);
        break;
      }
    }
  }
  const avgResponseMs =
    responseDurations.length > 0
      ? Math.round(
          responseDurations.reduce((a, b) => a + b, 0) / responseDurations.length,
        )
      : null;

  return {
    period,
    startedAt: start.toISOString(),
    totals: {
      conversations,
      activeConversations,
      inboundMessages: inboundCount,
      outboundMessages: outboundCount,
      optOuts: optOutCount,
    },
    byChannel: byChannelRaw.map((row) => ({
      channel: String(row.channel),
      count: row._count._all,
    })),
    bySource: sourceData.map((row) => ({
      source: row.source ?? "(unknown)",
      count: row._count._all,
    })),
    responseTime: {
      avgFirstResponseMs: avgResponseMs,
      sample: responseDurations.length,
    },
    funnel: {
      leadsCreated: leadsInRange,
      firstMessageSent: convosWithFirstMessage,
      responseReceived: convosWithResponse,
      enrolled,
    },
    optOutRate:
      conversations > 0 ? Number((optOutCount / conversations).toFixed(4)) : 0,
  };
}
