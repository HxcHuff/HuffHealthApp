"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateApiKey, revokeApiKey } from "@/actions/api-keys";
import { formatRelativeTime } from "@/lib/utils";
import { Key, Plus, Copy, Check, AlertTriangle } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
  isRevoked: boolean;
  revokedAt: string | Date | null;
}

interface ApiKeyManagerProps {
  keys: ApiKey[];
}

export function ApiKeyManager({ keys }: ApiKeyManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = await generateApiKey(name);
    if (result.error) {
      setError(result.error);
      return;
    }

    setNewKey(result.key!);
    setName("");
    setShowForm(false);
    startTransition(() => router.refresh());
  }

  async function handleRevoke(id: string) {
    await revokeApiKey(id);
    setRevokeConfirm(null);
    startTransition(() => router.refresh());
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {newKey && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Copy your API key now. It won&apos;t be shown again.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-white border border-amber-200 px-3 py-2 text-sm font-mono text-gray-900 break-all">
                  {newKey}
                </code>
                <button
                  onClick={copyKey}
                  className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <button
                onClick={() => setNewKey(null)}
                className="mt-2 text-xs text-amber-700 hover:text-amber-900 font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {keys.length} API key{keys.length !== 1 ? "s" : ""}
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Generate New Key
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleGenerate} className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production API, Mobile App..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!name.trim() || isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Generate
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Key</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Created</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Last Used</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-b border-gray-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{key.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs text-gray-500 font-mono">{key.prefix}...</code>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                  {formatRelativeTime(key.createdAt)}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                  {key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : "Never"}
                </td>
                <td className="px-4 py-3">
                  {key.isRevoked ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Revoked
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!key.isRevoked && (
                    <>
                      {revokeConfirm === key.id ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="text-xs text-gray-500">Sure?</span>
                          <button
                            onClick={() => handleRevoke(key.id)}
                            disabled={isPending}
                            className="text-xs font-medium text-red-600 hover:text-red-800"
                          >
                            Yes, revoke
                          </button>
                          <button
                            onClick={() => setRevokeConfirm(null)}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRevokeConfirm(key.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          Revoke
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  No API keys yet. Generate one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
