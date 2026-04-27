"use client";

import { useState } from "react";

type Campaign = {
  id: string;
  name: string;
  audience: number;
  response: string;
  status: "Active" | "Paused" | "Draft";
};

const seed: Campaign[] = [
  { id: "C-12", name: "Renewal Rescue Q2", audience: 182, response: "31%", status: "Active" },
  { id: "C-13", name: "New Lead Nurture", audience: 426, response: "24%", status: "Active" },
  { id: "C-14", name: "Lapse Win-Back", audience: 73, response: "17%", status: "Draft" },
];

export function CampaignsWorkspace() {
  const [campaigns, setCampaigns] = useState(seed);

  function toggleStatus(id: string) {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.status === "Active") return { ...c, status: "Paused" };
        if (c.status === "Paused") return { ...c, status: "Active" };
        return { ...c, status: "Active" };
      })
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p className="mt-1 text-sm text-gray-500">Campaign cards with quick pause/resume control.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium text-gray-500">{campaign.id}</p>
            <h2 className="mt-1 text-sm font-semibold text-gray-900">{campaign.name}</h2>
            <p className="mt-3 text-xs text-gray-600">Audience: {campaign.audience}</p>
            <p className="mt-1 text-xs text-gray-600">Response: {campaign.response}</p>
            <p className="mt-1 text-xs text-gray-600">Status: {campaign.status}</p>
            <button onClick={() => toggleStatus(campaign.id)} className="mt-4 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              {campaign.status === "Active" ? "Pause" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
