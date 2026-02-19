import { Suspense } from "react";
import { getLeads, getStaffUsers } from "@/actions/leads";
import { getLeadSources } from "@/actions/settings";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadForm } from "@/components/leads/lead-form";
import { LeadFilters } from "@/components/leads/lead-filters";
import { PageHeader } from "@/components/shared/page-header";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const showNew = params.new === "true";

  if (showNew) {
    const [staffUsers, leadSources] = await Promise.all([
      getStaffUsers(),
      getLeadSources(),
    ]);
    return (
      <>
        <PageHeader title="Create New Lead" />
        <LeadForm staffUsers={staffUsers} leadSources={leadSources} />
      </>
    );
  }

  const activeFilter = params.filter || params.ageFilter || undefined;

  const [staffUsers, leadSources] = await Promise.all([
    getStaffUsers(),
    getLeadSources(),
  ]);

  let leads, total, page, totalPages;
  let queryError: string | null = null;

  try {
    const result = await getLeads({
      page: Number(params.page) || 1,
      status: params.status,
      search: params.search,
      source: params.source,
      assignedToId: params.assignedToId,
      filter: params.filter,
      ageFilter: params.ageFilter,
      createdFrom: params.createdFrom,
      createdTo: params.createdTo,
      stateFilter: params.stateFilter,
      cityFilter: params.cityFilter,
      sources: params.sources?.split(",").filter(Boolean),
      statuses: params.statuses?.split(",").filter(Boolean),
      assignedToIds: params.assignedToIds?.split(",").filter(Boolean),
      minDaysInStage: params.minDaysInStage ? Number(params.minDaysInStage) : undefined,
      maxDaysInStage: params.maxDaysInStage ? Number(params.maxDaysInStage) : undefined,
    });
    leads = result.leads;
    total = result.total;
    page = result.page;
    totalPages = result.totalPages;
  } catch (err) {
    queryError = err instanceof Error ? err.message : String(err);
    leads = [];
    total = 0;
    page = 1;
    totalPages = 0;
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${total} total leads`}
      />
      {queryError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800 mb-1">Query Error:</p>
          <pre className="text-xs text-red-700 whitespace-pre-wrap break-words bg-red-100 rounded-lg p-3">{queryError}</pre>
        </div>
      )}
      <div className="space-y-4">
        <LeadFilters staffUsers={staffUsers} leadSources={leadSources} />
        <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
          <LeadTable
            leads={JSON.parse(JSON.stringify(leads))}
            total={total}
            page={page}
            totalPages={totalPages}
            activeFilter={activeFilter}
          />
        </Suspense>
      </div>
    </>
  );
}
