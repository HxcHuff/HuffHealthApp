import Link from "next/link";
import {
  Cake,
  CalendarHeart,
  GraduationCap,
  HeartPulse,
  CalendarRange,
  CalendarCheck,
  CalendarClock,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  PhoneOff,
  ClipboardCheck,
  Bell,
  FileQuestion,
  UserPlus,
  AlertCircle,
  TicketPlus,
  Ticket,
  Upload,
  Users,
  FileCheck,
  Award,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

interface ActionCategory {
  title: string;
  actions: {
    label: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[];
}

const categories: ActionCategory[] = [
  {
    title: "Age & Milestone Outreach",
    actions: [
      {
        label: "Turning 65",
        description: "Medicare Eligible",
        href: "/leads?ageFilter=turning65",
        icon: HeartPulse,
        color: "bg-red-100 text-red-700",
      },
      {
        label: "Turning 26",
        description: "Aging Off Parent's Plan",
        href: "/leads?ageFilter=turning26",
        icon: GraduationCap,
        color: "bg-blue-100 text-blue-700",
      },
      {
        label: "Birthdays This Month",
        description: "Send birthday outreach",
        href: "/leads?filter=birthdayThisMonth",
        icon: Cake,
        color: "bg-pink-100 text-pink-700",
      },
      {
        label: "Turning 55",
        description: "HSA Catch-Up Eligible",
        href: "/leads?ageFilter=turning55",
        icon: CalendarHeart,
        color: "bg-purple-100 text-purple-700",
      },
    ],
  },
  {
    title: "Enrollment Periods",
    actions: [
      {
        label: "AEP Clients",
        description: "Oct 15 – Dec 7",
        href: "/leads?filter=aep",
        icon: CalendarRange,
        color: "bg-indigo-100 text-indigo-700",
      },
      {
        label: "OEP Clients",
        description: "Nov 1 – Jan 15",
        href: "/leads?filter=oep",
        icon: CalendarCheck,
        color: "bg-teal-100 text-teal-700",
      },
      {
        label: "Medicare MA OEP",
        description: "Jan 1 – Mar 31",
        href: "/leads?filter=maoep",
        icon: CalendarClock,
        color: "bg-cyan-100 text-cyan-700",
      },
      {
        label: "Special Enrollment",
        description: "Life Events",
        href: "/leads?filter=sep",
        icon: ShieldAlert,
        color: "bg-amber-100 text-amber-700",
      },
    ],
  },
  {
    title: "Policy Lifecycle",
    actions: [
      {
        label: "Renewals Coming Up",
        description: "Within 60 days",
        href: "/leads?filter=renewalSoon",
        icon: RefreshCw,
        color: "bg-green-100 text-green-700",
      },
      {
        label: "Grace Period",
        description: "Policies at risk",
        href: "/leads?filter=gracePeriod",
        icon: AlertTriangle,
        color: "bg-yellow-100 text-yellow-700",
      },
      {
        label: "Lapsed Policies",
        description: "Win-back opportunities",
        href: "/leads?filter=lapsed",
        icon: PhoneOff,
        color: "bg-red-100 text-red-700",
      },
      {
        label: "Annual Review Due",
        description: "Schedule reviews",
        href: "/leads?filter=annualReview",
        icon: ClipboardCheck,
        color: "bg-blue-100 text-blue-700",
      },
    ],
  },
  {
    title: "Daily Tasks",
    actions: [
      {
        label: "Follow-Up Reminders",
        description: "Pending follow-ups",
        href: "/leads?filter=followUpDue",
        icon: Bell,
        color: "bg-orange-100 text-orange-700",
      },
      {
        label: "Open Quotes",
        description: "No response yet",
        href: "/leads?filter=openQuotes",
        icon: FileQuestion,
        color: "bg-violet-100 text-violet-700",
      },
      {
        label: "New Leads Today",
        description: "Fresh leads to work",
        href: "/leads?filter=today",
        icon: UserPlus,
        color: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "Overdue Tasks",
        description: "Needs attention",
        href: "/leads?filter=overdue",
        icon: AlertCircle,
        color: "bg-red-100 text-red-700",
      },
    ],
  },
  {
    title: "Client Management",
    actions: [
      {
        label: "Create New Ticket",
        description: "Open a support ticket",
        href: "/tickets/new",
        icon: TicketPlus,
        color: "bg-orange-100 text-orange-700",
      },
      {
        label: "View Open Tickets",
        description: "Manage active tickets",
        href: "/tickets?status=OPEN",
        icon: Ticket,
        color: "bg-amber-100 text-amber-700",
      },
      {
        label: "Add New Lead",
        description: "Create lead manually",
        href: "/leads?new=true",
        icon: Users,
        color: "bg-blue-100 text-blue-700",
      },
      {
        label: "Import Leads",
        description: "Upload CSV or Excel",
        href: "/leads/import",
        icon: Upload,
        color: "bg-green-100 text-green-700",
      },
    ],
  },
  {
    title: "Compliance",
    actions: [
      {
        label: "Scope of Appointment",
        description: "SOA verification",
        href: "/actions/compliance#soa",
        icon: FileCheck,
        color: "bg-slate-100 text-slate-700",
      },
      {
        label: "License Renewal",
        description: "Track license status",
        href: "/actions/compliance#license",
        icon: Award,
        color: "bg-sky-100 text-sky-700",
      },
      {
        label: "CE Credits Status",
        description: "Continuing education",
        href: "/actions/compliance#ce",
        icon: BookOpen,
        color: "bg-indigo-100 text-indigo-700",
      },
      {
        label: "Product Certifications",
        description: "Carrier certifications",
        href: "/actions/compliance#certs",
        icon: ShieldCheck,
        color: "bg-emerald-100 text-emerald-700",
      },
    ],
  },
];

export default function ActionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Actions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Common insurance agent tasks and shortcuts
        </p>
      </div>

      {categories.map((category) => (
        <div key={category.title} className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            {category.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {category.actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${action.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
