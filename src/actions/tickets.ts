"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreateTicketSchema, UpdateTicketSchema, CreateCommentSchema } from "@/lib/validations/ticket";
import { logActivity } from "./activities";
import { notifyTicketStatusChange, notifyTicketComment } from "@/lib/notifications";

export async function createTicket(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const raw = {
    subject: formData.get("subject") as string,
    description: formData.get("description") as string,
    priority: (formData.get("priority") as string) || "MEDIUM",
    assignedToId: formData.get("assignedToId") as string || undefined,
    clientId: formData.get("clientId") as string || undefined,
  };

  const validated = CreateTicketSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const isClient = session.user.role === "CLIENT";
  const ticket = await db.ticket.create({
    data: {
      ...validated.data,
      createdById: session.user.id,
      clientId: isClient ? session.user.id : validated.data.clientId,
      priority: isClient ? "MEDIUM" : validated.data.priority,
    },
  });

  await logActivity({
    type: "TICKET_CREATED",
    description: `Created ticket: ${ticket.subject}`,
    ticketId: ticket.id,
  });

  revalidatePath("/tickets");
  revalidatePath("/portal/tickets");
  return { success: true, id: ticket.id };
}

export async function updateTicket(id: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const validated = UpdateTicketSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const existing = await db.ticket.findUnique({ where: { id } });
  if (!existing) return { error: "Ticket not found" };

  const ticket = await db.ticket.update({
    where: { id },
    data: validated.data,
  });

  if (validated.data.status && validated.data.status !== existing.status) {
    await logActivity({
      type: "TICKET_UPDATED",
      description: `Changed ticket status from ${existing.status} to ${validated.data.status}`,
      ticketId: id,
      metadata: { oldStatus: existing.status, newStatus: validated.data.status },
    });
    void notifyTicketStatusChange({
      ticketId: id,
      oldStatus: existing.status,
      newStatus: validated.data.status,
      updatedById: session.user.id,
    });
  }

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${id}`);
  revalidatePath("/portal/tickets");
  return { success: true, ticket };
}

export async function addComment(ticketId: string, formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const raw = {
    content: formData.get("content") as string,
    isInternal: formData.get("isInternal") === "true",
  };

  const validated = CreateCommentSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  // Clients cannot create internal comments
  const isInternal = session.user.role === "CLIENT" ? false : validated.data.isInternal;

  // Verify client owns this ticket
  if (session.user.role === "CLIENT") {
    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.clientId !== session.user.id) {
      return { error: "Unauthorized" };
    }
  }

  const comment = await db.ticketComment.create({
    data: {
      content: validated.data.content,
      isInternal,
      ticketId,
      authorId: session.user.id,
    },
  });

  await logActivity({
    type: "COMMENT",
    description: `Added ${isInternal ? "internal " : ""}comment on ticket`,
    ticketId,
  });

  void notifyTicketComment({
    ticketId,
    commentId: comment.id,
    authorId: session.user.id,
    isInternal,
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath(`/portal/tickets/${ticketId}`);
  return { success: true };
}

export async function getTickets({
  page = 1,
  limit = 25,
  status,
  priority,
  search,
  clientId,
}: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  clientId?: string;
} = {}) {
  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (clientId) where.clientId = clientId;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
    ];
  }

  const [tickets, total] = await Promise.all([
    db.ticket.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.ticket.count({ where }),
  ]);

  return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTicket(id: string) {
  return db.ticket.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, email: true, role: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: {
          performedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}
