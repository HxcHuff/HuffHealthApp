import { DocumentsWorkspace } from "@/components/v2/workspaces/documents-workspace";
import { listDropboxFiles } from "@/lib/dropbox";
import { auth } from "@/auth";

export default async function DocumentsPage() {
  const session = await auth();
  const files =
    session && ["ADMIN", "STAFF"].includes(session.user.role)
      ? await listDropboxFiles()
      : [];

  return <DocumentsWorkspace initialFiles={files} />;
}
