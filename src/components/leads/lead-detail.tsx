"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  CheckSquare,
  Shield,
  RefreshCw,
  CalendarCheck,
  HeartPulse,
  ChevronUp,
  Minus,
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
    insuranceType: string | null;
    planType: string | null;
    policyStatus: string | null;
    policyRenewalDate: string | Date | null;
    lastReviewDate: string | Date | null;
    followUpDate: string | Date | null;
    lifeEvent: string | null;
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

function toDateInputValue(val: string | Date | null): string {
  if (!val) return "";
  const d = typeof val === "string" ? val : val.toISOString();
  return d.slice(0, 10);
}

export function LeadDetail({ lead, staffUsers }: LeadDetailProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [callNotes, setCallNotes] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [textMessage, setTextMessage] = useState("");
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callElapsed, setCallElapsed] = useState("0:00");
  const [callExpanded, setCallExpanded] = useState(true);
  const smsLinkRef = useRef<HTMLAnchorElement>(null);

  // Live call timer
  useEffect(() => {
    if (!showCallModal || !callStartTime) return;
    const id = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setCallElapsed(`${m}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(id);
  }, [showCallModal, callStartTime]);

  const getElapsedMinutes = useCallback(() => {
    if (!callStartTime) return "";
    return Math.ceil((Date.now() - callStartTime.getTime()) / 60000).toString();
  }, [callStartTime]);

  // Local state for editable insurance/policy fields
  const [fieldValues, setFieldValues] = useState({
    dateOfBirth: lead.dateOfBirth || "",
    insuranceType: lead.insuranceType || "",
    planType: lead.planType || "",
    policyStatus: lead.policyStatus || "",
    policyRenewalDate: toDateInputValue(lead.policyRenewalDate),
    lastReviewDate: toDateInputValue(lead.lastReviewDate),
    followUpDate: toDateInputValue(lead.followUpDate),
    lifeEvent: lead.lifeEvent || "",
  });

  function handleFieldChange(field: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFieldUpdate(field: string, value: string) {
    setUpdating(true);
    const dateFields = ["policyRenewalDate", "lastReviewDate", "followUpDate"];
    const submitValue = dateFields.includes(field) && value
      ? new Date(value + "T00:00:00").toISOString()
      : value || null;
    await updateLead(lead.id, { [field]: submitValue });
    setUpdating(false);
    router.refresh();
  }

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
    window.open(`tel:${lead.phone}`, "_self");
    setCallStartTime(new Date());
    setCallElapsed("0:00");
    setCallExpanded(true);
    setShowCallModal(true);
  }

  async function handleSaveCallNotes() {
    const duration = callDuration.trim() || getElapsedMinutes();
    if (callNotes.trim() || duration) {
      await logActivity({
        type: "NOTE",
        description: `Call notes for ${lead.firstName} ${lead.lastName}${duration ? ` (${duration} min)` : ""}: ${callNotes || "No notes"}`,
        leadId: lead.id,
        metadata: {
          phone: lead.phone,
          duration: duration || null,
          notes: callNotes || null,
        },
      });
    }
    setCallNotes("");
    setCallDuration("");
    setCallStartTime(null);
    setShowCallModal(false);
    router.refresh();
  }

  async function handleSendText() {
    if (!textMessage.trim()) return;
    await logActivity({
      type: "SMS",
      description: `Sent text to ${lead.firstName} ${lead.lastName} at ${lead.phone}: "${textMessage}"`,
      leadId: lead.id,
      metadata: {
        phone: lead.phone,
        message: textMessage,
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
                    <button
                      onClick={handleCall}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      <PhoneCall className="h-4 w-4" />
                      Call
                    </button>
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
                <Link
                  href={`/tasks?new=true&leadId=${lead.id}&leadName=${encodeURIComponent(lead.firstName + " " + lead.lastName)}&title=${encodeURIComponent("Follow up with " + lead.firstName + " " + lead.lastName)}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  <CheckSquare className="h-4 w-4" />
                  Add Follow-up
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

            {(lead.insuranceType || lead.planType || lead.policyStatus || lead.policyRenewalDate || lead.lastReviewDate || lead.followUpDate || lead.lifeEvent) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Insurance & Policy</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lead.insuranceType && (
                    <div className="flex items-center gap-2 text-sm">
                      <HeartPulse className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Type: {lead.insuranceType.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  {lead.planType && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Plan: {lead.planType}</span>
                    </div>
                  )}
                  {lead.policyStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Policy: {lead.policyStatus.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  {lead.policyRenewalDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <RefreshCw className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Renewal: {formatDate(lead.policyRenewalDate)}</span>
                    </div>
                  )}
                  {lead.lastReviewDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarCheck className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Last Review: {formatDate(lead.lastReviewDate)}</span>
                    </div>
                  )}
                  {lead.followUpDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Follow-Up: {formatDate(lead.followUpDate)}</span>
                    </div>
                  )}
                  {lead.lifeEvent && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Life Event: {lead.lifeEvent}</span>
                    </div>
                  )}
                </div>
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

          {/* Insurance & Policy */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Insurance & Policy
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={fieldValues.dateOfBirth}
                  onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value !== (lead.dateOfBirth || "")) {
                      handleFieldUpdate("dateOfBirth", e.target.value);
                    }
                  }}
                  disabled={updating}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Insurance Type</label>
                <select
                  value={fieldValues.insuranceType}
                  onChange={(e) => {
                    handleFieldChange("insuranceType", e.target.value);
                    handleFieldUpdate("insuranceType", e.target.value);
                  }}
                  disabled={updating}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">— None —</option>
                  <option value="ACA">ACA</option>
                  <option value="MEDICARE_SUPPLEMENT">Medicare Supplement</option>
                  <option value="MEDICARE_ADVANTAGE">Medicare Advantage</option>
                  <option value="PART_D">Part D</option>
                  <option value="GROUP">Group</option>
                  <option value="SHORT_TERM">Short-Term</option>
                  <option value="DENTAL_VISION">Dental/Vision</option>
                  <option value="LIFE">Life</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Plan Type</label>
                <input
                  type="text"
                  value={fieldValues.planType}
                  onChange={(e) => handleFieldChange("planType", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value !== (lead.planType || "")) {
                      handleFieldUpdate("planType", e.target.value);
                    }
                  }}
                  disabled={updating}
                  placeholder="e.g. Plan G"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Policy Status</label>
                <select
                  value={fieldValues.policyStatus}
                  onChange={(e) => {
                    handleFieldChange("policyStatus", e.target.value);
                    handleFieldUpdate("policyStatus", e.target.value);
                  }}
                  disabled={updating}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">— None —</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="GRACE_PERIOD">Grace Period</option>
                  <option value="LAPSED">Lapsed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Policy Renewal Date</label>
                <input
                  type="date"
                  value={fieldValues.policyRenewalDate}
                  onChange={(e) => handleFieldChange("policyRenewalDate", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value !== toDateInputValue(lead.policyRenewalDate)) {
                      handleFieldUpdate("policyRenewalDate", e.target.value);
                    }
                  }}
                  disabled={updating}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Last Review Date</label>
                <input
                  type="date"
                  value={fieldValues.lastReviewDate}
                  onChange={(e) => handleFieldChange("lastReviewDate", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value !== toDateInputValue(lead.lastReviewDate)) {
                      handleFieldUpdate("lastReviewDate", e.target.value);
                    }
                  }}
                  disabled={updating}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Follow-Up Date</label>
                <input
                  type="date"
                  value={fieldValues.followUpDate}
                  onChange={(e) => handleFieldChange("followUpDate", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value !== toDateInputValue(lead.followUpDate)) {
                      handleFieldUpdate("followUpDate", e.target.value);
                    }
                  }}
                  disabled={updating}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Life Event</label>
                <input
                  type="text"
                  value={fieldValues.lifeEvent}
                  onChange={(e) => handleFieldChange("lifeEvent", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value !== (lead.lifeEvent || "")) {
                      handleFieldUpdate("lifeEvent", e.target.value);
                    }
                  }}
                  disabled={updating}
                  placeholder="e.g. Job loss, Marriage"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            </div>
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

      {/* Floating Call Bubble */}
      {showCallModal && (
        <div className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl rounded-xl border border-gray-200 bg-white overflow-hidden">
          {callExpanded ? (
            <>
              {/* Expanded header */}
              <div className="flex items-center justify-between bg-green-600 px-4 py-2.5 text-white">
                <div className="flex items-center gap-2 text-sm font-medium min-w-0">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="truncate">On Call with {lead.firstName} {lead.lastName}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setCallExpanded(false)}
                    className="rounded p-1 hover:bg-green-700 transition-colors"
                    title="Minimize"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setShowCallModal(false); setCallNotes(""); setCallDuration(""); setCallStartTime(null); }}
                    className="rounded p-1 hover:bg-green-700 transition-colors"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Expanded body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono font-medium">{callElapsed}</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="text"
                    value={callDuration}
                    onChange={(e) => setCallDuration(e.target.value)}
                    placeholder={`Auto: ~${getElapsedMinutes() || "0"} min`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={3}
                    placeholder="What was discussed..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => { setShowCallModal(false); setCallNotes(""); setCallDuration(""); setCallStartTime(null); }}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    End Call
                  </button>
                  <button
                    onClick={handleSaveCallNotes}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Collapsed pill */
            <button
              onClick={() => setCallExpanded(true)}
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <Phone className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium text-gray-700 truncate">On call — {callElapsed}</span>
              <ChevronUp className="h-4 w-4 text-gray-400 ml-auto shrink-0" />
            </button>
          )}
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
