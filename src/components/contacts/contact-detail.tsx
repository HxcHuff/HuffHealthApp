"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteContact } from "@/actions/contacts";
import { logActivity } from "@/actions/activities";
import { DripPanel } from "@/components/shared/drip-panel";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Phone,
  PhoneCall,
  MessageSquare,
  Building2,
  Briefcase,
  MapPin,
  Trash2,
  Clock,
  FileText,
  Send,
  Ticket,
} from "lucide-react";

interface ContactDetailProps {
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    company: string | null;
    jobTitle: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    notes: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    lead: { id: string; source: string | null; status: string } | null;
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
}

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  CALL: PhoneCall,
  EMAIL: Mail,
  SMS: MessageSquare,
  NOTE: FileText,
};

const ACTIVITY_COLORS: Record<string, string> = {
  CALL: "text-green-600 bg-green-50",
  EMAIL: "text-purple-600 bg-purple-50",
  SMS: "text-blue-600 bg-blue-50",
  NOTE: "text-gray-600 bg-gray-50",
};

export function ContactDetail({ contact }: ContactDetailProps) {
  const router = useRouter();
  const [activityType, setActivityType] = useState("NOTE");
  const [activityContent, setActivityContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    await deleteContact(contact.id);
    router.push("/contacts");
  }

  async function handleLogActivity() {
    if (!activityContent.trim()) return;
    setSubmitting(true);

    const typeLabels: Record<string, string> = {
      CALL: "Call",
      EMAIL: "Email",
      SMS: "Text",
      NOTE: "Note",
    };

    await logActivity({
      type: activityType as "CALL" | "EMAIL" | "SMS" | "NOTE",
      description: `${typeLabels[activityType]}: ${activityContent}`,
      contactId: contact.id,
      metadata: {
        activityType,
        content: activityContent,
      },
    });

    setActivityContent("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/contacts")}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {contact.firstName} {contact.lastName}
          </h1>
          {contact.company && (
            <p className="text-sm text-gray-500">{contact.company}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors"
          title="Delete contact"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                  {contact.email}
                </a>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{contact.phone}</span>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{contact.company}</span>
                </div>
              )}
              {contact.jobTitle && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{contact.jobTitle}</span>
                </div>
              )}
              {(contact.address || contact.city || contact.state || contact.zipCode) && (
                <div className="flex items-start gap-2 text-sm sm:col-span-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-600">
                    {[contact.address, contact.city, contact.state, contact.zipCode]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {(contact.phone || contact.email) && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                {contact.phone && (
                  <>
                    <button
                      onClick={async () => {
                        await logActivity({
                          type: "CALL",
                          description: `Called ${contact.firstName} ${contact.lastName} at ${contact.phone}`,
                          contactId: contact.id,
                          metadata: { phone: contact.phone },
                        });
                        router.refresh();
                        window.open(`tel:${contact.phone}`, "_self");
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      <PhoneCall className="h-4 w-4" />
                      Call
                    </button>
                    <button
                      onClick={async () => {
                        await logActivity({
                          type: "SMS",
                          description: `Sent text to ${contact.firstName} ${contact.lastName} at ${contact.phone}`,
                          contactId: contact.id,
                          metadata: { phone: contact.phone },
                        });
                        router.refresh();
                        window.open(`sms:${contact.phone}`, "_self");
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Text
                    </button>
                  </>
                )}
                <button
                  onClick={async () => {
                    await logActivity({
                      type: "EMAIL",
                      description: `Sent email to ${contact.firstName} ${contact.lastName} at ${contact.email}`,
                      contactId: contact.id,
                      metadata: { email: contact.email },
                    });
                    router.refresh();
                    window.open(`mailto:${contact.email}`, "_self");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <Link
                  href={`/tickets/new?contactId=${contact.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
                >
                  <Ticket className="h-4 w-4" />
                  Create Ticket
                </Link>
              </div>
            )}

            {contact.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Communication Log */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Communication Log</h2>
            {contact.activities.length > 0 ? (
              <div className="space-y-4">
                {contact.activities.map((activity) => {
                  const IconComponent = ACTIVITY_ICONS[activity.type] || Clock;
                  const colorClass = ACTIVITY_COLORS[activity.type] || "text-gray-600 bg-gray-50";
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3"
                    >
                      <div className={`mt-0.5 rounded-full p-1.5 ${colorClass}`}>
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {activity.performedBy.name} &middot;{" "}
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No interactions logged yet</p>
            )}
          </div>

          {/* Linked Tickets */}
          {contact.tickets && contact.tickets.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Tickets ({contact.tickets.length})</h2>
                <Link href={`/tickets/new?contactId=${contact.id}`} className="text-xs text-blue-600 hover:underline">
                  New Ticket
                </Link>
              </div>
              <div className="space-y-2">
                {contact.tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(ticket.createdAt)}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {ticket.status.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Log Activity Form */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Log Activity</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CALL">Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">Text/SMS</option>
                  <option value="NOTE">Note</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Details</label>
                <textarea
                  value={activityContent}
                  onChange={(e) => setActivityContent(e.target.value)}
                  rows={3}
                  placeholder="What happened..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleLogActivity}
                disabled={!activityContent.trim() || submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Saving..." : "Log Activity"}
              </button>
            </div>
          </div>

          {process.env.NEXT_PUBLIC_DRIP_ENGINE_URL && (
            <DripPanel email={contact.email} entityType="contact" entityId={contact.id} />
          )}

          {/* Info Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            {contact.lead?.source && (
              <div>
                <p className="text-xs text-gray-500">Source</p>
                <p className="text-sm text-gray-900">{contact.lead.source}</p>
              </div>
            )}
            {contact.zipCode && (
              <div>
                <p className="text-xs text-gray-500">Zip Code</p>
                <p className="text-sm text-gray-900">{contact.zipCode}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm text-gray-900">{formatDate(contact.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-900">{formatRelativeTime(contact.updatedAt)}</p>
            </div>
            {contact.lead && (
              <div>
                <p className="text-xs text-gray-500">Linked Lead</p>
                <a
                  href={`/leads/${contact.lead.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Lead →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
