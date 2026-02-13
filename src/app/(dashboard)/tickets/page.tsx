import { Suspense } from "react";
import { getTickets } from "@/actions/tickets";
import { TicketTable } from "@/components/tickets/ticket-table";
import { PageHeader } from "@/components/shared/page-header";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TicketsPage({ searchParams }: Props) {
  const params = await searchParams;

  const { tickets, total, page, totalPages } = await getTickets({
    page: Number(params.page) || 1,
    status: params.status,
    priority: params.priority,
    search: params.search,
  });

  return (
    <>
      <PageHeader title="Tickets" description={`${total} total tickets`} />
      <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
        <TicketTable
          tickets={JSON.parse(JSON.stringify(tickets))}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </Suspense>
    </>
  );
}
