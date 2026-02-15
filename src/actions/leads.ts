"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreateLeadSchema, UpdateLeadSchema } from "@/lib/validations/lead";
import { logActivity } from "./activities";
import { notifyLeadAssignment } from "@/lib/notifications";
import { syncToDripEngine } from "@/lib/drip-engine";

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
    void syncToDripEngine({
      first_name: lead.firstName,
      last_name: lead.lastName,
      email: lead.email,
      phone: lead.phone || undefined,
      zip_code: lead.zipCode || undefined,
      lead_source: lead.source || undefined,
      crm_lead_id: lead.id,
    });
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

export async function getLeads({
  page = 1,
  limit = 25,
  status,
  search,
  source,
  assignedToId,
}: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  source?: string;
  assignedToId?: string;
} = {}) {
  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (source) where.source = source;
  if (assignedToId) where.assignedToId = assignedToId;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { zipCode: { contains: search, mode: "insensitive" } },
    ];
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
