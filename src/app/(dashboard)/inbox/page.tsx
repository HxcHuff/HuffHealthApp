import { InboxWorkspace } from "@/components/v2/workspaces/inbox-workspace";
import { inboxThreads } from "@/lib/ui-v2-mocks";

export default function InboxPage() {
  return <InboxWorkspace initialThreads={inboxThreads} />;
}
