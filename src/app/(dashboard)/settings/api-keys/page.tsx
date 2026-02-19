import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getApiKeys } from "@/actions/api-keys";
import { ApiKeyManager } from "@/components/settings/api-key-manager";
import { PageHeader } from "@/components/shared/page-header";

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const keys = await getApiKeys();

  return (
    <>
      <PageHeader title="API Keys" description="Manage API keys for external access" />
      <ApiKeyManager keys={JSON.parse(JSON.stringify(keys))} />
    </>
  );
}
