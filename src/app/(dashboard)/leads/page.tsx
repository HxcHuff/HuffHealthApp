import { Suspense } from "react";
import { getLeads, getStaffUsers } from "@/actions/leads";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadForm } from "@/components/leads/lead-form";
import { PageHeader } from "@/components/shared/page-header";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const showNew = params.new === "true";

  if (showNew) {
    const staffUsers = await getStaffUsers();
    return (
      <>
        <PageHeader title="Create New Lead" />
        <LeadForm staffUsers={staffUsers} />
      </>
    );
  }

  const { leads, total, page, totalPages } = await getLeads({
    page: Number(params.page) || 1,
    status: params.status,
    search: params.search,
    source: params.source,
    assignedToId: params.assignedToId,
  });

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${total} total leads`}
      />
      <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
        <LeadTable
          leads={JSON.parse(JSON.stringify(leads))}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </Suspense>
    </>
  );
}
