"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

interface LeadFiltersProps {
  staffUsers: { id: string; name: string }[];
  leadSources: { id: string; name: string }[];
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export function LeadFilters({ staffUsers, leadSources }: LeadFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const hasAdvancedFilters = [
    "createdFrom", "createdTo", "stateFilter", "cityFilter",
    "sources", "statuses", "assignedToIds", "minDaysInStage", "maxDaysInStage",
  ].some((key) => searchParams.has(key));

  function applyFilters(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    // Preserve search if exists
    const search = searchParams.get("search");
    if (search) params.set("search", search);

    const createdFrom = form.get("createdFrom") as string;
    const createdTo = form.get("createdTo") as string;
    const stateFilter = form.get("stateFilter") as string;
    const cityFilter = form.get("cityFilter") as string;
    const minDays = form.get("minDaysInStage") as string;
    const maxDays = form.get("maxDaysInStage") as string;

    if (createdFrom) params.set("createdFrom", createdFrom);
    if (createdTo) params.set("createdTo", createdTo);
    if (stateFilter) params.set("stateFilter", stateFilter);
    if (cityFilter) params.set("cityFilter", cityFilter);
    if (minDays) params.set("minDaysInStage", minDays);
    if (maxDays) params.set("maxDaysInStage", maxDays);

    // Multi-select: statuses
    const selectedStatuses = form.getAll("statuses") as string[];
    if (selectedStatuses.length) params.set("statuses", selectedStatuses.join(","));

    // Multi-select: sources
    const selectedSources = form.getAll("sources") as string[];
    if (selectedSources.length) params.set("sources", selectedSources.join(","));

    // Multi-select: assignees
    const selectedAssignees = form.getAll("assignedToIds") as string[];
    if (selectedAssignees.length) params.set("assignedToIds", selectedAssignees.join(","));

    router.push(`/leads?${params.toString()}`);
  }

  function clearFilters() {
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) params.set("search", search);
    router.push(`/leads?${params.toString()}`);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
          {hasAdvancedFilters && (
            <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">Active</span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <form onSubmit={applyFilters} className="border-t border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Created From</label>
              <input
                name="createdFrom"
                type="date"
                defaultValue={searchParams.get("createdFrom") || ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Created To</label>
              <input
                name="createdTo"
                type="date"
                defaultValue={searchParams.get("createdTo") || ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
              <select
                name="stateFilter"
                defaultValue={searchParams.get("stateFilter") || ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All States</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
              <input
                name="cityFilter"
                type="text"
                defaultValue={searchParams.get("cityFilter") || ""}
                placeholder="Filter by city..."
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Multi-status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statuses</label>
              <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {LEAD_STATUS_OPTIONS.map((s) => (
                  <label key={s.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="statuses"
                      value={s.value}
                      defaultChecked={searchParams.get("statuses")?.split(",").includes(s.value)}
                      className="rounded border-gray-300"
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Multi-source */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sources</label>
              <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {leadSources.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="sources"
                      value={s.name}
                      defaultChecked={searchParams.get("sources")?.split(",").includes(s.name)}
                      className="rounded border-gray-300"
                    />
                    {s.name}
                  </label>
                ))}
                {leadSources.length === 0 && (
                  <p className="text-xs text-gray-400">No sources defined</p>
                )}
              </div>
            </div>

            {/* Multi-assignee */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Assigned To</label>
              <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {staffUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="assignedToIds"
                      value={u.id}
                      defaultChecked={searchParams.get("assignedToIds")?.split(",").includes(u.id)}
                      className="rounded border-gray-300"
                    />
                    {u.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Days in Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min Days in Stage</label>
              <input
                name="minDaysInStage"
                type="number"
                min="0"
                defaultValue={searchParams.get("minDaysInStage") || ""}
                placeholder="e.g. 3"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Max Days in Stage</label>
              <input
                name="maxDaysInStage"
                type="number"
                min="0"
                defaultValue={searchParams.get("maxDaysInStage") || ""}
                placeholder="e.g. 30"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            {hasAdvancedFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
