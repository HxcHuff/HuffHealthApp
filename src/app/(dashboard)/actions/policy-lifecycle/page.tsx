import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { getActionCategoryByTitle } from "@/lib/action-hub";

export default function PolicyLifecycleWorkspacePage() {
  const category = getActionCategoryByTitle("Policy Lifecycle");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy Lifecycle Workspace"
        description="Manage renewals, grace period, lapse recovery, and annual policy reviews"
        actions={(
          <Link
            href="/actions"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Actions
          </Link>
        )}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Policy Lifecycle</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {category?.actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${action.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{action.label}</p>
                  <p className="truncate text-xs text-gray-500">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
