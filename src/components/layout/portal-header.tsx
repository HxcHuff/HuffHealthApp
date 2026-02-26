"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@/components/auth/user-button";
import { Home, Ticket, Megaphone, ShieldCheck, FileText, CalendarDays } from "lucide-react";
import { isUiV2Enabled } from "@/lib/feature-flags";
import { getAppInitials, getAppName } from "@/lib/app-brand";

interface PortalHeaderProps {
  user: { name?: string | null; email?: string | null; role: string };
}

const portalNavItems = [
  { href: "/portal", label: "Home", icon: Home },
  { href: "/portal/tickets", label: "My Tickets", icon: Ticket },
  { href: "/portal/announcements", label: "Updates", icon: Megaphone },
];

const portalV2NavItems = [
  { href: "/portal/policies", label: "My Policies", icon: ShieldCheck },
  { href: "/portal/documents", label: "My Documents", icon: FileText },
  { href: "/portal/appointments", label: "Appointments", icon: CalendarDays },
];

export function PortalHeader({ user }: PortalHeaderProps) {
  const pathname = usePathname();
  const navItems = isUiV2Enabled()
    ? [...portalNavItems, ...portalV2NavItems]
    : portalNavItems;
  const appName = getAppName();
  const appInitials = getAppInitials();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                {appInitials}
              </div>
              <span className="text-lg font-semibold text-gray-900 hidden sm:block">
                {appName}
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/portal"
                    ? pathname === "/portal"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <UserButton
            name={user.name || "User"}
            email={user.email || ""}
            role={user.role}
          />
        </div>
      </div>
    </header>
  );
}
