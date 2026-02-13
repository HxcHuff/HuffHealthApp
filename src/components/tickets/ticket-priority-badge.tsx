import { cn } from "@/lib/utils";
import { TICKET_PRIORITY_OPTIONS } from "@/lib/constants";

export function TicketPriorityBadge({ priority }: { priority: string }) {
  const option = TICKET_PRIORITY_OPTIONS.find((o) => o.value === priority);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        option?.color || "bg-gray-100 text-gray-800"
      )}
    >
      {option?.label || priority}
    </span>
  );
}
