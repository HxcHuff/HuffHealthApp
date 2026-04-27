"use client";

import { useMemo, useState } from "react";

type Policy = { id: string; type: string; renewal: string; status: string };

export function PortalPoliciesWorkspace({ initialPolicies }: { initialPolicies: Policy[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialPolicies;
    return initialPolicies.filter((p) => p.id.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }, [initialPolicies, query]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Policies</h1>
        <p className="mt-1 text-sm text-gray-500">Search and review your policy coverage.</p>
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search policy" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      <div className="rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Policy</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Renewal</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-blue-700">{p.id}</td>
                <td className="px-4 py-3">{p.type}</td>
                <td className="px-4 py-3">{p.renewal}</td>
                <td className="px-4 py-3">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
