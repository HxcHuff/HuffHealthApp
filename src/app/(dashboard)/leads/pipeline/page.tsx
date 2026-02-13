import { db } from "@/lib/db";
import { LeadPipeline } from "@/components/leads/lead-pipeline";

export default async function PipelinePage() {
  const leads = await db.lead.findMany({
    include: {
      assignedTo: { select: { id: true, name: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return <LeadPipeline leads={JSON.parse(JSON.stringify(leads))} />;
}
