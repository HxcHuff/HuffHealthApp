import { getStaffUsers } from "@/actions/leads";
import { db } from "@/lib/db";
import { TicketForm } from "@/components/tickets/ticket-form";
import { PageHeader } from "@/components/shared/page-header";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function NewTicketPage({ searchParams }: Props) {
  const params = await searchParams;

  const [staffUsers, leads, contacts] = await Promise.all([
    getStaffUsers(),
    db.lead.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.contact.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <>
      <PageHeader title="Create Ticket" />
      <TicketForm
        staffUsers={staffUsers}
        leads={leads}
        contacts={contacts}
        defaultLeadId={params.leadId}
        defaultContactId={params.contactId}
      />
    </>
  );
}
