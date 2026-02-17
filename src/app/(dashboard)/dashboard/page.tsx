import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getRecentActivities } from "@/actions/activities";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import {
  Target,
  TrendingUp,
  Ticket,
  ContactRound,
  Plus,
  Upload,
  Clock,
  Zap,
  ClipboardList,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const [
    totalLeads,
    leadsByStatus,
    openTickets,
    totalTickets,
    totalContacts,
    recentActivities,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.groupBy({ by: ["status"], _count: true }),
    db.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.ticket.count(),
    db.contact.count(),
    getRecentActivities(15),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const item of leadsByStatus) {
    statusCounts[item.status] = item._count;
  }

  const enrolledCount = statusCounts["ENROLLED"] || 0;
  const conversionRate = totalLeads > 0 ? ((enrolledCount / totalLeads) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {session.user.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/leads" className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalLeads}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">in pipeline</p>
        </Link>

        <Link href="/leads?status=ENROLLED" className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Enrollment Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{conversionRate}%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{enrolledCount} enrolled</p>
        </Link>

        <Link href="/tickets" className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{openTickets}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
              <Ticket className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{totalTickets} total</p>
        </Link>

        <Link href="/contacts" className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Contacts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalContacts}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <ContactRound className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">total contacts</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Pipeline Summary */}
        <div className="lg:col-span-1 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Lead Pipeline</h2>
            <Link href="/leads/pipeline" className="text-xs text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {LEAD_STATUS_OPTIONS.map((status) => {
              const count = statusCounts[status.value] || 0;
              const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              return (
                <Link key={status.value} href={`/leads?status=${status.value}`} className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{status.label}</span>
                    <span className="text-xs text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/leads" className="text-xs text-blue-600 hover:underline">
              View all leads
            </Link>
          </div>
          {recentActivities.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activity.performedBy.name} &middot;{" "}
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                  {activity.lead && (
                    <Link
                      href={`/leads/${activity.lead.id}`}
                      className="text-xs text-blue-600 hover:underline flex-shrink-0"
                    >
                      {activity.lead.firstName} {activity.lead.lastName}
                    </Link>
                  )}
                  {activity.ticket && (
                    <Link
                      href={`/tickets/${activity.ticket.id}`}
                      className="text-xs text-blue-600 hover:underline flex-shrink-0"
                    >
                      {activity.ticket.subject}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No activity yet. Start by adding leads or creating tickets.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/leads?new=true"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Plus className="h-4 w-4 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Add Lead</p>
              <p className="text-xs text-gray-500">Create a new lead manually</p>
            </div>
          </Link>
          <Link
            href="/leads/import"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <Upload className="h-4 w-4 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Import Leads</p>
              <p className="text-xs text-gray-500">Upload CSV or Excel file</p>
            </div>
          </Link>
          <Link
            href="/tickets/new"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
              <Ticket className="h-4 w-4 text-orange-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Create Ticket</p>
              <p className="text-xs text-gray-500">Open a support ticket</p>
            </div>
          </Link>
          <Link
            href="/actions"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
              <ClipboardList className="h-4 w-4 text-indigo-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Actions</p>
              <p className="text-xs text-gray-500">Insurance task shortcuts</p>
            </div>
          </Link>
          {process.env.NEXT_PUBLIC_DRIP_ENGINE_URL && (
            <a
              href={process.env.NEXT_PUBLIC_DRIP_ENGINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100">
                <Zap className="h-4 w-4 text-cyan-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Drip Campaigns</p>
                <p className="text-xs text-gray-500">Manage automated messaging</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
