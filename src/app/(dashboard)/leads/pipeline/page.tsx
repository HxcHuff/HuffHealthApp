import { db } from "@/lib/db";
import { LeadPipeline } from "@/components/leads/lead-pipeline";

export default async function PipelinePage() {
  const leads = await db.lead.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      zipCode: true,
      source: true,
      status: true,
      stageEnteredAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return <LeadPipeline leads={JSON.parse(JSON.stringify(leads))} />;
}
