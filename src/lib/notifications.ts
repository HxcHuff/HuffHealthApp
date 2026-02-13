import { db } from "@/lib/db";
import { sendEmail } from "./email";
import * as templates from "./email-templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface NotificationPreferences {
  ticketUpdates?: boolean;
  leadAssignments?: boolean;
  announcements?: boolean;
}

function getPrefs(raw: unknown): NotificationPreferences {
  if (raw && typeof raw === "object") return raw as NotificationPreferences;
  return {};
}

export async function notifyTicketStatusChange({
  ticketId,
  oldStatus,
  newStatus,
  updatedById,
}: {
  ticketId: string;
  oldStatus: string;
  newStatus: string;
  updatedById: string;
}) {
  try {
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        client: { select: { id: true, email: true, name: true, notificationPreferences: true } },
        assignedTo: { select: { id: true, email: true, name: true, notificationPreferences: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!ticket) return;

    const updater = ticket.createdBy.id === updatedById
      ? ticket.createdBy
      : ticket.assignedTo?.id === updatedById
        ? ticket.assignedTo
        : ticket.createdBy;

    const recipients: { email: string }[] = [];

    if (ticket.client && ticket.client.id !== updatedById) {
      const prefs = getPrefs(ticket.client.notificationPreferences);
      if (prefs.ticketUpdates !== false) recipients.push(ticket.client);
    }

    if (ticket.assignedTo && ticket.assignedTo.id !== updatedById) {
      const prefs = getPrefs(ticket.assignedTo.notificationPreferences);
      if (prefs.ticketUpdates !== false) recipients.push(ticket.assignedTo);
    }

    const email = templates.ticketUpdatedEmail({
      ticketSubject: ticket.subject,
      ticketReference: ticket.reference,
      oldStatus,
      newStatus,
      updatedBy: updater.name,
      ticketUrl: `${APP_URL}/tickets/${ticketId}`,
    });

    await Promise.allSettled(
      recipients.map((r) => sendEmail({ to: r.email, ...email }))
    );
  } catch (error) {
    console.error("notifyTicketStatusChange failed:", error);
  }
}

export async function notifyTicketComment({
  ticketId,
  authorId,
  isInternal,
}: {
  ticketId: string;
  commentId: string;
  authorId: string;
  isInternal: boolean;
}) {
  if (isInternal) return;

  try {
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        client: { select: { id: true, email: true, name: true, notificationPreferences: true } },
        assignedTo: { select: { id: true, email: true, name: true, notificationPreferences: true } },
        comments: {
          where: { authorId },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { author: { select: { name: true } } },
        },
      },
    });
    if (!ticket || ticket.comments.length === 0) return;

    const comment = ticket.comments[0];
    const recipients: { email: string }[] = [];

    if (ticket.client && ticket.client.id !== authorId) {
      const prefs = getPrefs(ticket.client.notificationPreferences);
      if (prefs.ticketUpdates !== false) recipients.push(ticket.client);
    }

    if (ticket.assignedTo && ticket.assignedTo.id !== authorId) {
      const prefs = getPrefs(ticket.assignedTo.notificationPreferences);
      if (prefs.ticketUpdates !== false) recipients.push(ticket.assignedTo);
    }

    const email = templates.ticketCommentEmail({
      ticketSubject: ticket.subject,
      ticketReference: ticket.reference,
      commentAuthor: comment.author.name,
      commentPreview: comment.content.slice(0, 200),
      ticketUrl: `${APP_URL}/tickets/${ticketId}`,
    });

    await Promise.allSettled(
      recipients.map((r) => sendEmail({ to: r.email, ...email }))
    );
  } catch (error) {
    console.error("notifyTicketComment failed:", error);
  }
}

export async function notifyLeadAssignment({
  leadId,
  assignedToId,
  assignedById,
}: {
  leadId: string;
  assignedToId: string;
  assignedById: string;
}) {
  if (assignedToId === assignedById) return;

  try {
    const [lead, assignee, assigner] = await Promise.all([
      db.lead.findUnique({ where: { id: leadId } }),
      db.user.findUnique({
        where: { id: assignedToId },
        select: { email: true, notificationPreferences: true },
      }),
      db.user.findUnique({
        where: { id: assignedById },
        select: { name: true },
      }),
    ]);
    if (!lead || !assignee || !assigner) return;

    const prefs = getPrefs(assignee.notificationPreferences);
    if (prefs.leadAssignments === false) return;

    const email = templates.leadAssignedEmail({
      leadName: `${lead.firstName} ${lead.lastName}`,
      assignedBy: assigner.name,
      leadUrl: `${APP_URL}/leads/${leadId}`,
    });

    await sendEmail({ to: assignee.email, ...email });
  } catch (error) {
    console.error("notifyLeadAssignment failed:", error);
  }
}

export async function notifyAnnouncement({
  announcementId,
}: {
  announcementId: string;
}) {
  try {
    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
      include: { author: { select: { name: true } } },
    });
    if (!announcement) return;

    const clients = await db.user.findMany({
      where: { role: "CLIENT", isActive: true },
      select: { email: true, notificationPreferences: true },
    });

    const email = templates.announcementEmail({
      title: announcement.title,
      content: announcement.content.slice(0, 500),
      authorName: announcement.author.name,
    });

    // Send in batches of 10
    for (let i = 0; i < clients.length; i += 10) {
      const batch = clients.slice(i, i + 10);
      await Promise.allSettled(
        batch
          .filter((c) => getPrefs(c.notificationPreferences).announcements !== false)
          .map((c) => sendEmail({ to: c.email, ...email }))
      );
    }
  } catch (error) {
    console.error("notifyAnnouncement failed:", error);
  }
}
