import { getStaffUsers } from "@/actions/leads";
import { TicketForm } from "@/components/tickets/ticket-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function NewTicketPage() {
  const staffUsers = await getStaffUsers();

  return (
    <>
      <PageHeader title="Create Ticket" />
      <TicketForm staffUsers={staffUsers} />
    </>
  );
}
