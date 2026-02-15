"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLead } from "@/actions/leads";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GripVertical, Phone, MapPin, Clock } from "lucide-react";
import Link from "next/link";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  zipCode: string | null;
  source: string | null;
  status: string;
  stageEnteredAt: string | Date;
}

interface LeadPipelineProps {
  leads: Lead[];
}

function getDaysInStage(stageEnteredAt: string | Date): number {
  const entered = new Date(stageEnteredAt);
  const now = new Date();
  return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function getDaysColor(days: number): string {
  if (days <= 2) return "text-green-600";
  if (days <= 7) return "text-yellow-600";
  return "text-red-600";
}

export function LeadPipeline({ leads: initialLeads }: LeadPipelineProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const columns = LEAD_STATUS_OPTIONS.map((status) => ({
    ...status,
    leads: leads.filter((l) => l.status === status.value),
  }));

  function handleDragStart(leadId: string) {
    setDraggedLead(leadId);
  }

  function handleDragOver(e: React.DragEvent, columnValue: string) {
    e.preventDefault();
    setDragOverColumn(columnValue);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  function handleDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedLead) return;

    const lead = leads.find((l) => l.id === draggedLead);
    if (!lead || lead.status === newStatus) {
      setDraggedLead(null);
      return;
    }

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === draggedLead
          ? { ...l, status: newStatus, stageEnteredAt: new Date().toISOString() }
          : l
      )
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
          <p className="text-sm text-gray-500 mt-1">
            Drag leads between stages to update status &middot; {leads.length} total leads
          </p>
        </div>
        <Link
          href="/leads?new=true"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Lead
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((column) => {
          const isDropTarget = dragOverColumn === column.value && draggedLead;
          return (
            <div
              key={column.value}
              className="flex-shrink-0 w-64"
              onDragOver={(e) => handleDragOver(e, column.value)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.value)}
            >
              <div
                className={cn(
                  "rounded-xl border border-gray-200 bg-gray-50 min-h-[75vh] transition-colors",
                  isDropTarget && "border-blue-400 bg-blue-50/50"
                )}
              >
                <div className="px-3 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        column.color
                      )}
                    >
                      {column.label}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {column.leads.length}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-2">
                  {column.leads.map((lead) => {
                    const days = getDaysInStage(lead.stageEnteredAt);
                    return (
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
                            {lead.phone && (
                              <div className="flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="text-xs text-gray-500 hover:text-blue-600"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {lead.phone}
                                </a>
                              </div>
                            )}
                            {lead.zipCode && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{lead.zipCode}</span>
                              </div>
                            )}
                            {lead.source && (
                              <p className="text-xs text-gray-400 mt-1 truncate">{lead.source}</p>
                            )}
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className={cn("text-xs font-medium", getDaysColor(days))}>
                                {getDaysLabel(days)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {column.leads.length === 0 && (
                    <div className={cn(
                      "py-8 text-center text-xs text-gray-400 rounded-lg border-2 border-dashed border-gray-200",
                      isDropTarget && "border-blue-300 text-blue-400"
                    )}>
                      Drop leads here
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
