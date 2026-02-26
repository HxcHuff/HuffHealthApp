"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2, FileText } from "lucide-react";

interface SavedScript {
  id: string;
  name: string;
  content: string;
  updatedAt: string;
}

const STORAGE_KEY = "client_management_script_sandbox_v1";

const templates = [
  {
    id: "renewal-review",
    name: "Renewal Review",
    content:
      "Hi {{client_name}}, this is {{agent_name}} with {{agency_name}}.\n\nI am reviewing your renewal options and want to confirm any updates to your medications, providers, or budget before we finalize your plan.\n\nWould {{time_option_1}} or {{time_option_2}} work for a 15-minute review?",
  },
  {
    id: "billing-followup",
    name: "Billing Follow-Up",
    content:
      "Hi {{client_name}}, I wanted to follow up on your billing question.\n\nI reviewed your account and here is the current status:\n- Balance: {{balance}}\n- Due date: {{due_date}}\n- Next step: {{next_step}}\n\nIf you would like, I can stay with you while we complete this.",
  },
  {
    id: "ticket-resolution",
    name: "Ticket Resolution",
    content:
      "Hello {{client_name}}, this is an update on ticket {{ticket_id}}.\n\nIssue summary: {{issue_summary}}\nResolution provided: {{resolution}}\nWhat to expect next: {{next_expectation}}\n\nIf anything changes, reply here and we will reopen immediately.",
  },
];

function readSavedScripts(): SavedScript[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedScript[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ClientScriptSandbox() {
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>(() => readSavedScripts());
  const [selectedId, setSelectedId] = useState<string | null>(() => readSavedScripts()[0]?.id || null);
  const [draftName, setDraftName] = useState(() => readSavedScripts()[0]?.name || "New Script");
  const [draftContent, setDraftContent] = useState(() => readSavedScripts()[0]?.content || "");
  const [status, setStatus] = useState<string>("");

  const selectedScript = useMemo(
    () => savedScripts.find((script) => script.id === selectedId) || null,
    [savedScripts, selectedId]
  );

  function persist(next: SavedScript[]) {
    setSavedScripts(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function saveCurrent() {
    const trimmedName = draftName.trim() || "Untitled Script";
    const now = new Date().toISOString();

    if (selectedScript) {
      const updated = savedScripts.map((script) =>
        script.id === selectedScript.id
          ? { ...script, name: trimmedName, content: draftContent, updatedAt: now }
          : script
      );
      persist(updated);
      setStatus("Script updated");
      return;
    }

    const created: SavedScript = {
      id: `script-${Date.now()}`,
      name: trimmedName,
      content: draftContent,
      updatedAt: now,
    };
    const next = [created, ...savedScripts];
    persist(next);
    setSelectedId(created.id);
    setStatus("Script saved");
  }

  function createNew() {
    setSelectedId(null);
    setDraftName("New Script");
    setDraftContent("");
    setStatus("");
  }

  function openScript(script: SavedScript) {
    setSelectedId(script.id);
    setDraftName(script.name);
    setDraftContent(script.content);
    setStatus("");
  }

  function removeScript(id: string) {
    const next = savedScripts.filter((script) => script.id !== id);
    persist(next);
    if (selectedId === id) {
      const fallback = next[0];
      setSelectedId(fallback?.id || null);
      setDraftName(fallback?.name || "New Script");
      setDraftContent(fallback?.content || "");
    }
    setStatus("Script deleted");
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedId(null);
    setDraftName(template.name);
    setDraftContent(template.content);
    setStatus("Template loaded");
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Client Script Sandbox</h2>
          <p className="mt-1 text-xs text-gray-500">
            Build and save reusable client-management scripts in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={createNew}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
            New Script
          </button>
          <button
            type="button"
            onClick={saveCurrent}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Saved Scripts</p>
          <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2">
            {savedScripts.map((script) => (
              <button
                key={script.id}
                type="button"
                onClick={() => openScript(script)}
                className={`w-full rounded-lg border px-3 py-2 text-left ${
                  selectedId === script.id ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{script.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {new Date(script.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeScript(script.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") removeScript(script.id);
                    }}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ))}
            {savedScripts.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-gray-500">No saved scripts yet.</p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Templates</p>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Script name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="Write your client script here..."
            rows={18}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {status && <p className="text-xs font-medium text-emerald-700">{status}</p>}
        </div>
      </div>
    </section>
  );
}
