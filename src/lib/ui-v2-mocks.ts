export interface KpiItem {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: "neutral" | "success" | "warning" | "danger";
}

export interface QueueItem {
  id: string;
  title: string;
  subtitle: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueText: string;
}

export interface InboxThread {
  id: string;
  channel: "SMS" | "CALL" | "EMAIL" | "INTERNAL";
  name: string;
  preview: string;
  owner: string;
  sla: string;
  status: "Unassigned" | "Mine" | "Team" | "Escalated";
}

export interface PolicyRow {
  id: string;
  clientName: string;
  carrier: string;
  product: string;
  premium: string;
  renewalDate: string;
  status: "ACTIVE" | "PENDING" | "GRACE_PERIOD" | "LAPSED";
  producer: string;
}

export interface QuoteRow {
  id: string;
  leadName: string;
  market: string;
  stage: "NEW" | "IN_PROGRESS" | "PROPOSAL_SENT" | "WON" | "LOST";
  bestFitPlan: string;
  estPremium: string;
  owner: string;
}

export const dashboardKpis: KpiItem[] = [
  { id: "new-leads", label: "Leads", value: "84", delta: "+12% vs last week", tone: "success" },
  { id: "quote-rate", label: "Quotes Sent <24h", value: "63%", delta: "+4 pts", tone: "success" },
  { id: "bind-rate", label: "Apps Submitted", value: "29", delta: "-1 vs yesterday", tone: "warning" },
  { id: "renewal-risk", label: "Renewals At Risk", value: "41", delta: "11 need outreach today", tone: "danger" },
  { id: "sla-breach", label: "Service Tickets Due Today", value: "7", delta: "2 escalated", tone: "warning" },
];

export const priorityQueue: QueueItem[] = [
  { id: "q1", title: "Grace period rescue", subtitle: "Marta Simmons - Policy HHA-3831", priority: "URGENT", dueText: "Due in 2h" },
  { id: "q2", title: "Renewal retention call", subtitle: "James Whitaker - Medicare Advantage", priority: "HIGH", dueText: "Due today" },
  { id: "q3", title: "Missing SOA + consent", subtitle: "Nina Patel - Application pending", priority: "HIGH", dueText: "Due today" },
  { id: "q4", title: "Carrier follow-up on pending app", subtitle: "Todd Reynolds - ACA family plan", priority: "MEDIUM", dueText: "Due tomorrow" },
];

export const inboxThreads: InboxThread[] = [
  { id: "t1", channel: "SMS", name: "Marissa Lane", preview: "Can you resend the quote details?", owner: "Unassigned", sla: "18m", status: "Unassigned" },
  { id: "t2", channel: "CALL", name: "Richard Crane", preview: "Voicemail left about renewal options.", owner: "Taylor", sla: "1h", status: "Mine" },
  { id: "t3", channel: "EMAIL", name: "Lina Gomez", preview: "Attached my updated documents.", owner: "Jordan", sla: "3h", status: "Team" },
  { id: "t4", channel: "INTERNAL", name: "Escalation Bot", preview: "Ticket #TK-928 is near SLA breach.", owner: "Ops", sla: "45m", status: "Escalated" },
];

export const policyRows: PolicyRow[] = [
  { id: "P-1001", clientName: "Alicia Miles", carrier: "UnitedHealthcare", product: "Medicare Advantage", premium: "$228", renewalDate: "2026-04-11", status: "ACTIVE", producer: "Taylor" },
  { id: "P-1002", clientName: "Damon Cole", carrier: "Aetna", product: "ACA Silver", premium: "$414", renewalDate: "2026-03-21", status: "PENDING", producer: "Jordan" },
  { id: "P-1003", clientName: "Sofia Quinn", carrier: "Cigna", product: "Dental + Vision", premium: "$62", renewalDate: "2026-02-25", status: "GRACE_PERIOD", producer: "Alex" },
  { id: "P-1004", clientName: "Neil Parker", carrier: "Humana", product: "Part D", premium: "$41", renewalDate: "2026-02-10", status: "LAPSED", producer: "Taylor" },
];

export const quoteRows: QuoteRow[] = [
  { id: "Q-870", leadName: "Britt Dawson", market: "ACA", stage: "IN_PROGRESS", bestFitPlan: "Blue Select 4500", estPremium: "$389", owner: "Jordan" },
  { id: "Q-871", leadName: "Mack Ellis", market: "Medicare", stage: "PROPOSAL_SENT", bestFitPlan: "Secure MA Value", estPremium: "$0 + Rx", owner: "Taylor" },
  { id: "Q-872", leadName: "Zara Blake", market: "Life", stage: "NEW", bestFitPlan: "Term 20 - 500k", estPremium: "$58", owner: "Alex" },
  { id: "Q-873", leadName: "Colin Hart", market: "ACA", stage: "WON", bestFitPlan: "Marketplace Gold 2000", estPremium: "$473", owner: "Jordan" },
];
