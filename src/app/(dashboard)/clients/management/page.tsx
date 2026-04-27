import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { actionHubCategories } from "@/lib/action-hub";

const MANAGEMENT_SECTIONS = ["Client Management", "Compliance"];

export default function ClientManagementPage() {
  const sections = actionHubCategories.filter((category) =>
    MANAGEMENT_SECTIONS.includes(category.title)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Management"
        description="Service workflows and compliance shortcuts for active client support"
      />

      {sections.map((category) => (
        <div key={category.title} className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{category.title}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {category.actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={`${category.title}-${action.href}-${action.label}`}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{action.label}</p>
                    <p className="text-xs text-gray-500 truncate">{action.description}</p>
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
