"use client";

import { useState, useEffect } from "react";
import { Zap, RefreshCw, ChevronDown, AlertCircle } from "lucide-react";
import { getDripStatus, getAvailableSequences, syncToDrip, enrollInDripSequence } from "@/actions/drip";
import type { DripContact, DripSequence } from "@/lib/drip-engine";

interface DripPanelProps {
  email: string;
  entityType: "lead" | "contact";
  entityId: string;
}

export function DripPanel({ email, entityType, entityId }: DripPanelProps) {
  const [dripContact, setDripContact] = useState<DripContact | null>(null);
  const [sequences, setSequences] = useState<DripSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  async function fetchStatus() {
    setLoading(true);
    setError(null);
    try {
      const [contact, seqs] = await Promise.all([
        getDripStatus(email),
        getAvailableSequences(),
      ]);
      setDripContact(contact);
      setSequences(seqs);
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    const result = await syncToDrip(entityType, entityId);
    if (result.success) {
      // Wait a moment for the drip engine to process
      await new Promise((r) => setTimeout(r, 1000));
      await fetchStatus();
    } else {
      setError(result.error || "Sync failed");
    }
    setSyncing(false);
  }

  async function handleEnroll() {
    if (!selectedSequence) return;
    setEnrolling(true);
    setError(null);
    const result = await enrollInDripSequence(email, selectedSequence);
    if (result.success) {
      await new Promise((r) => setTimeout(r, 1000));
      await fetchStatus();
      setSelectedSequence("");
    } else {
      setError(result.error || "Enrollment failed");
    }
    setEnrolling(false);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-semibold text-gray-900">Drip Engine</span>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Drip Engine</span>
        </div>
        <p className="text-xs text-gray-500">Drip Engine unavailable</p>
      </div>
    );
  }

  const isSynced = !!dripContact;
  const channels = dripContact?.opted_in_channels || [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-semibold text-gray-900">Drip Engine</span>
        </div>
        <button
          onClick={fetchStatus}
          className="text-gray-400 hover:text-gray-600"
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Sync Status */}
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isSynced ? "bg-green-500" : "bg-gray-300"}`} />
        <span className="text-xs text-gray-600">
          {isSynced ? "Synced to Drip Engine" : "Not synced"}
        </span>
      </div>

      {!isSynced && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100 disabled:opacity-50 transition-colors"
        >
          {syncing ? "Syncing..." : "Sync to Drip Engine"}
        </button>
      )}

      {isSynced && (
        <>
          {/* Opted-in Channels */}
          {channels.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Channels</p>
              <div className="flex flex-wrap gap-1">
                {channels.map((ch) => (
                  <span
                    key={ch}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {dripContact.tags && dripContact.tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Tags</p>
              <div className="flex flex-wrap gap-1">
                {dripContact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Re-sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {syncing ? "Syncing..." : "Re-sync"}
          </button>

          {/* Enroll in Sequence */}
          {sequences.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Enroll in Sequence</p>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <select
                    value={selectedSequence}
                    onChange={(e) => setSelectedSequence(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 pr-7 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {sequences.map((seq) => (
                      <option key={seq.id} value={seq.id}>
                        {seq.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={handleEnroll}
                  disabled={!selectedSequence || enrolling}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {enrolling ? "..." : "Enroll"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
