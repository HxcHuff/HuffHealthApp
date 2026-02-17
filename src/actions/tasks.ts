"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/validations/task";

export async function createTask(data: Record<string, unknown>) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const validated = CreateTaskSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const task = await db.task.create({
    data: {
      title: validated.data.title,
      description: validated.data.description || null,
      dueDate: validated.data.dueDate ? new Date(validated.data.dueDate) : null,
      priority: validated.data.priority || "MEDIUM",
      assignedToId: validated.data.assignedToId,
      createdById: session.user.id,
      leadId: validated.data.leadId || null,
      ticketId: validated.data.ticketId || null,
      contactId: validated.data.contactId || null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, id: task.id };
}

export async function updateTask(id: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const validated = UpdateTaskSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const updateData: Record<string, unknown> = { ...validated.data };
  if (validated.data.dueDate !== undefined) {
    updateData.dueDate = validated.data.dueDate ? new Date(validated.data.dueDate) : null;
  }

  const task = await db.task.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, task };
}

export async function completeTask(id: string) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const task = await db.task.findUnique({ where: { id } });
  if (!task) return { error: "Task not found" };

  await db.task.update({
    where: { id },
    data: {
      isCompleted: !task.isCompleted,
      completedAt: task.isCompleted ? null : new Date(),
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTask(id: string) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getTasks({
  assignedToId,
  isCompleted,
  leadId,
  page = 1,
  limit = 25,
}: {
  assignedToId?: string;
  isCompleted?: boolean;
  leadId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const where: Record<string, unknown> = {};
  if (assignedToId) where.assignedToId = assignedToId;
  if (isCompleted !== undefined) where.isCompleted = isCompleted;
  if (leadId) where.leadId = leadId;

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        ticket: { select: { id: true, subject: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [
        { isCompleted: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.task.count({ where }),
  ]);

  return { tasks, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMyTasks() {
  const session = await auth();
  if (!session) return [];

  return db.task.findMany({
    where: {
      assignedToId: session.user.id,
      isCompleted: false,
    },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      ticket: { select: { id: true, subject: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 10,
  });
}

export async function getOverdueTaskCount() {
  const session = await auth();
  if (!session) return 0;

  return db.task.count({
    where: {
      assignedToId: session.user.id,
      isCompleted: false,
      dueDate: { lt: new Date() },
    },
  });
}

export async function getUpcomingTasks(limit = 5) {
  const session = await auth();
  if (!session) return [];

  return db.task.findMany({
    where: {
      assignedToId: session.user.id,
      isCompleted: false,
    },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      ticket: { select: { id: true, subject: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}
