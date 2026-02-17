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

  const { leads, total, page, totalPages } = await getLeads({
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

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${total} total leads`}
      />
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
