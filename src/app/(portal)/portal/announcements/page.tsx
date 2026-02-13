import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Megaphone } from "lucide-react";

export default async function PortalAnnouncementsPage() {
  const announcements = await db.announcement.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader title="Updates & Announcements" />
      {announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6 text-gray-400" />}
          title="No announcements yet"
          description="Check back later for updates from the team."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">{a.title}</h2>
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{a.content}</p>
              <p className="text-xs text-gray-400 mt-3">
                {a.author.name} &middot;{" "}
                {a.publishedAt
                  ? new Date(a.publishedAt).toLocaleDateString()
                  : new Date(a.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
