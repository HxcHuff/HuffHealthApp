"use client";

import { useMemo, useState } from "react";
import { KpiStrip } from "@/components/v2/kpi-strip";
import { dashboardKpis } from "@/lib/ui-v2-mocks";

export function AnalyticsWorkspace() {
  const [window, setWindow] = useState<"7d" | "30d" | "90d">("30d");

  const adjustedKpis = useMemo(() => {
    const multiplier = window === "7d" ? 0.4 : window === "90d" ? 2.3 : 1;
    return dashboardKpis.map((kpi) => {
      const base = Number(kpi.value.replace(/[^0-9.]/g, "")) || 0;
      const scaled = Math.max(1, Math.round(base * multiplier));
      const value = kpi.value.includes("%") ? `${Math.min(99, scaled)}%` : String(scaled);
      return { ...kpi, value };
    });
  }, [window]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Interactive preview for executive and operational metrics.</p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={
                window === w
                  ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              }
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <KpiStrip items={adjustedKpis} />

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Funnel Snapshot ({window})</h2>
        <div className="mt-4 space-y-3">
          {[
            ["New Lead", 100],
            ["Qualified", 68],
            ["Quoted", 41],
            ["Application", 31],
            ["Enrolled", 24],
          ].map(([label, pct]) => (
            <div key={String(label)}>
              <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                <span>{label}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
