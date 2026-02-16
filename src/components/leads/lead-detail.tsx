"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateLead, deleteLead } from "@/actions/leads";
import { logActivity } from "@/actions/activities";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { DripPanel } from "@/components/shared/drip-panel";
import {
  ArrowLeft,
  Mail,
  Phone,
  PhoneCall,
  MessageSquare,
  Building2,
  Briefcase,
  Trash2,
  Clock,
  X,
  MapPin,
  Calendar,
  DollarSign,
  Hash,
  FileText,
  AlertCircle,
  UserPlus,
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
    disputeStatus: string | null;
    externalLeadId: string | null;
    orderId: string | null;
    received: string | null;
    fund: string | null;
    dateOfBirth: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    price: string | null;
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
    tickets: {
      id: string;
      subject: string;
      status: string;
      priority: string;
      createdAt: string | Date;
    }[];
  };
  staffUsers: { id: string; name: string }[];
}

export function LeadDetail({ lead, staffUsers }: LeadDetailProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [callNotes, setCallNotes] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [textMessage, setTextMessage] = useState("");
  const smsLinkRef = useRef<HTMLAnchorElement>(null);

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

  async function handleCall() {
    await logActivity({
      type: "CALL",
      description: `Called ${lead.firstName} ${lead.lastName} at ${lead.phone}`,
      leadId: lead.id,
      metadata: { phone: lead.phone },
    });
    router.refresh();
    setShowCallModal(true);
  }

  async function handleSaveCallNotes() {
    if (callNotes.trim() || callDuration.trim()) {
      await logActivity({
        type: "NOTE",
        description: `Call notes for ${lead.firstName} ${lead.lastName}${callDuration ? ` (${callDuration} min)` : ""}: ${callNotes || "No notes"}`,
        leadId: lead.id,
        metadata: {
          phone: lead.phone,
          duration: callDuration || null,
          notes: callNotes || null,
        },
      });
    }
    setCallNotes("");
    setCallDuration("");
    setShowCallModal(false);
    router.refresh();
  }

  async function handleSendText() {
    if (!textMessage.trim()) return;
    await logActivity({
      type: "CALL",
      description: `Sent text to ${lead.firstName} ${lead.lastName} at ${lead.phone}: "${textMessage}"`,
      leadId: lead.id,
      metadata: {
        phone: lead.phone,
        message: textMessage,
        type: "sms",
      },
    });
    router.refresh();
    // Open native SMS app with pre-filled message
    if (smsLinkRef.current) {
      smsLinkRef.current.href = `sms:${lead.phone}?&body=${encodeURIComponent(textMessage)}`;
      smsLinkRef.current.click();
    }
    setTextMessage("");
    setShowTextModal(false);
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
                  <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
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

            {(lead.phone || lead.email) && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                {lead.phone && (
                  <>
                    <a
                      href={`tel:${lead.phone}`}
                      onClick={handleCall}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      <PhoneCall className="h-4 w-4" />
                      Call
                    </a>
                    <button
                      onClick={() => setShowTextModal(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Text
                    </button>
                    <a ref={smsLinkRef} className="hidden" />
                  </>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
                <Link
                  href={`/contacts?new=true&leadId=${lead.id}&firstName=${encodeURIComponent(lead.firstName)}&lastName=${encodeURIComponent(lead.lastName)}&email=${encodeURIComponent(lead.email || "")}&phone=${encodeURIComponent(lead.phone || "")}&zipCode=${encodeURIComponent(lead.zipCode || "")}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Create Contact
                </Link>
              </div>
            )}

            {(lead.address || lead.city || lead.state || lead.zipCode) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-600">
                    {[lead.address, lead.city, lead.state, lead.zipCode].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
            )}

            {(lead.dateOfBirth || lead.fund || lead.price || lead.orderId || lead.externalLeadId || lead.disputeStatus) && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lead.dateOfBirth && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">DOB: {lead.dateOfBirth}</span>
                  </div>
                )}
                {lead.fund && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{lead.fund}</span>
                  </div>
                )}
                {lead.price && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">${lead.price}</span>
                  </div>
                )}
                {lead.orderId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Order: {lead.orderId}</span>
                  </div>
                )}
                {lead.externalLeadId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Lead ID: {lead.externalLeadId}</span>
                  </div>
                )}
                {lead.disputeStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-600">Dispute: {lead.disputeStatus}</span>
                  </div>
                )}
              </div>
            )}

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

          {/* Linked Tickets */}
          {lead.tickets && lead.tickets.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Tickets ({lead.tickets.length})</h2>
                <Link href={`/tickets/new?leadId=${lead.id}`} className="text-xs text-blue-600 hover:underline">
                  New Ticket
                </Link>
              </div>
              <div className="space-y-2">
                {lead.tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(ticket.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
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

          {lead.email && process.env.NEXT_PUBLIC_DRIP_ENGINE_URL && (
            <DripPanel email={lead.email} entityType="lead" entityId={lead.id} />
          )}

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

      {/* Call Notes Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Log Call Notes</h3>
              <button
                onClick={() => { setShowCallModal(false); setCallNotes(""); setCallDuration(""); }}
                className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Call to {lead.firstName} {lead.lastName} at {lead.phone}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="text"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={4}
                  placeholder="What was discussed..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setShowCallModal(false); setCallNotes(""); setCallDuration(""); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSaveCallNotes}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Text Modal */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Text</h3>
              <button
                onClick={() => { setShowTextModal(false); setTextMessage(""); }}
                className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              To: {lead.firstName} {lead.lastName} ({lead.phone})
            </p>
            <textarea
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              rows={4}
              placeholder="Type your message..."
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setShowTextModal(false); setTextMessage(""); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendText}
                disabled={!textMessage.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Send & Open SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
