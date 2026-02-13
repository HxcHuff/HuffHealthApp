import { db } from "@/lib/db";
import { auth } from "@/auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Megaphone, Plus, Globe, Lock } from "lucide-react";

export default async function AnnouncementsPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const announcements = await db.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Manage announcements for the client portal"
        actions={
          isAdmin ? (
            <Link
              href="/announcements/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </Link>
          ) : null
        }
      />

      {announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6 text-gray-400" />}
          title="No announcements"
          description="Create announcements to share updates with your clients."
          action={
            isAdmin ? (
              <Link
                href="/announcements/new"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Announcement
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{a.title}</h3>
                    {a.isPublished ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        <Globe className="h-3 w-3" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        <Lock className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {a.author.name} &middot; {formatDate(a.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
