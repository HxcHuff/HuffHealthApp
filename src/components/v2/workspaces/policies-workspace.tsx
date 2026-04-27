"use client";

import { useMemo, useState } from "react";
import type { PolicyRow } from "@/lib/ui-v2-mocks";
import { DataTableCard } from "@/components/v2/data-table-card";
import { StatusPill } from "@/components/v2/status-pill";

const views = ["ALL", "ACTIVE", "PENDING", "GRACE_PERIOD", "LAPSED"] as const;
type View = (typeof views)[number];

export function PoliciesWorkspace({ initialRows }: { initialRows: PolicyRow[] }) {
  const [rows, setRows] = useState<PolicyRow[]>(initialRows);
  const [view, setView] = useState<View>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const viewOk = view === "ALL" || row.status === view;
      const q = query.trim().toLowerCase();
      const qOk =
        q.length === 0 ||
        row.id.toLowerCase().includes(q) ||
        row.clientName.toLowerCase().includes(q) ||
        row.carrier.toLowerCase().includes(q);
      return viewOk && qOk;
    });
  }, [rows, view, query]);

  function markActive(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "ACTIVE" } : r)));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policies</h1>
          <p className="mt-1 text-sm text-gray-500">Policy lifecycle board with fast status operations.</p>
        </div>
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
              {v.replace("_", " ")}
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search policy/client/carrier"
            className="ml-auto w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-80"
          />
        </div>
      </div>

      <DataTableCard title={`Policy Queue (${filtered.length})`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Policy</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Carrier</th>
              <th className="px-4 py-3">Renewal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-700">{row.id}</td>
                <td className="px-4 py-3 text-gray-800">{row.clientName}</td>
                <td className="px-4 py-3 text-gray-700">{row.carrier}</td>
                <td className="px-4 py-3 text-gray-700">{row.renewalDate}</td>
                <td className="px-4 py-3"><StatusPill value={row.status} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => markActive(row.id)} className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Mark Active</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableCard>
    </div>
  );
}
