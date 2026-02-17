"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Target,
  Ticket,
  Contact,
  Megaphone,
  Settings,
  Upload,
  Kanban,
  ClipboardList,
  CheckSquare,
  Zap,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  role: string;
}

const staffNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/actions", label: "Actions", icon: ClipboardList },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/leads/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/leads/import", label: "Import Leads", icon: Upload },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
];

const adminOnlyItems = [
  { href: "/settings/users", label: "User Management", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navItems = role === "ADMIN" ? [...staffNavItems, ...adminOnlyItems] : staffNavItems;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            HH
          </div>
          <span className="text-lg font-semibold text-gray-900">HuffHealth</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          {process.env.NEXT_PUBLIC_DRIP_ENGINE_URL && (
            <li>
              <a
                href={process.env.NEXT_PUBLIC_DRIP_ENGINE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Zap className="h-5 w-5 flex-shrink-0" />
                Drip Engine
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </a>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
