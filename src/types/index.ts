import type { User, Lead, Ticket, TicketComment, Activity, Announcement, Contact, LeadList } from "@/generated/prisma/client";

export type SafeUser = Omit<User, "hashedPassword">;

export type LeadWithRelations = Lead & {
  assignedTo: SafeUser | null;
  createdBy: SafeUser;
  leadList: LeadList | null;
  _count?: { activities: number; tickets: number };
};

export type TicketWithRelations = Ticket & {
  createdBy: SafeUser;
  assignedTo: SafeUser | null;
  client: SafeUser | null;
  _count?: { comments: number };
};

export type TicketCommentWithAuthor = TicketComment & {
  author: SafeUser;
};

export type ActivityWithRelations = Activity & {
  performedBy: SafeUser;
  lead: Lead | null;
  ticket: Ticket | null;
};

export type AnnouncementWithAuthor = Announcement & {
  author: SafeUser;
};

export type ContactWithLead = Contact & {
  lead: Lead | null;
};

export interface DashboardStats {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  conversionRate: number;
  totalTickets: number;
  openTickets: number;
  newLeadsThisWeek: number;
  ticketsByPriority: Record<string, number>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
