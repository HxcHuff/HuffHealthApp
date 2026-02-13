import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTicket } from "@/actions/tickets";
import { TicketDetail } from "@/components/tickets/ticket-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PortalTicketDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) notFound();

  const ticket = await getTicket(id);
  if (!ticket) notFound();

  // Ensure client owns this ticket
  if (ticket.clientId !== session.user.id) notFound();

  return (
    <TicketDetail
      ticket={JSON.parse(JSON.stringify(ticket))}
      isPortal
      currentUserRole={session.user.role}
    />
  );
}
