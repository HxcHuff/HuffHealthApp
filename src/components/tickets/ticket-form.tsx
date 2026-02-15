"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/actions/tickets";
import { TICKET_PRIORITY_OPTIONS } from "@/lib/constants";

interface TicketFormProps {
  staffUsers?: { id: string; name: string }[];
  leads?: { id: string; firstName: string; lastName: string }[];
  contacts?: { id: string; firstName: string; lastName: string }[];
  defaultLeadId?: string;
  defaultContactId?: string;
  isPortal?: boolean;
}

export function TicketForm({
  staffUsers,
  leads,
  contacts,
  defaultLeadId,
  defaultContactId,
  isPortal,
}: TicketFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setErrors({});
    const result = await createTicket(formData);
    if (result?.error && typeof result.error === "object") {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
    } else if (result?.id) {
      if (isPortal) {
        router.push(`/portal/tickets/${result.id}`);
      } else {
        router.push(`/tickets/${result.id}`);
      }
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
        <input
          name="subject"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Brief description of the issue"
        />
        {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          name="description"
          required
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Provide detailed information about the issue..."
        />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description[0]}</p>}
      </div>

      {!isPortal && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                defaultValue="MEDIUM"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {TICKET_PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            {staffUsers && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  name="assignedToId"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {leads && leads.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Lead</label>
                <select
                  name="leadId"
                  defaultValue={defaultLeadId || ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.firstName} {lead.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {contacts && contacts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Contact</label>
                <select
                  name="contactId"
                  defaultValue={defaultContactId || ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                name="dueDate"
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating..." : isPortal ? "Submit Ticket" : "Create Ticket"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
