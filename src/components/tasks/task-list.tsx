"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeTask, deleteTask } from "@/actions/tasks";
import { TICKET_PRIORITY_OPTIONS } from "@/lib/constants";
import { formatRelativeTime, cn } from "@/lib/utils";
import Link from "next/link";
import { Check, Trash2, Target, Ticket, Calendar, AlertCircle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  isCompleted: boolean;
  priority: string;
  assignedTo: { id: string; name: string; image: string | null };
  createdBy: { id: string; name: string };
  lead: { id: string; firstName: string; lastName: string } | null;
  ticket: { id: string; subject: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  createdAt: string | Date;
}

interface TaskListProps {
  tasks: Task[];
  total: number;
  page: number;
  totalPages: number;
  showAssignee?: boolean;
}

function isOverdue(dueDate: string | Date | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function getPriorityBadge(priority: string) {
  const opt = TICKET_PRIORITY_OPTIONS.find((p) => p.value === priority);
  return opt || { label: priority, color: "bg-gray-100 text-gray-800" };
}

export function TaskList({ tasks, total, page, totalPages, showAssignee = true }: TaskListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [completing, setCompleting] = useState<string | null>(null);

  function handleComplete(id: string) {
    setCompleting(id);
    startTransition(async () => {
      await completeTask(id);
      setCompleting(null);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    startTransition(async () => {
      await deleteTask(id);
      router.refresh();
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-sm text-gray-500">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="divide-y divide-gray-100">
          {tasks.map((task) => {
            const overdue = !task.isCompleted && isOverdue(task.dueDate);
            const badge = getPriorityBadge(task.priority);
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                  task.isCompleted && "opacity-60"
                )}
              >
                <button
                  onClick={() => handleComplete(task.id)}
                  disabled={completing === task.id}
                  className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                    task.isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 hover:border-blue-500"
                  )}
                >
                  {task.isCompleted && <Check className="h-3 w-3" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      task.isCompleted ? "text-gray-500 line-through" : "text-gray-900"
                    )}>
                      {task.title}
                    </span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", badge.color)}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {task.dueDate && (
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs",
                        overdue ? "text-red-600 font-medium" : "text-gray-500"
                      )}>
                        {overdue && <AlertCircle className="h-3 w-3" />}
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.lead && (
                      <Link
                        href={`/leads/${task.lead.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Target className="h-3 w-3" />
                        {task.lead.firstName} {task.lead.lastName}
                      </Link>
                    )}
                    {task.ticket && (
                      <Link
                        href={`/tickets/${task.ticket.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Ticket className="h-3 w-3" />
                        {task.ticket.subject}
                      </Link>
                    )}
                    {showAssignee && (
                      <span className="text-xs text-gray-400">{task.assignedTo.name}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  className="flex-shrink-0 rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/tasks?page=${page - 1}`}
                className={cn(
                  "rounded-lg px-3 py-1 text-sm",
                  page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-200"
                )}
              >
                Previous
              </Link>
              <Link
                href={`/tasks?page=${page + 1}`}
                className={cn(
                  "rounded-lg px-3 py-1 text-sm",
                  page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-200"
                )}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
