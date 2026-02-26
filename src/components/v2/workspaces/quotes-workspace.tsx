"use client";

import { useMemo, useState } from "react";
import type { QuoteRow } from "@/lib/ui-v2-mocks";
import { DataTableCard } from "@/components/v2/data-table-card";
import { StatusPill } from "@/components/v2/status-pill";

const views = ["ALL", "NEW", "IN_PROGRESS", "PROPOSAL_SENT", "WON", "LOST"] as const;
type View = (typeof views)[number];

export function QuotesWorkspace({ initialRows }: { initialRows: QuoteRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [view, setView] = useState<View>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const viewOk = view === "ALL" || row.stage === view;
      const q = query.trim().toLowerCase();
      const qOk = q.length === 0 || row.id.toLowerCase().includes(q) || row.leadName.toLowerCase().includes(q);
      return viewOk && qOk;
    });
  }, [rows, view, query]);

  function setStage(id: string, stage: QuoteRow["stage"]) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, stage } : r)));
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
        <p className="mt-1 text-sm text-gray-500">Quote pipeline with one-click stage updates.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          {views.map((v) => (
            <button
              key={v}
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
            placeholder="Search quote"
            className="ml-auto w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-72"
          />
        </div>
      </div>

      <DataTableCard title={`Quote Pipeline (${filtered.length})`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Quote</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Best Fit</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-700">{row.id}</td>
                <td className="px-4 py-3 text-gray-800">{row.leadName}</td>
                <td className="px-4 py-3 text-gray-700">{row.bestFitPlan}</td>
                <td className="px-4 py-3"><StatusPill value={row.stage} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setStage(row.id, "WON")} className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Won</button>
                    <button onClick={() => setStage(row.id, "LOST")} className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Lost</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableCard>
    </div>
  );
}
