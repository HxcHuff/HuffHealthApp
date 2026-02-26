"use client";

import { useState } from "react";

type Rule = {
  id: string;
  name: string;
  trigger: string;
  status: "ACTIVE" | "DRAFT";
};

const seed: Rule[] = [
  { id: "A-31", name: "Renewal 60-day reminder", trigger: "Policy renewal in 60 days", status: "ACTIVE" },
  { id: "A-32", name: "Missed call instant SMS", trigger: "Inbound call missed", status: "ACTIVE" },
  { id: "A-33", name: "Grace period rescue", trigger: "Policy enters grace period", status: "DRAFT" },
];

export function AutomationsWorkspace() {
  const [rules, setRules] = useState<Rule[]>(seed);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");

  function addRule() {
    if (!name.trim() || !trigger.trim()) return;
    setRules((prev) => [{ id: `A-${40 + prev.length}`, name: name.trim(), trigger: trigger.trim(), status: "DRAFT" }, ...prev]);
    setName("");
    setTrigger("");
  }

  function toggle(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, status: r.status === "ACTIVE" ? "DRAFT" : "ACTIVE" } : r)));
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
        <p className="mt-1 text-sm text-gray-500">Create and toggle workflow rules instantly.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rule name" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <input value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="Trigger" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <button onClick={addRule} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Add Rule</button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Trigger</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-blue-700">{rule.id}</td>
                <td className="px-4 py-3 text-gray-800">{rule.name}</td>
                <td className="px-4 py-3 text-gray-700">{rule.trigger}</td>
                <td className="px-4 py-3 text-gray-700">{rule.status}</td>
                <td className="px-4 py-3"><button onClick={() => toggle(rule.id)} className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Toggle</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
