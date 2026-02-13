"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS } from "@/lib/constants";
import { ChevronLeft, ChevronRight, Search, Plus, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  reference: string;
  createdAt: string | Date;
  createdBy: { name: string };
  assignedTo: { name: string } | null;
  client: { name: string } | null;
  _count: { comments: number };
}

interface TicketTableProps {
  tickets: Ticket[];
  total: number;
  page: number;
  totalPages: number;
  basePath?: string;
}

export function TicketTable({ tickets, total, page, totalPages, basePath = "/tickets" }: TicketTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            defaultValue={searchParams.get("search") || ""}
            onChange={(e) => {
              const timeout = setTimeout(() => updateParams("search", e.target.value), 300);
              return () => clearTimeout(timeout);
            }}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={searchParams.get("status") || ""}
          onChange={(e) => updateParams("status", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {TICKET_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={searchParams.get("priority") || ""}
          onChange={(e) => updateParams("priority", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Priorities</option>
          {TICKET_PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <Link
          href={`${basePath}/new`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Assigned</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => router.push(`${basePath}/${ticket.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{ticket.subject}</span>
                      {ticket._count.comments > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
                          <MessageSquare className="h-3 w-3" />
                          {ticket._count.comments}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{ticket.reference}</span>
                  </td>
                  <td className="px-4 py-3">
                    <TicketStatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <TicketPriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {ticket.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                          {getInitials(ticket.assignedTo.name)}
                        </div>
                        <span className="text-gray-600 text-xs">{ticket.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">
                    {ticket.client?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {formatRelativeTime(ticket.createdAt)}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => updateParams("page", String(page - 1))}
                disabled={page <= 1}
                className="rounded-lg p-1.5 hover:bg-gray-200 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => updateParams("page", String(page + 1))}
                disabled={page >= totalPages}
                className="rounded-lg p-1.5 hover:bg-gray-200 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
