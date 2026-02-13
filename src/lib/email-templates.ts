const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
      ${content}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
      HuffHealth CRM &mdash; <a href="${APP_URL}" style="color:#9ca3af;">Open App</a>
    </p>
  </div>
</body>
</html>`;
}

export function ticketUpdatedEmail({
  ticketSubject,
  ticketReference,
  oldStatus,
  newStatus,
  updatedBy,
  ticketUrl,
}: {
  ticketSubject: string;
  ticketReference: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  ticketUrl: string;
}) {
  return {
    subject: `Ticket Updated: ${ticketSubject} [${ticketReference}]`,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">Ticket Status Updated</h2>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;">
        <strong>${updatedBy}</strong> changed the status of ticket <strong>${ticketReference}</strong>:
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <span style="color:#ef4444;text-decoration:line-through;">${oldStatus}</span>
        &nbsp;&rarr;&nbsp;
        <span style="color:#22c55e;font-weight:600;">${newStatus}</span>
      </div>
      <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">${ticketSubject}</p>
      <a href="${ticketUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;font-size:14px;">
        View Ticket
      </a>
    `),
  };
}

export function ticketCommentEmail({
  ticketSubject,
  ticketReference,
  commentAuthor,
  commentPreview,
  ticketUrl,
}: {
  ticketSubject: string;
  ticketReference: string;
  commentAuthor: string;
  commentPreview: string;
  ticketUrl: string;
}) {
  return {
    subject: `New Comment on: ${ticketSubject} [${ticketReference}]`,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">New Comment</h2>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;">
        <strong>${commentAuthor}</strong> commented on ticket <strong>${ticketReference}</strong>:
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:12px 16px;margin:16px 0;color:#374151;font-size:14px;">
        ${commentPreview}
      </div>
      <a href="${ticketUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;font-size:14px;">
        View Ticket
      </a>
    `),
  };
}

export function leadAssignedEmail({
  leadName,
  assignedBy,
  leadUrl,
}: {
  leadName: string;
  assignedBy: string;
  leadUrl: string;
}) {
  return {
    subject: `Lead Assigned: ${leadName}`,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">Lead Assigned to You</h2>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;">
        <strong>${assignedBy}</strong> assigned the lead <strong>${leadName}</strong> to you.
      </p>
      <a href="${leadUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;font-size:14px;">
        View Lead
      </a>
    `),
  };
}

export function announcementEmail({
  title,
  content,
  authorName,
}: {
  title: string;
  content: string;
  authorName: string;
}) {
  return {
    subject: `Announcement: ${title}`,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">${title}</h2>
      <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Posted by ${authorName}</p>
      <div style="margin:16px 0;color:#374151;font-size:14px;line-height:1.6;">
        ${content}
      </div>
      <a href="${APP_URL}/portal/announcements" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;font-size:14px;">
        View Announcements
      </a>
    `),
  };
}
