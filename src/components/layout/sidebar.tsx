"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Target,
  Ticket,
  Contact,
  Megaphone,
  Settings,  Kanban,
  ClipboardList,
  CheckSquare,
  Zap,
  ExternalLink,
  Plus,
  TicketPlus,
  Globe,
  UserCheck,
  Inbox,
  MessageSquare,
  ShieldCheck,
  CalendarDays,
  FileText,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { isUiV2Enabled } from "@/lib/feature-flags";
import { getAppInitials, getAppName } from "@/lib/app-brand";

interface SidebarProps {
  role: string;
  landingPageUrl?: string | null;
}

const SIDEBAR_COLLAPSED_KEY = "crm_sidebar_collapsed";

function subscribeToSidebarPreference(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("sidebar-collapsed-change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("sidebar-collapsed-change", handler);
  };
}

function getSidebarPreferenceSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

const staffNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/actions", label: "Actions", icon: ClipboardList },
  { href: "/leads/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/clients", label: "Clients", icon: UserCheck },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
];

const quickActionItems = [
  { href: "/leads?new=true", label: "Add Lead", icon: Plus },
  { href: "/tickets/new", label: "Create Ticket", icon: TicketPlus },
];

const adminOnlyItems = [
  { href: "/settings/users", label: "User Management", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

const v2NavItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/policies", label: "Policies", icon: ShieldCheck },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/recruiting", label: "Recruiting", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/automations", label: "Automations", icon: Bot },
  { href: "/integrations", label: "Integrations", icon: Zap },
];

export function Sidebar({ role, landingPageUrl }: SidebarProps) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarPreferenceSnapshot,
    () => false
  );
  const showV2 = isUiV2Enabled();
  const appName = getAppName();
  const appInitials = getAppInitials();

  function toggleCollapsed() {
    const next = !collapsed;
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
    window.dispatchEvent(new Event("sidebar-collapsed-change"));
  }

  const navItems = role === "ADMIN"
    ? [...staffNavItems, ...(showV2 ? v2NavItems : []), ...adminOnlyItems]
    : [...staffNavItems, ...(showV2 ? v2NavItems : [])];
  const compactSidebarRoutes = new Set([
    "/dashboard",
    "/leads",
    "/actions",
    "/tasks",
    "/tickets",
    "/inbox",
    "/calendar",
    "/settings",
  ]);
  const renderedNavItems = collapsed
    ? navItems.filter((item) => compactSidebarRoutes.has(item.href))
    : navItems;

  return (
    <aside className={cn("hidden lg:flex lg:flex-col border-r border-gray-200 bg-white transition-all", collapsed ? "lg:w-20" : "lg:w-64")}>
      <div className={cn("relative flex h-16 items-center border-b border-gray-200", collapsed ? "px-3 justify-center" : "px-6 justify-between")}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            {appInitials}
          </div>
          {!collapsed && <span className="text-lg font-semibold text-gray-900">{appName}</span>}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="absolute top-5 right-2 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <nav className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
        <ul className="space-y-1">
          {renderedNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    collapsed ? "justify-center gap-0" : "gap-3",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          })}
          {landingPageUrl && (
            <li>
              <a
                href={landingPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={collapsed ? "Website Access" : undefined}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Globe className="h-5 w-5 flex-shrink-0" />
                {!collapsed && "Website Access"}
                {!collapsed && <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />}
              </a>
            </li>
          )}
        </ul>

        <div className={cn("mt-4 pt-4 border-t border-gray-200", collapsed && "hidden")}>
          {!collapsed && <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</p>}
          <ul className="space-y-1">
            {quickActionItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      collapsed ? "justify-center gap-0" : "gap-3",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
