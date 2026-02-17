"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LeadStatusBadge } from "./lead-status-badge";
import { syncToDrip } from "@/actions/drip";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { LEAD_STATUS_OPTIONS, FILTER_LABELS } from "@/lib/constants";
import { ChevronLeft, ChevronRight, Search, Plus, X, Zap } from "lucide-react";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  zipCode: string | null;
  source: string | null;
  status: string;
  createdAt: string | Date;
  dripSyncedAt: string | Date | null;
  assignedTo: { id: string; name: string } | null;
}

interface LeadTableProps {
  leads: Lead[];
  total: number;
  page: number;
  totalPages: number;
  activeFilter?: string;
}

export function LeadTable({ leads, total, page, totalPages, activeFilter }: LeadTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [, startTransition] = useTransition();

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    router.push(`/leads?${params.toString()}`);
  }

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((l) => l.id)));
    }
  }

  async function handleBulkSync() {
    setSyncing(true);
    const ids = Array.from(selected);
    await Promise.allSettled(ids.map((id) => syncToDrip("lead", id)));
    setSelected(new Set());
    setSyncing(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      {activeFilter && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <span className="font-medium">Filter:</span>
            <span>{FILTER_LABELS[activeFilter] || activeFilter}</span>
            <span className="text-blue-500">({total} results)</span>
          </div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <X className="h-3.5 w-3.5" />
            Clear filter
          </Link>
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2.5">
          <span className="text-sm font-medium text-indigo-800">
            {selected.size} selected
          </span>
          <button
            onClick={handleBulkSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            {syncing ? "Syncing..." : "Sync to Drip"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
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
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {LEAD_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <Link
          href="/leads?new=true"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && selected.size === leads.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Zip Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Assigned</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => {}}
                      onClick={(e) => toggleSelect(lead.id, e)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-gray-900">
                      {lead.firstName} {lead.lastName}
                      {lead.dripSyncedAt && (
                        <span title="Synced to Drip Engine">
                          <Zap className="h-3.5 w-3.5 text-yellow-500" />
                        </span>
                      )}
                    </div>
                    {lead.phone && (
                      <div className="text-xs text-gray-500 md:hidden">{lead.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {lead.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                    {lead.company || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                    {lead.zipCode || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {lead.source || "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {lead.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                          {getInitials(lead.assignedTo.name)}
                        </div>
                        <span className="text-gray-600 text-xs">{lead.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {formatRelativeTime(lead.createdAt)}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    No leads found
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
                className="rounded-lg p-1.5 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => updateParams("page", String(page + 1))}
                disabled={page >= totalPages}
                className="rounded-lg p-1.5 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
