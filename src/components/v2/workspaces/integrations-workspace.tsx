"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignApiKeyToLeadSource } from "@/actions/api-keys";

type Integration = {
  name: string;
  category: string;
  connected: boolean;
};

const seed: Integration[] = [
  { name: "Twilio Voice/SMS", category: "Telephony", connected: false },
  { name: "Facebook Lead Ads", category: "Lead Source", connected: true },
  { name: "Drip Engine", category: "Automation", connected: true },
  { name: "Quote Provider Adapter", category: "Quoting", connected: false },
  { name: "Policy Admin Connector", category: "Policy Ops", connected: false },
];

export function IntegrationsWorkspace({
  leadSourceMappings,
  apiKeyOptions,
}: {
  leadSourceMappings: {
    id: string;
    name: string;
    apiKeyId: string | null;
    apiKey: { id: string; name: string; prefix: string; isRevoked: boolean } | null;
  }[];
  apiKeyOptions: { id: string; name: string; prefix: string }[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(seed);
  const [savingSourceId, setSavingSourceId] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Record<string, string>>(
    Object.fromEntries(leadSourceMappings.map((s) => [s.id, s.apiKeyId || ""]))
  );

  function toggle(name: string) {
    setItems((prev) => prev.map((it) => (it.name === name ? { ...it, connected: !it.connected } : it)));
  }

  async function handleAssign(sourceId: string) {
    setSavingSourceId(sourceId);
    await assignApiKeyToLeadSource(sourceId, selectedKeys[sourceId] || null);
    setSavingSourceId(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">Connect and disconnect providers in preview mode.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.name} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.category}</p>
            <h2 className="mt-1 text-sm font-semibold text-gray-900">{item.name}</h2>
            <p className="mt-3 text-xs text-gray-600">Status: {item.connected ? "Connected" : "Disconnected"}</p>
            <button onClick={() => toggle(item.name)} className="mt-4 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              {item.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Lead Source API Routing</h2>
        <p className="mt-1 text-xs text-gray-500">
          Each lead source should be assigned a dedicated API key for inbound routing.
        </p>

        <div className="mt-4 space-y-3">
          {leadSourceMappings.map((source) => (
            <div
              key={source.id}
              className="rounded-lg border border-gray-100 p-3 sm:flex sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{source.name}</p>
                <p className="text-xs text-gray-500">
                  {source.apiKey
                    ? `Assigned: ${source.apiKey.name} (${source.apiKey.prefix}...)`
                    : "No key assigned"}
                </p>
              </div>
              <div className="mt-3 flex gap-2 sm:mt-0 sm:min-w-[320px]">
                <select
                  value={selectedKeys[source.id] || ""}
                  onChange={(e) =>
                    setSelectedKeys((prev) => ({ ...prev, [source.id]: e.target.value }))
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {apiKeyOptions.map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.name} ({key.prefix}...)
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssign(source.id)}
                  disabled={savingSourceId === source.id}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingSourceId === source.id ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ))}
          {leadSourceMappings.length === 0 && (
            <p className="text-sm text-gray-500">No active lead sources found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
