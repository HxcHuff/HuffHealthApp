"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isUiV2Enabled } from "@/lib/feature-flags";
import {
  LayoutDashboard,
  Inbox,
  Target,
  ShieldCheck,
  CheckSquare,
  Ticket,
  Contact,
} from "lucide-react";

const baseItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

const v2Items = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/policies", label: "Policies", icon: ShieldCheck },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const items = isUiV2Enabled()
    ? [baseItems[0], v2Items[0], baseItems[1], v2Items[1], baseItems[2]]
    : [
        baseItems[0],
        baseItems[1],
        { href: "/tickets", label: "Tickets", icon: Ticket },
        { href: "/contacts", label: "Contacts", icon: Contact },
        baseItems[2],
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
      <ul className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  isActive ? "text-blue-700" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
