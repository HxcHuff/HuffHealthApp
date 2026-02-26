import Link from "next/link";
import { actionHubCategories } from "@/lib/action-hub";

export default function ActionsPage() {
  const workspaceLinks: Record<string, string> = {
    "Client Management": "/actions/client-management",
    "Policy Lifecycle": "/actions/policy-lifecycle",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Actions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Common insurance agent tasks and shortcuts
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Dedicated Workspaces</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/actions/client-management"
            className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900">Client Management Workspace</p>
            <p className="mt-1 text-xs text-gray-500">Service tickets, client intake, and day-to-day support actions</p>
          </Link>
          <Link
            href="/actions/policy-lifecycle"
            className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900">Policy Lifecycle Workspace</p>
            <p className="mt-1 text-xs text-gray-500">Renewal tracking, grace period saves, and lapse recovery workflows</p>
          </Link>
        </div>
      </div>

      {actionHubCategories.map((category) => (
        <div key={category.title} className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">{category.title}</h2>
            {workspaceLinks[category.title] && (
              <Link
                href={workspaceLinks[category.title]}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Open Workspace
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {category.actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${action.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
