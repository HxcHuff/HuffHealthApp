import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLeadSources } from "@/actions/settings";
import { LeadSourceManager } from "@/components/settings/lead-source-manager";
import { PageHeader } from "@/components/shared/page-header";

export default async function LeadSourcesPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const sources = await getLeadSources();

  return (
    <>
      <PageHeader title="Lead Sources" description="Manage lead sources for your pipeline" />
      <LeadSourceManager sources={JSON.parse(JSON.stringify(sources))} />
    </>
  );
}
