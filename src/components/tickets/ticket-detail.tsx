"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTicket, addComment } from "@/actions/tickets";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import { TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS } from "@/lib/constants";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import { ArrowLeft, Send, Lock } from "lucide-react";

interface TicketDetailProps {
  ticket: {
    id: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    reference: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    createdBy: { id: string; name: string; email: string; role: string };
    assignedTo: { id: string; name: string } | null;
    client: { id: string; name: string; email: string } | null;
    comments: {
      id: string;
      content: string;
      isInternal: boolean;
      createdAt: string | Date;
      author: { id: string; name: string; role: string };
    }[];
  };
  staffUsers?: { id: string; name: string }[];
  isPortal?: boolean;
  currentUserRole: string;
}

export function TicketDetail({ ticket, staffUsers, isPortal, currentUserRole }: TicketDetailProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [isInternal, setIsInternal] = useState(false);

  const isStaff = currentUserRole === "ADMIN" || currentUserRole === "STAFF";

  // Filter internal comments for clients
  const visibleComments = isPortal
    ? ticket.comments.filter((c) => !c.isInternal)
    : ticket.comments;

  async function handleStatusChange(status: string) {
    setUpdating(true);
    await updateTicket(ticket.id, { status });
    setUpdating(false);
    router.refresh();
  }

  async function handlePriorityChange(priority: string) {
    setUpdating(true);
    await updateTicket(ticket.id, { priority });
    setUpdating(false);
    router.refresh();
  }

  async function handleAssignChange(assignedToId: string) {
    setUpdating(true);
    await updateTicket(ticket.id, { assignedToId: assignedToId || null });
    setUpdating(false);
    router.refresh();
  }

  async function handleComment(formData: FormData) {
    setCommentLoading(true);
    formData.set("isInternal", String(isInternal));
    await addComment(ticket.id, formData);
    setCommentLoading(false);
    setIsInternal(false);
    router.refresh();
  }

  const backUrl = isPortal ? "/portal/tickets" : "/tickets";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(backUrl)}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Ref: {ticket.reference}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Comments ({visibleComments.length})
            </h2>

            <div className="space-y-4 mb-6">
              {visibleComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`flex gap-3 ${comment.isInternal ? "bg-amber-50 -mx-2 px-2 py-2 rounded-lg border border-amber-200" : ""}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium flex-shrink-0">
                    {getInitials(comment.author.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.author.name}
                      </span>
                      {comment.isInternal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Lock className="h-3 w-3" />
                          Internal
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
              {visibleComments.length === 0 && (
                <p className="text-sm text-gray-500">No comments yet</p>
              )}
            </div>

            <form action={handleComment} className="border-t border-gray-200 pt-4">
              <textarea
                name="content"
                required
                rows={3}
                placeholder="Write a comment..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between mt-2">
                <div>
                  {isStaff && (
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Lock className="h-3.5 w-3.5" />
                      Internal note (not visible to client)
                    </label>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={commentLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {commentLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          {isStaff && (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updating}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  {TICKET_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">Priority</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  disabled={updating}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  {TICKET_PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {staffUsers && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">Assigned To</label>
                  <select
                    value={ticket.assignedTo?.id || ""}
                    onChange={(e) => handleAssignChange(e.target.value)}
                    disabled={updating}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {staffUsers.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500">Created By</p>
              <p className="text-sm text-gray-900">{ticket.createdBy.name}</p>
            </div>
            {ticket.client && (
              <div>
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm text-gray-900">{ticket.client.name}</p>
                <p className="text-xs text-gray-500">{ticket.client.email}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm text-gray-900">{formatDate(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-900">{formatRelativeTime(ticket.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
