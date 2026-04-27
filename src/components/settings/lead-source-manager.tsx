"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createLeadSource, updateLeadSource, deleteLeadSource } from "@/actions/settings";
import { Pencil, Trash2, Plus, Check, X, GripVertical, Save } from "lucide-react";

interface LeadSourceManagerProps {
  sources: { id: string; name: string }[];
}

interface PriorityRule {
  id: string;
  sourceId: string;
  label: string;
  score: number;
}

const SCORE_STORAGE_KEY = "lead_source_priority_rules_v1";

export function LeadSourceManager({ sources }: LeadSourceManagerProps) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [priorityRules, setPriorityRules] = useState<PriorityRule[]>(() => {
    const fallback = sources.map((source, index) => ({
      id: source.id,
      sourceId: source.id,
      label: source.name,
      score: Math.max(100 - index * 10, 10),
    }));

    if (typeof window === "undefined") return fallback;

    try {
      const raw = window.localStorage.getItem(SCORE_STORAGE_KEY);
      if (!raw) return fallback;

      const parsed = JSON.parse(raw) as PriorityRule[];
      const safe = parsed.filter((rule) => sources.some((source) => source.id === rule.sourceId));
      const missing = sources
        .filter((source) => !safe.some((rule) => rule.sourceId === source.id))
        .map((source, index) => ({
          id: source.id,
          sourceId: source.id,
          label: source.name,
          score: Math.max(100 - (safe.length + index) * 10, 10),
        }));
      return [...safe, ...missing];
    } catch {
      return fallback;
    }
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(() => setSaveMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const routingSummary = useMemo(() => {
    const high = priorityRules.filter((rule) => rule.score >= 70).length;
    const medium = priorityRules.filter((rule) => rule.score >= 40 && rule.score < 70).length;
    const low = priorityRules.filter((rule) => rule.score < 40).length;
    return { high, medium, low };
  }, [priorityRules]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    const result = await createLeadSource(newName);
    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to add");
    } else {
      setNewName("");
    }
    setAdding(false);
    router.refresh();
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    setError(null);
    const result = await updateLeadSource(id, editName);
    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to update");
    } else {
      setEditingId(null);
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this lead source?")) return;
    await deleteLeadSource(id);
    router.refresh();
  }

  function handleScoreChange(ruleId: string, nextScore: number) {
    const safeScore = Math.max(0, Math.min(100, Number.isNaN(nextScore) ? 0 : nextScore));
    setPriorityRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, score: safeScore } : rule)));
  }

  function handleLabelChange(ruleId: string, nextLabel: string) {
    setPriorityRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, label: nextLabel } : rule)));
  }

  function moveRule(dragId: string, dropId: string) {
    if (dragId === dropId) return;
    setPriorityRules((prev) => {
      const dragIndex = prev.findIndex((rule) => rule.id === dragId);
      const dropIndex = prev.findIndex((rule) => rule.id === dropId);
      if (dragIndex < 0 || dropIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
  }

  function handleSavePriorityModel() {
    window.localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(priorityRules));
    setSaveMessage("Priority model saved");
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="max-w-md space-y-4">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New source name..."
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {sources.map((source) => (
            <div key={source.id} className="flex items-center justify-between px-4 py-3">
              {editingId === source.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate(source.id)}
                    autoFocus
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleUpdate(source.id)}
                    className="rounded p-1 text-green-600 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-gray-900">{source.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(source.id);
                        setEditName(source.name);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(source.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {sources.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">No sources configured</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Agent Priority Scoring</h2>
            <p className="mt-1 text-sm text-gray-500">
              Drag blocks to rank source importance, then set scores to control assignment priority.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSavePriorityModel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            Save Priority Model
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">High Priority (70+)</p>
            <p className="mt-1 text-sm text-emerald-900">{routingSummary.high} sources route to top agent queue first.</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Medium Priority (40-69)</p>
            <p className="mt-1 text-sm text-amber-900">{routingSummary.medium} sources route to normal queue.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Low Priority (0-39)</p>
            <p className="mt-1 text-sm text-slate-900">{routingSummary.low} sources route to backlog queue.</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {priorityRules.map((rule, index) => (
            <div
              key={rule.id}
              draggable
              onDragStart={() => setDraggingId(rule.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggingId) moveRule(draggingId, rule.id);
                setDraggingId(null);
              }}
              onDragEnd={() => setDraggingId(null)}
              className="grid grid-cols-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 sm:grid-cols-[auto_1fr_auto_auto]"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <GripVertical className="h-4 w-4 text-gray-400" />
                {index + 1}
              </div>
              <input
                value={rule.label}
                onChange={(e) => handleLabelChange(rule.id, e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Score</label>
              <input
                type="number"
                min={0}
                max={100}
                value={rule.score}
                onChange={(e) => handleScoreChange(rule.id, Number(e.target.value))}
                className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            Block text is now functional: rename each block to match how agents should see it (for example: &quot;Facebook Lead Ad - High Intent&quot;),
            and set a score to control routing priority.
          </p>
        </div>

        {saveMessage && <p className="mt-3 text-sm font-medium text-emerald-700">{saveMessage}</p>}
      </div>
    </div>
  );
}
