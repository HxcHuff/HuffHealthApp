import { cn } from "@/lib/utils";
import { TICKET_STATUS_OPTIONS } from "@/lib/constants";

export function TicketStatusBadge({ status }: { status: string }) {
  const option = TICKET_STATUS_OPTIONS.find((o) => o.value === status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        option?.color || "bg-gray-100 text-gray-800"
      )}
    >
      {option?.label || status}
    </span>
  );
}
