import { PageHeader } from "@/components/shared/page-header";
import { FacebookIntegrationSettings } from "@/components/settings/facebook-integration";
import { getFacebookIntegrations } from "@/actions/facebook";

export default async function FacebookSettingsPage() {
  const integrations = await getFacebookIntegrations();

  return (
    <>
      <PageHeader
        title="Facebook Lead Ads"
        description="Connect your Facebook page to automatically import leads"
      />
      <div className="max-w-2xl">
        <FacebookIntegrationSettings integrations={integrations} />
      </div>
    </>
  );
}
