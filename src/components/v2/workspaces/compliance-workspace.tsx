"use client";

import { useState } from "react";

type Check = { item: string; due: string; status: "On Track" | "Due Soon" | "Urgent" | "Complete" };

const seed: Check[] = [
  { item: "License Renewal", due: "2026-03-15", status: "Due Soon" },
  { item: "CE Credits", due: "2026-04-02", status: "On Track" },
  { item: "Product Certification", due: "2026-02-27", status: "Urgent" },
];

export function ComplianceWorkspace() {
  const [checks, setChecks] = useState(seed);

  function markComplete(item: string) {
    setChecks((prev) => prev.map((c) => (c.item === item ? { ...c, status: "Complete" } : c)));
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
        <p className="mt-1 text-sm text-gray-500">Operational compliance checklist with quick completion.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {checks.map((check) => (
          <div key={check.item} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{check.item}</p>
            <p className="mt-2 text-sm text-gray-700">Due: {check.due}</p>
            <p className="mt-1 text-xs text-gray-600">{check.status}</p>
            <button onClick={() => markComplete(check.item)} className="mt-3 rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Complete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
