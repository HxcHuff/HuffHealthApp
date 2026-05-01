import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listConversations } from "@/actions/conversations";
import { ConversationsWorkspace } from "@/components/conversations/conversations-workspace";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["ADMIN", "STAFF"].includes(session.user.role)) redirect("/portal");

  const result = await listConversations({});
  if ("error" in result) {
    return (
      <div className="p-6 text-sm text-red-600">Error loading conversations: {result.error}</div>
    );
  }

  return (
    <ConversationsWorkspace
      initialConversations={JSON.parse(JSON.stringify(result.conversations))}
      initialUnreadCount={result.totalUnread}
    />
  );
}
