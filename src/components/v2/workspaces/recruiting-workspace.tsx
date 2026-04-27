"use client";

import { useMemo, useState } from "react";

type Stage = "Prospecting" | "Interview" | "Onboarding" | "Licensed" | "Active Producer";

interface Candidate {
  id: string;
  name: string;
  stage: Stage;
}

const stages: Stage[] = ["Prospecting", "Interview", "Onboarding", "Licensed", "Active Producer"];
const seed: Candidate[] = [
  { id: "R-1", name: "Carla West", stage: "Prospecting" },
  { id: "R-2", name: "Derek Hale", stage: "Interview" },
  { id: "R-3", name: "Nora Singh", stage: "Onboarding" },
  { id: "R-4", name: "Julian Knox", stage: "Licensed" },
];

export function RecruitingWorkspace() {
  const [candidates, setCandidates] = useState(seed);

  const grouped = useMemo(() => {
    return stages.map((stage) => ({ stage, items: candidates.filter((c) => c.stage === stage) }));
  }, [candidates]);

  function advance(id: string) {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const idx = stages.indexOf(c.stage);
        const next = stages[Math.min(idx + 1, stages.length - 1)];
        return { ...c, stage: next };
      })
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruiting</h1>
        <p className="mt-1 text-sm text-gray-500">Advance candidates through the producer funnel.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {grouped.map((bucket) => (
          <div key={bucket.stage} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{bucket.stage}</p>
            <p className="mt-1 text-xs text-gray-500">{bucket.items.length} candidates</p>
            <div className="mt-3 space-y-2">
              {bucket.items.map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-100 p-2">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <button onClick={() => advance(c.id)} className="mt-2 rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Advance</button>
                </div>
              ))}
              {bucket.items.length === 0 && <p className="text-xs text-gray-400">No candidates</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
