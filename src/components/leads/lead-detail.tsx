"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLead, deleteLead } from "@/actions/leads";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Trash2,
  Clock,
} from "lucide-react";

interface LeadDetailProps {
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    jobTitle: string | null;
    source: string | null;
    status: string;
    notes: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    assignedTo: { id: string; name: string } | null;
    createdBy: { id: string; name: string };
    activities: {
      id: string;
      type: string;
      description: string;
      createdAt: string | Date;
      performedBy: { name: string };
    }[];
  };
  staffUsers: { id: string; name: string }[];
}

export function LeadDetail({ lead, staffUsers }: LeadDetailProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleStatusChange(status: string) {
    setUpdating(true);
    await updateLead(lead.id, { status });
    setUpdating(false);
    router.refresh();
  }

  async function handleAssignChange(assignedToId: string) {
    setUpdating(true);
    await updateLead(lead.id, { assignedToId: assignedToId || null });
    setUpdating(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    await deleteLead(lead.id);
    router.push("/leads");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/leads")}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {lead.firstName} {lead.lastName}
          </h1>
          {lead.company && (
            <p className="text-sm text-gray-500">{lead.company}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors"
          title="Delete lead"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Lead Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{lead.phone}</span>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{lead.company}</span>
                </div>
              )}
              {lead.jobTitle && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{lead.jobTitle}</span>
                </div>
              )}
            </div>
            {lead.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Activity Log</h2>
            {lead.activities.length > 0 ? (
              <div className="space-y-3">
                {lead.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="mt-0.5">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {activity.performedBy.name} &middot;{" "}
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No activity yet</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Status
            </label>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              {LEAD_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Assigned To
            </label>
            <select
              value={lead.assignedTo?.id || ""}
              onChange={(e) => handleAssignChange(e.target.value)}
              disabled={updating}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Unassigned</option>
              {staffUsers.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500">Source</p>
              <p className="text-sm text-gray-900">{lead.source || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm text-gray-900">{formatDate(lead.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created By</p>
              <p className="text-sm text-gray-900">{lead.createdBy.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-900">{formatRelativeTime(lead.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
