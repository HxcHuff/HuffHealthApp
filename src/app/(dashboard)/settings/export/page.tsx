import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Download } from "lucide-react";

export default async function ExportSettingsPage() {
  const session = await auth();
  const canManageData = session?.user.role === "ADMIN" || session?.user.role === "STAFF";

  if (!session || !canManageData) {
    redirect("/dashboard");
  }

  return (
    <>
      <PageHeader
        title="Export Data"
        description="Download CRM data for backup, audits, or migration"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <a
          href="/api/export/records?type=leads"
          className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Download className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Export Leads CSV</p>
              <p className="text-xs text-gray-500">All non-enrolled lead records</p>
            </div>
          </div>
        </a>

        <a
          href="/api/export/records?type=clients"
          className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Export Clients CSV</p>
              <p className="text-xs text-gray-500">All enrolled client records</p>
            </div>
          </div>
        </a>
      </div>
    </>
  );
}
