"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLead } from "@/actions/leads";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants";
import { getInitials, cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import Link from "next/link";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  company: string | null;
  source: string | null;
  status: string;
  assignedTo: { id: string; name: string } | null;
}

interface LeadPipelineProps {
  leads: Lead[];
}

export function LeadPipeline({ leads: initialLeads }: LeadPipelineProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const columns = LEAD_STATUS_OPTIONS.map((status) => ({
    ...status,
    leads: leads.filter((l) => l.status === status.value),
  }));

  function handleDragStart(leadId: string) {
    setDraggedLead(leadId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault();
    if (!draggedLead) return;

    const lead = leads.find((l) => l.id === draggedLead);
    if (!lead || lead.status === newStatus) {
      setDraggedLead(null);
      return;
    }

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === draggedLead ? { ...l, status: newStatus } : l))
    );
    setDraggedLead(null);

    startTransition(async () => {
      await updateLead(draggedLead, { status: newStatus });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Drag leads between stages to update status</p>
        </div>
        <Link
          href="/leads?new=true"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Lead
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.value}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.value)}
          >
            <div className="rounded-xl border border-gray-200 bg-gray-50 min-h-[70vh]">
              <div className="px-3 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", column.color)}>
                    {column.label}
                  </span>
                  <span className="text-xs text-gray-500">{column.leads.length}</span>
                </div>
              </div>
              <div className="p-2 space-y-2">
                {column.leads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    className={cn(
                      "rounded-lg border border-gray-200 bg-white p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow",
                      draggedLead === lead.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 block truncate"
                        >
                          {lead.firstName} {lead.lastName}
                        </Link>
                        {lead.company && (
                          <p className="text-xs text-gray-500 truncate">{lead.company}</p>
                        )}
                        {lead.source && (
                          <p className="text-xs text-gray-400 mt-1">{lead.source}</p>
                        )}
                        {lead.assignedTo && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium">
                              {getInitials(lead.assignedTo.name)}
                            </div>
                            <span className="text-xs text-gray-500">{lead.assignedTo.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {column.leads.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-400">
                    Drop leads here
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
