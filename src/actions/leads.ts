"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreateLeadSchema, UpdateLeadSchema } from "@/lib/validations/lead";
import { logActivity } from "./activities";
import { notifyLeadAssignment } from "@/lib/notifications";
import { syncToDripEngine, autoEnrollByStatus } from "@/lib/drip-engine";

export async function createLead(formData: FormData) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    company: formData.get("company") as string,
    jobTitle: formData.get("jobTitle") as string,
    source: formData.get("source") as string,
    notes: formData.get("notes") as string,
    assignedToId: formData.get("assignedToId") as string || undefined,
  };

  const validated = CreateLeadSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const lead = await db.lead.create({
    data: {
      ...validated.data,
      email: validated.data.email || null,
      createdById: session.user.id,
    },
  });

  await logActivity({
    type: "NOTE",
    description: `Created lead: ${lead.firstName} ${lead.lastName}`,
    leadId: lead.id,
  });

  // Sync to drip engine (non-blocking)
  if (lead.email) {
    syncToDripEngine({
      first_name: lead.firstName,
      last_name: lead.lastName,
      email: lead.email,
      phone: lead.phone || undefined,
      zip_code: lead.zipCode || undefined,
      lead_source: lead.source || undefined,
      crm_lead_id: lead.id,
    }).then(() => {
      db.lead.update({ where: { id: lead.id }, data: { dripSyncedAt: new Date() } }).catch(() => {});
    }).catch(() => {});
  }

  revalidatePath("/leads");
  return { success: true, id: lead.id };
}

export async function updateLead(id: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const validated = UpdateLeadSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const existingLead = await db.lead.findUnique({ where: { id } });
  if (!existingLead) return { error: "Lead not found" };

  const updateData = { ...validated.data };
  if (updateData.status && updateData.status !== existingLead.status) {
    (updateData as Record<string, unknown>).stageEnteredAt = new Date();
  }

  const lead = await db.lead.update({
    where: { id },
    data: updateData,
  });

  if (validated.data.status && validated.data.status !== existingLead.status) {
    await logActivity({
      type: "STATUS_CHANGE",
      description: `Changed lead status from ${existingLead.status} to ${validated.data.status}`,
      leadId: id,
      metadata: { oldStatus: existingLead.status, newStatus: validated.data.status },
    });

    // Auto-enroll in drip sequence based on new status (non-blocking)
    if (lead.email) {
      void autoEnrollByStatus(lead.email, validated.data.status);
    }
  }

  if (validated.data.assignedToId && validated.data.assignedToId !== existingLead.assignedToId) {
    await logActivity({
      type: "ASSIGNMENT",
      description: `Lead assigned to a new team member`,
      leadId: id,
    });
    void notifyLeadAssignment({
      leadId: id,
      assignedToId: validated.data.assignedToId,
      assignedById: session.user.id,
    });
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { success: true, lead };
}

export async function deleteLead(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  await db.lead.delete({ where: { id } });
  revalidatePath("/leads");
  return { success: true };
}

function parseDateOfBirth(dob: string): Date | null {
  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) return new Date(dob + "T00:00:00");
  // Handle M/D/YYYY or MM/DD/YYYY
  const slashMatch = dob.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return new Date(+slashMatch[3], +slashMatch[1] - 1, +slashMatch[2]);
  // Handle M-D-YYYY or MM-DD-YYYY
  const dashMatch = dob.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) return new Date(+dashMatch[3], +dashMatch[1] - 1, +dashMatch[2]);
  return null;
}

function buildActionFilter(filter?: string, ageFilter?: string): Record<string, unknown> {
  const now = new Date();
  const where: Record<string, unknown> = {};

  if (ageFilter) {
    // Age-based filters are handled post-query (need JS date math)
    where.dateOfBirth = { not: null };
    return where;
  }

  if (!filter) return where;

  switch (filter) {
    case "birthdayThisMonth":
      where.dateOfBirth = { not: null };
      break;
    case "aep":
      where.status = { in: ["QUOTED", "APPLICATION_SENT"] };
      break;
    case "oep":
    case "maoep":
      where.status = "ENROLLED";
      break;
    case "sep":
      where.status = { in: ["NEW_LEAD", "CONTACTED"] };
      where.stageEnteredAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      break;
    case "renewalSoon":
      where.status = "ENROLLED";
      where.stageEnteredAt = { lte: new Date(now.getTime() - 11 * 30 * 24 * 60 * 60 * 1000) };
      break;
    case "gracePeriod":
      where.status = "ENROLLED";
      where.stageEnteredAt = {
        gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
      break;
    case "lapsed":
      where.status = "LOST";
      break;
    case "annualReview":
      where.status = "ENROLLED";
      where.stageEnteredAt = { lte: new Date(now.getTime() - 10 * 30 * 24 * 60 * 60 * 1000) };
      break;
    case "followUpDue":
      where.status = "CONTACTED";
      where.stageEnteredAt = { lte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) };
      break;
    case "openQuotes":
      where.status = "QUOTED";
      break;
    case "today": {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: startOfDay };
      break;
    }
    case "overdue":
      where.status = { in: ["CONTACTED", "QUOTED"] };
      where.stageEnteredAt = { lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      break;
  }

  return where;
}

export async function getLeads({
  page = 1,
  limit = 25,
  status,
  search,
  source,
  assignedToId,
  filter,
  ageFilter,
  createdFrom,
  createdTo,
  stateFilter,
  cityFilter,
  sources,
  statuses,
  assignedToIds,
  minDaysInStage,
  maxDaysInStage,
}: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  source?: string;
  assignedToId?: string;
  filter?: string;
  ageFilter?: string;
  createdFrom?: string;
  createdTo?: string;
  stateFilter?: string;
  cityFilter?: string;
  sources?: string[];
  statuses?: string[];
  assignedToIds?: string[];
  minDaysInStage?: number;
  maxDaysInStage?: number;
} = {}) {
  const where: Record<string, unknown> = {};

  // Apply action filters first
  const actionWhere = buildActionFilter(filter, ageFilter);
  Object.assign(where, actionWhere);

  // Standard filters (only apply if not overridden by action filter)
  if (status && !where.status) where.status = status;
  if (source) where.source = source;
  if (assignedToId) where.assignedToId = assignedToId;

  // Advanced filters
  if (statuses?.length && !where.status) where.status = { in: statuses };
  if (sources?.length) where.source = { in: sources };
  if (assignedToIds?.length) where.assignedToId = { in: assignedToIds };
  if (stateFilter) where.state = { equals: stateFilter, mode: "insensitive" };
  if (cityFilter) where.city = { contains: cityFilter, mode: "insensitive" };

  if (createdFrom || createdTo) {
    const createdAtFilter: Record<string, Date> = {};
    if (createdFrom) createdAtFilter.gte = new Date(createdFrom);
    if (createdTo) createdAtFilter.lte = new Date(createdTo + "T23:59:59");
    if (!where.createdAt) where.createdAt = createdAtFilter;
  }

  if (minDaysInStage || maxDaysInStage) {
    const now = new Date();
    const stageFilter: Record<string, Date> = {};
    if (maxDaysInStage) stageFilter.gte = new Date(now.getTime() - maxDaysInStage * 24 * 60 * 60 * 1000);
    if (minDaysInStage) stageFilter.lte = new Date(now.getTime() - minDaysInStage * 24 * 60 * 60 * 1000);
    if (!where.stageEnteredAt) where.stageEnteredAt = stageFilter;
  }
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { zipCode: { contains: search, mode: "insensitive" } },
    ];
  }

  // For age-based and birthday filters, fetch all matching then filter in JS
  const needsJsFilter = !!ageFilter || filter === "birthdayThisMonth";

  if (needsJsFilter) {
    const allLeads = await db.lead.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, image: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, image: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const filtered = allLeads.filter((lead) => {
      if (!lead.dateOfBirth) return false;
      const dob = parseDateOfBirth(lead.dateOfBirth);
      if (!dob) return false;

      if (filter === "birthdayThisMonth") {
        return dob.getMonth() === now.getMonth();
      }

      if (ageFilter) {
        const targetAge = ageFilter === "turning65" ? 65 : ageFilter === "turning26" ? 26 : ageFilter === "turning55" ? 55 : 0;
        if (targetAge === 0) return false;
        const birthdayThisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
        const ageThisYear = now.getFullYear() - dob.getFullYear();
        const turnsTarget = ageThisYear === targetAge;
        const withinWindow = birthdayThisYear.getTime() >= now.getTime() - 90 * 24 * 60 * 60 * 1000
          && birthdayThisYear.getTime() <= now.getTime() + 90 * 24 * 60 * 60 * 1000;
        return turnsTarget && withinWindow;
      }

      return true;
    });

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);
    return { leads: paginated, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, image: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, image: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.lead.count({ where }),
  ]);

  return { leads, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getLead(id: string) {
  return db.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, image: true, role: true } },
      createdBy: { select: { id: true, name: true, email: true, image: true, role: true } },
      leadList: true,
      activities: {
        include: {
          performedBy: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      tickets: {
        select: { id: true, subject: true, status: true, priority: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function getStaffUsers() {
  return db.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] }, isActive: true },
    select: { id: true, name: true, email: true, image: true, role: true },
    orderBy: { name: "asc" },
  });
}
