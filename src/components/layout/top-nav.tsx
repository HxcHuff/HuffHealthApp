"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@/components/auth/user-button";
import {
  Menu,
  X,
  LayoutDashboard,
  Target,
  Ticket,
  Contact,
  Megaphone,
  Upload,
  Kanban,
} from "lucide-react";

interface TopNavProps {
  user: { name?: string | null; email?: string | null; role: string };
}

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/leads/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/leads/import", label: "Import", icon: Upload },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
];

export function TopNav({ user }: TopNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden rounded-lg p-2 hover:bg-gray-100"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs">
              HH
            </div>
            <span className="font-semibold text-gray-900">HuffHealth</span>
          </div>
        </div>
        <UserButton
          name={user.name || "User"}
          email={user.email || ""}
          role={user.role}
        />
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 top-16 bg-white border-t border-gray-200">
          <nav className="p-4">
            <ul className="space-y-1">
              {mobileNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
