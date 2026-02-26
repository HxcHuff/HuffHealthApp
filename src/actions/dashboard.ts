"use server";

import { db } from "@/lib/db";
import { format, subDays } from "date-fns";
import { CHART_COLORS } from "@/lib/constants";
import type { KpiItem, QueueItem } from "@/lib/ui-v2-mocks";

export interface CommandCenterData {
  kpis: KpiItem[];
  queue: QueueItem[];
  pulse: {
    tasksDueToday: number;
    openEscalations: number;
    renewalsIn30Days: number;
    unassignedServiceTickets: number;
  };
  buckets: {
    quoteFollowUp: number;
    enrollmentPendingDocs: number;
    retentionCallsDue: number;
  };
  compliance: {
    missingContactInfo: number;
    missingFollowUpDate: number;
    agedOpenTickets: number;
  };
}

function pctDeltaLabel(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100% vs prior period" : "0% vs prior period";
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(0)}% vs prior period`;
}

function pointDeltaLabel(current: number, previous: number): string {
  const delta = current - previous;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(0)} pts`;
}

function dueTextFromDate(dueDate: Date | null): string {
  if (!dueDate) return "No due date";
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  if (diffMs <= 0) return "Overdue";
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 24) return `Due in ${hours}h`;
  const days = Math.round(hours / 24);
  return `Due in ${days}d`;
}

export async function getCommandCenterData(): Promise<CommandCenterData> {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(now);
  endToday.setHours(23, 59, 59, 999);

  const sevenDaysAgo = subDays(now, 7);
  const fourteenDaysAgo = subDays(now, 14);
  const thirtyDaysOut = new Date(now);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

  const [
    newLeadsCurrent,
    newLeadsPrevious,
    quotedCurrent,
    quotedPrevious,
    appsSubmittedCurrent,
    appsSubmittedPrevious,
    renewalsAtRisk,
    renewalsGracePeriod,
    ticketsDueToday,
    escalatedTickets,
    tasksDueToday,
    renewalsIn30Days,
    unassignedServiceTickets,
    quoteFollowUp,
    enrollmentPendingDocs,
    retentionCallsDue,
    missingContactInfo,
    missingFollowUpDate,
    agedOpenTickets,
    urgentTasks,
    highPriorityTasks,
  ] = await Promise.all([
    db.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.lead.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    db.lead.count({ where: { status: "QUOTED", stageEnteredAt: { gte: sevenDaysAgo } } }),
    db.lead.count({ where: { status: "QUOTED", stageEnteredAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    db.lead.count({ where: { status: "APPLICATION_SENT", stageEnteredAt: { gte: sevenDaysAgo } } }),
    db.lead.count({ where: { status: "APPLICATION_SENT", stageEnteredAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    db.lead.count({
      where: {
        OR: [
          { policyStatus: "GRACE_PERIOD" },
          { policyRenewalDate: { gte: now, lte: thirtyDaysOut } },
        ],
      },
    }),
    db.lead.count({ where: { policyStatus: "GRACE_PERIOD" } }),
    db.ticket.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        dueDate: { gte: startToday, lte: endToday },
      },
    }),
    db.ticket.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        priority: "URGENT",
      },
    }),
    db.task.count({
      where: { isCompleted: false, dueDate: { gte: startToday, lte: endToday } },
    }),
    db.lead.count({
      where: { policyRenewalDate: { gte: now, lte: thirtyDaysOut } },
    }),
    db.ticket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, assignedToId: null },
    }),
    db.lead.count({ where: { status: "QUOTED" } }),
    db.lead.count({ where: { status: "APPLICATION_SENT" } }),
    db.lead.count({
      where: {
        OR: [{ policyStatus: "GRACE_PERIOD" }, { policyRenewalDate: { gte: now, lte: thirtyDaysOut } }],
      },
    }),
    db.lead.count({
      where: {
        status: { in: ["NEW_LEAD", "CONTACTED", "QUOTED", "APPLICATION_SENT"] },
        OR: [{ email: null }, { email: "" }, { phone: null }, { phone: "" }],
      },
    }),
    db.lead.count({
      where: {
        status: { in: ["QUOTED", "APPLICATION_SENT"] },
        followUpDate: null,
      },
    }),
    db.ticket.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        createdAt: { lt: seventyTwoHoursAgo },
      },
    }),
    db.task.findMany({
      where: { isCompleted: false, priority: "URGENT" },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: 5,
      include: { lead: { select: { firstName: true, lastName: true } } },
    }),
    db.task.findMany({
      where: { isCompleted: false, priority: "HIGH" },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: 5,
      include: { lead: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const queueSource = [...urgentTasks, ...highPriorityTasks].slice(0, 8);
  const queue: QueueItem[] = queueSource.map((task) => ({
    id: task.id,
    title: task.title,
    subtitle: task.lead ? `${task.lead.firstName} ${task.lead.lastName}` : "General service task",
    priority: task.priority,
    dueText: dueTextFromDate(task.dueDate),
  }));

  const kpis: KpiItem[] = [
    {
      id: "new-leads",
      label: "Leads",
      value: String(newLeadsCurrent),
      delta: pctDeltaLabel(newLeadsCurrent, newLeadsPrevious),
      tone: newLeadsCurrent >= newLeadsPrevious ? "success" : "warning",
    },
    {
      id: "quote-rate",
      label: "Quotes Sent <24h",
      value: `${newLeadsCurrent > 0 ? Math.round((quotedCurrent / newLeadsCurrent) * 100) : 0}%`,
      delta: pointDeltaLabel(
        newLeadsCurrent > 0 ? (quotedCurrent / newLeadsCurrent) * 100 : 0,
        newLeadsPrevious > 0 ? (quotedPrevious / newLeadsPrevious) * 100 : 0
      ),
      tone: quotedCurrent >= quotedPrevious ? "success" : "warning",
    },
    {
      id: "apps-submitted",
      label: "Apps Submitted",
      value: String(appsSubmittedCurrent),
      delta: `${appsSubmittedCurrent - appsSubmittedPrevious >= 0 ? "+" : ""}${appsSubmittedCurrent - appsSubmittedPrevious} vs prior period`,
      tone: appsSubmittedCurrent >= appsSubmittedPrevious ? "success" : "warning",
    },
    {
      id: "renewal-risk",
      label: "Renewals At Risk",
      value: String(renewalsAtRisk),
      delta: `${renewalsGracePeriod} in grace period`,
      tone: renewalsAtRisk > 0 ? "danger" : "neutral",
    },
    {
      id: "service-due",
      label: "Service Tickets Due Today",
      value: String(ticketsDueToday),
      delta: `${escalatedTickets} escalated`,
      tone: escalatedTickets > 0 ? "warning" : "neutral",
    },
  ];

  return {
    kpis,
    queue,
    pulse: {
      tasksDueToday,
      openEscalations: escalatedTickets,
      renewalsIn30Days,
      unassignedServiceTickets,
    },
    buckets: {
      quoteFollowUp,
      enrollmentPendingDocs,
      retentionCallsDue,
    },
    compliance: {
      missingContactInfo,
      missingFollowUpDate,
      agedOpenTickets,
    },
  };
}

export async function getLeadTrendsData(days: number = 30) {
  const startDate = subDays(new Date(), days);

  const leads = await db.lead.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const countsByDay: Record<string, number> = {};

  // Initialize all days to 0
  for (let i = days; i >= 0; i--) {
    const day = format(subDays(new Date(), i), "yyyy-MM-dd");
    countsByDay[day] = 0;
  }

  // Count leads per day
  for (const lead of leads) {
    const day = format(lead.createdAt, "yyyy-MM-dd");
    countsByDay[day] = (countsByDay[day] || 0) + 1;
  }

  return Object.entries(countsByDay).map(([date, count]) => ({
    date,
    count,
  }));
}

export async function getTicketResolutionData() {
  const grouped = await db.ticket.groupBy({
    by: ["status"],
    _count: true,
  });

  const statusLabels: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };

  return grouped.map((item) => ({
    status: item.status,
    label: statusLabels[item.status] || item.status,
    count: item._count,
    color: CHART_COLORS.ticket[item.status as keyof typeof CHART_COLORS.ticket] || "#6b7280",
  }));
}

export async function getConversionFunnelData() {
  const grouped = await db.lead.groupBy({
    by: ["status"],
    _count: true,
  });

  const statusMap: Record<string, number> = {};
  for (const item of grouped) {
    statusMap[item.status] = item._count;
  }

  const funnelOrder = ["NEW_LEAD", "CONTACTED", "QUOTED", "APPLICATION_SENT", "ENROLLED"] as const;
  const labels: Record<string, string> = {
    NEW_LEAD: "New Lead",
    CONTACTED: "Contacted",
    QUOTED: "Quoted",
    APPLICATION_SENT: "Application Sent",
    ENROLLED: "Enrolled",
  };

  return funnelOrder.map((status) => ({
    stage: labels[status],
    count: statusMap[status] || 0,
    color: CHART_COLORS.lead[status],
  }));
}

export async function getLeadSourcePerformanceData() {
  const grouped = await db.lead.groupBy({
    by: ["source"],
    _count: true,
    orderBy: { _count: { source: "desc" } },
  });

  return grouped.map((item) => ({
    source: item.source || "Unknown",
    count: item._count,
  }));
}
