import { IntegrationsWorkspace } from "@/components/v2/workspaces/integrations-workspace";
import { getApiKeys, getLeadSourceApiKeyMappings } from "@/actions/api-keys";
import { ApiKeyManager } from "@/components/settings/api-key-manager";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

export default async function IntegrationsPage() {
  const [apiKeys, leadSourceMappings] = await Promise.all([
    getApiKeys(),
    getLeadSourceApiKeyMappings(),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Calendar Integrations</h2>
        <p className="mt-1 text-xs text-gray-500">
          Connect each agent&apos;s Google Calendar for scheduling workflows.
        </p>
        <Link
          href="/settings/integrations/google-calendar"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <CalendarDays className="h-4 w-4" />
          Open Google Calendar Integration
        </Link>
      </section>
      <IntegrationsWorkspace
        leadSourceMappings={JSON.parse(JSON.stringify(leadSourceMappings))}
        apiKeyOptions={JSON.parse(JSON.stringify(apiKeys.filter((k) => !k.isRevoked)))}
      />
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">API Keys</h2>
        <p className="mt-1 text-xs text-gray-500">
          Create and manage API keys for external integrations.
        </p>
        <div className="mt-4">
          <ApiKeyManager keys={JSON.parse(JSON.stringify(apiKeys))} />
        </div>
      </section>
    </div>
  );
}
