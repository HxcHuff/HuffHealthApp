"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

const tabs = ["Summary", "Renewal", "Servicing", "Timeline", "Documents"] as const;

export default function PolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Summary");
  const [status, setStatus] = useState("ACTIVE");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policy Detail: {id}</h1>
          <p className="mt-1 text-sm text-gray-500">Interactive lifecycle controls.</p>
        </div>
        <p className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700">Status: {status}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white" : "rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"}>{t}</button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">{tab}</h2>
        <p className="mt-3 text-sm text-gray-700">Working preview for {tab.toLowerCase()} workflow.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setStatus("ACTIVE")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Mark Active</button>
          <button onClick={() => setStatus("GRACE_PERIOD")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Set Grace</button>
          <button onClick={() => setStatus("LAPSED")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Mark Lapsed</button>
        </div>
      </div>
    </div>
  );
}
