import { PortalPoliciesWorkspace } from "@/components/v2/workspaces/portal-policies-workspace";

const policies = [
  { id: "P-1001", type: "Medicare Advantage", renewal: "2026-04-11", status: "Active" },
  { id: "P-1011", type: "Dental + Vision", renewal: "2026-05-03", status: "Active" },
];

export default function PortalPoliciesPage() {
  return <PortalPoliciesWorkspace initialPolicies={policies} />;
}
