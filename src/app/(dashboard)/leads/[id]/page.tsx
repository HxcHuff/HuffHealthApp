import { notFound } from "next/navigation";
import { getLead, getStaffUsers } from "@/actions/leads";
import { LeadDetail } from "@/components/leads/lead-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const [lead, staffUsers] = await Promise.all([getLead(id), getStaffUsers()]);

  if (!lead) notFound();

  return (
    <LeadDetail
      lead={JSON.parse(JSON.stringify(lead))}
      staffUsers={staffUsers}
    />
  );
}
