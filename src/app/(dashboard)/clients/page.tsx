import { Suspense } from "react";
import { getLeads, getStaffUsers } from "@/actions/leads";
import { getLeadSources } from "@/actions/settings";
import { ClientTable } from "@/components/clients/client-table";
import { ClientFilters } from "@/components/clients/client-filters";
import { PageHeader } from "@/components/shared/page-header";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ClientsPage({ searchParams }: Props) {
  const params = await searchParams;

  const [staffUsers, leadSources] = await Promise.all([
    getStaffUsers(),
    getLeadSources(),
  ]);

  const { leads, total, page, totalPages } = await getLeads({
    page: Number(params.page) || 1,
    status: "ENROLLED",
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
    assignedToIds: params.assignedToIds?.split(",").filter(Boolean),
    minDaysInStage: params.minDaysInStage ? Number(params.minDaysInStage) : undefined,
    maxDaysInStage: params.maxDaysInStage ? Number(params.maxDaysInStage) : undefined,
  });

  const activeFilter = params.filter || params.ageFilter || undefined;

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${total} total clients`}
      />
      <div className="space-y-4">
        <ClientFilters staffUsers={staffUsers} leadSources={leadSources} />
        <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
          <ClientTable
            clients={JSON.parse(JSON.stringify(leads))}
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
