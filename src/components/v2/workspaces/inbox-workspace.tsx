"use client";

import { useMemo, useState } from "react";
import type { InboxThread } from "@/lib/ui-v2-mocks";

const views = ["All", "Unassigned", "Mine", "Team", "Escalated", "VIP"] as const;

type View = (typeof views)[number];

export function InboxWorkspace({ initialThreads }: { initialThreads: InboxThread[] }) {
  const [threads, setThreads] = useState<InboxThread[]>(initialThreads);
  const [view, setView] = useState<View>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialThreads[0]?.id ?? null);
  const [statusMsg, setStatusMsg] = useState("Ready");

  const filtered = useMemo(() => {
    return threads.filter((t) => {
      const viewMatch = view === "All" || t.status === view;
      const q = query.trim().toLowerCase();
      const textMatch =
        q.length === 0 ||
        t.name.toLowerCase().includes(q) ||
        t.preview.toLowerCase().includes(q) ||
        t.owner.toLowerCase().includes(q);
      return viewMatch && textMatch;
    });
  }, [threads, view, query]);

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  function assignSelected(owner: string) {
    if (!selected) return;
    setThreads((prev) => prev.map((t) => (t.id === selected.id ? { ...t, owner, status: owner === "Unassigned" ? "Unassigned" : "Mine" } : t)));
    setStatusMsg(`Assigned thread to ${owner}`);
  }

  function setDisposition(tag: string) {
    if (!selected) return;
    setThreads((prev) => prev.map((t) => (t.id === selected.id ? { ...t, preview: `${t.preview} [${tag}]` } : t)));
    setStatusMsg(`Applied disposition: ${tag}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="mt-1 text-sm text-gray-500">Unified queue for SMS, calls, email replies, and escalations.</p>
        </div>
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">{statusMsg}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={
                view === v
                  ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              }
            >
              {v}
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search thread..."
            className="ml-auto w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-72"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Threads ({filtered.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={
                  t.id === selectedId
                    ? "w-full bg-blue-50 px-4 py-3 text-left"
                    : "w-full px-4 py-3 text-left hover:bg-gray-50"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  <span className="text-xs font-medium text-amber-700">SLA {t.sla}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">{t.preview}</p>
                <p className="mt-1 text-xs text-gray-500">{t.channel} | {t.owner} | {t.status}</p>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-4 py-8 text-sm text-gray-500">No matching threads.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Thread Actions</h2>
          {selected ? (
            <>
              <p className="mt-3 text-sm font-medium text-gray-900">{selected.name}</p>
              <p className="mt-1 text-xs text-gray-600">{selected.preview}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => assignSelected("Me")} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700">Assign Me</button>
                <button onClick={() => assignSelected("Unassigned")} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Unassign</button>
                <button onClick={() => setDisposition("Resolved")} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Resolve</button>
                <button onClick={() => setDisposition("Escalated")} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Escalate</button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Select a thread to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}
