import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTicket } from "@/actions/tickets";
import { getStaffUsers } from "@/actions/leads";
import { TicketDetail } from "@/components/tickets/ticket-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) notFound();

  const [ticket, staffUsers] = await Promise.all([getTicket(id), getStaffUsers()]);
  if (!ticket) notFound();

  return (
    <TicketDetail
      ticket={JSON.parse(JSON.stringify(ticket))}
      staffUsers={staffUsers}
      currentUserRole={session.user.role}
    />
  );
}
