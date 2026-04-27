"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

const tabs = ["Compare", "Recommendation", "Timeline", "Documents"] as const;

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Compare");
  const [result, setResult] = useState("Pending");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Detail: {id}</h1>
          <p className="mt-1 text-sm text-gray-500">Interactive plan selection and decision controls.</p>
        </div>
        <p className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700">Decision: {result}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white" : "rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"}>{t}</button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">{tab}</h2>
        <p className="mt-3 text-sm text-gray-700">Working quote detail surface for {tab.toLowerCase()}.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setResult("Won")} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Mark Won</button>
          <button onClick={() => setResult("Lost")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Mark Lost</button>
        </div>
      </div>
    </div>
  );
}
