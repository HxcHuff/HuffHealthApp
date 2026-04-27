import { InboxThread } from "@/lib/ui-v2-mocks";

const channelLabel: Record<InboxThread["channel"], string> = {
  SMS: "SMS",
  CALL: "Call",
  EMAIL: "Email",
  INTERNAL: "Internal",
};

export function InboxThreadList({ threads }: { threads: InboxThread[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Active Threads</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {threads.map((thread) => (
          <div key={thread.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                  {channelLabel[thread.channel]}
                </span>
                <p className="text-sm font-medium text-gray-900">{thread.name}</p>
              </div>
              <span className="text-xs font-medium text-amber-700">SLA {thread.sla}</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">{thread.preview}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Owner: {thread.owner}</span>
              <span>{thread.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
