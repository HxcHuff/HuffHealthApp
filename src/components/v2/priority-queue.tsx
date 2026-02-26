import { QueueItem } from "@/lib/ui-v2-mocks";

const priorityClasses: Record<QueueItem["priority"], string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

export function PriorityQueue({ items }: { items: QueueItem[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">Priority Queue</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-gray-100 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${priorityClasses[item.priority]}`}>
                {item.priority}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>
            <p className="mt-2 text-xs font-medium text-gray-700">{item.dueText}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
