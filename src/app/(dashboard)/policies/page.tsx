import { PoliciesWorkspace } from "@/components/v2/workspaces/policies-workspace";
import { policyRows } from "@/lib/ui-v2-mocks";

export default function PoliciesPage() {
  return <PoliciesWorkspace initialRows={policyRows} />;
}
