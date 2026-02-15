"use server";

import { db } from "@/lib/db";
import { format, subDays } from "date-fns";
import { CHART_COLORS } from "@/lib/constants";

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
