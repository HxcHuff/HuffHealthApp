"use client";

import { useState } from "react";
import Link from "next/link";
import { KpiStrip } from "@/components/v2/kpi-strip";
import { PriorityQueue } from "@/components/v2/priority-queue";
import { dashboardKpis, priorityQueue, type KpiItem, type QueueItem } from "@/lib/ui-v2-mocks";
import type { CommandCenterData } from "@/actions/dashboard";
import { actionHubCategories, getActionCategoryByTitle } from "@/lib/action-hub";

interface CommandCenterWorkspaceProps {
  initialData?: CommandCenterData;
}

export function CommandCenterWorkspace({ initialData }: CommandCenterWorkspaceProps) {
  const [items, setItems] = useState<QueueItem[]>(initialData?.queue || priorityQueue);
  const [showAllActionCategories, setShowAllActionCategories] = useState(false);
  const kpis: KpiItem[] = initialData?.kpis || dashboardKpis;
  const pulse = initialData?.pulse;
  const buckets = initialData?.buckets;
  const compliance = initialData?.compliance;
  const startHereCategories = actionHubCategories.filter(
    (category) => category.title !== "Client Management" && category.title !== "Compliance"
  );
  const todaysActionItems = startHereCategories.flatMap((category) =>
    category.actions.map((action) => ({
      ...action,
      categoryTitle: category.title,
    }))
  );
  const clientManagementCategory = getActionCategoryByTitle("Client Management");
  const workflowCounts = {
    quoteFollowUp: buckets?.quoteFollowUp ?? 18,
    enrollmentPendingDocs: buckets?.enrollmentPendingDocs ?? 12,
    retentionCallsDue: buckets?.retentionCallsDue ?? 9,
  };
  const bucketActionCount = 3;
  const todayWorkflowTotal = todaysActionItems.length + bucketActionCount;
  const visibleActionItems = todaysActionItems.slice(0, 8);
  const hiddenActionItemsCount = Math.max(todaysActionItems.length - visibleActionItems.length, 0);
  const visibleCategories = showAllActionCategories ? startHereCategories : startHereCategories.slice(0, 2);
  const hiddenCategoryCount = Math.max(startHereCategories.length - visibleCategories.length, 0);
  const workloadTone =
    todayWorkflowTotal <= 15
      ? "bg-emerald-50 text-emerald-700"
      : todayWorkflowTotal <= 35
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";

  function complete(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-5">
      <div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
          <p className="mt-1 text-sm text-gray-500">Daily execution for quoting, enrollment, renewals, and member service.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Today Workflow</h2>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${workloadTone}`}>
            {todayWorkflowTotal}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">High Priority Buckets</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <Link href="/leads?filter=openQuotes" className="rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Quote Follow-Up</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{workflowCounts.quoteFollowUp}</p>
              </Link>
              <Link href="/leads?status=APPLICATION_SENT" className="rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Enrollment Pending Docs</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{workflowCounts.enrollmentPendingDocs}</p>
              </Link>
              <Link href="/leads?filter=renewalSoon" className="rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Retention Calls Due</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{workflowCounts.retentionCallsDue}</p>
              </Link>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick Shortcuts</p>
            <div className="flex flex-wrap gap-2">
              {visibleActionItems.map((action) => (
                <Link
                  key={`today-action-${action.categoryTitle}-${action.href}-${action.label}`}
                  href={action.href}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  {action.label}
                </Link>
              ))}
              {hiddenActionItemsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllActionCategories(true)}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  +{hiddenActionItemsCount} more
                </button>
              )}
            </div>
          </div>
          {items.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 lg:col-span-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-600">{item.subtitle}</p>
              </div>
              <button onClick={() => complete(item.id)} className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Done</button>
            </div>
          ))}
          {items.length > 2 && (
            <div className="lg:col-span-2">
              <Link href="#priority-queue" className="text-xs font-medium text-blue-600 hover:underline">
                View full priority queue ({items.length} items)
              </Link>
            </div>
          )}
          {todayWorkflowTotal === 0 && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 lg:col-span-2">
              <p className="text-sm text-gray-700">All priority items completed.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href="/leads?filter=openQuotes" className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">
                  Work Open Quotes
                </Link>
                <Link href="/leads?status=APPLICATION_SENT" className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">
                  Check Pending Applications
                </Link>
                <Link href="/leads?filter=renewalSoon" className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">
                  Start Renewal Calls
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Start Here: Actions</h2>
            <p className="mt-1 text-sm text-gray-600">
              One-click workflows for non-technical agents.
            </p>
          </div>
          <Link
            href="/actions"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open Full Actions Hub
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {visibleCategories.map((category) => (
            <div key={category.title} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{category.title}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {category.actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={`${category.title}-${action.href}-${action.label}`}
                      href={action.href}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-100"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{action.label}</p>
                        <p className="text-xs text-gray-500 truncate">{action.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {hiddenCategoryCount > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowAllActionCategories((prev) => !prev)}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {showAllActionCategories ? "Show fewer categories" : `Show ${hiddenCategoryCount} more categories`}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Client Management Quick Actions</h2>
            <p className="mt-1 text-sm text-gray-600">Shortcuts for service tickets, support, and intake.</p>
          </div>
          <Link
            href="/actions/client-management"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open Workspace
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {clientManagementCategory?.actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={`client-management-${action.href}-${action.label}`}
                href={action.href}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{action.label}</p>
                  <p className="text-xs text-gray-500 truncate">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <KpiStrip items={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div id="priority-queue">
            <PriorityQueue items={items} />
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Operational Buckets</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Link href="/leads?filter=openQuotes" className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Quote Follow-Up</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{workflowCounts.quoteFollowUp}</p>
                <p className="mt-1 text-xs text-gray-600">Leads waiting on plan recommendation</p>
                <p className="mt-2 text-xs font-medium text-blue-600">Open queue</p>
              </Link>
              <Link href="/leads?status=APPLICATION_SENT" className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Enrollment Pending Docs</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{workflowCounts.enrollmentPendingDocs}</p>
                <p className="mt-1 text-xs text-gray-600">SOA, consent, or verification required</p>
                <p className="mt-2 text-xs font-medium text-blue-600">Open queue</p>
              </Link>
              <Link href="/leads?filter=renewalSoon" className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Retention Calls Due</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{workflowCounts.retentionCallsDue}</p>
                <p className="mt-1 text-xs text-gray-600">Renewal risk within 30 days</p>
                <p className="mt-2 text-xs font-medium text-blue-600">Open queue</p>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Team Pulse</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex items-center justify-between border-b border-gray-100 pb-2"><span>Tasks due today</span><span className="font-semibold text-gray-900">{pulse?.tasksDueToday ?? 14}</span></li>
              <li className="flex items-center justify-between border-b border-gray-100 pb-2"><span>Carrier escalations open</span><span className="font-semibold text-gray-900">{pulse?.openEscalations ?? 3}</span></li>
              <li className="flex items-center justify-between border-b border-gray-100 pb-2"><span>Renewals in next 30 days</span><span className="font-semibold text-gray-900">{pulse?.renewalsIn30Days ?? 29}</span></li>
              <li className="flex items-center justify-between"><span>Unassigned service threads</span><span className="font-semibold text-gray-900">{pulse?.unassignedServiceTickets ?? 11}</span></li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Compliance Watch</h2>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <p>
                Missing contact info: {compliance?.missingContactInfo ?? 4} records
                {" · "}
                <Link href="/leads?statuses=NEW_LEAD,CONTACTED,QUOTED,APPLICATION_SENT" className="text-blue-600 hover:underline">
                  open
                </Link>
              </p>
              <p>
                No follow-up date on quoted/apps: {compliance?.missingFollowUpDate ?? 2}
                {" · "}
                <Link href="/leads?statuses=QUOTED,APPLICATION_SENT" className="text-blue-600 hover:underline">
                  open
                </Link>
              </p>
              <p>
                Open tickets older than 72h: {compliance?.agedOpenTickets ?? 1}
                {" · "}
                <Link href="/tickets?status=OPEN" className="text-blue-600 hover:underline">
                  open
                </Link>
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-500">Resolve these first to protect conversion and audit readiness.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
