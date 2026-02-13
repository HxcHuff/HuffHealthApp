import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Ticket, Megaphone, Plus } from "lucide-react";

export default async function PortalHomePage() {
  const session = await auth();
  if (!session) return null;

  const [openTickets, totalTickets, announcements] = await Promise.all([
    db.ticket.count({
      where: { clientId: session.user.id, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    db.ticket.count({ where: { clientId: session.user.id } }),
    db.announcement.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
      include: { author: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {session.user.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your support tickets and stay up to date.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Ticket className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{openTickets}</p>
              <p className="text-xs text-gray-500">Open Tickets</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
              <Ticket className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
              <p className="text-xs text-gray-500">Total Tickets</p>
            </div>
          </div>
        </div>
        <Link
          href="/portal/tickets/new"
          className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-5 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">New Ticket</p>
            <p className="text-xs text-gray-500">Submit a support request</p>
          </div>
        </Link>
      </div>

      {announcements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Latest Updates</h2>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <h3 className="text-sm font-medium text-gray-900">{a.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {a.author.name} &middot;{" "}
                  {a.publishedAt
                    ? new Date(a.publishedAt).toLocaleDateString()
                    : new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
