"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [state, setState] = useState<"Active" | "Paused">("Active");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Detail: {id}</h1>
          <p className="mt-1 text-sm text-gray-500">Interactive sequence control preview.</p>
        </div>
        <p className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700">Status: {state}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Sequence Steps</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">Day 0: Intro SMS</div>
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">Day 2: Call Attempt</div>
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">Day 5: Quote Email</div>
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">Day 8: Follow-up SMS</div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setState("Paused")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Pause</button>
          <button onClick={() => setState("Active")} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Activate</button>
        </div>
      </div>
    </div>
  );
}
