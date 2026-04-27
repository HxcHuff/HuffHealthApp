import { PortalDocumentsWorkspace } from "@/components/v2/workspaces/portal-documents-workspace";

const docs = [
  { name: "SOA Form", status: "Uploaded" },
  { name: "Proof of Address", status: "Pending" },
  { name: "Identity Verification", status: "Uploaded" },
];

export default function PortalDocumentsPage() {
  return <PortalDocumentsWorkspace initialDocs={docs} />;
}
