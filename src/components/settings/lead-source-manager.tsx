"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLeadSource, updateLeadSource, deleteLeadSource } from "@/actions/settings";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

interface LeadSourceManagerProps {
  sources: { id: string; name: string }[];
}

export function LeadSourceManager({ sources }: LeadSourceManagerProps) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  return (
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
  );
}
