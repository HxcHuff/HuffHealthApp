import { TicketForm } from "@/components/tickets/ticket-form";
import { PageHeader } from "@/components/shared/page-header";

export default function PortalNewTicketPage() {
  return (
    <>
      <PageHeader title="Submit a Ticket" description="Describe your issue and we'll get back to you." />
      <TicketForm isPortal />
    </>
  );
}
