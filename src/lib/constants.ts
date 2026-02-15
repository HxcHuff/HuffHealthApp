export const LEAD_STATUS_OPTIONS = [
  { value: "NEW_LEAD", label: "New Lead", color: "bg-blue-100 text-blue-800" },
  { value: "CONTACTED", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { value: "QUOTED", label: "Quoted", color: "bg-purple-100 text-purple-800" },
  { value: "APPLICATION_SENT", label: "Application Sent", color: "bg-indigo-100 text-indigo-800" },
  { value: "ENROLLED", label: "Enrolled", color: "bg-green-100 text-green-800" },
  { value: "LOST", label: "Lost", color: "bg-red-100 text-red-800" },
] as const;

export const TICKET_STATUS_OPTIONS = [
  { value: "OPEN", label: "Open", color: "bg-blue-100 text-blue-800" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "RESOLVED", label: "Resolved", color: "bg-green-100 text-green-800" },
  { value: "CLOSED", label: "Closed", color: "bg-gray-100 text-gray-800" },
] as const;

export const TICKET_PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "MEDIUM", label: "Medium", color: "bg-blue-100 text-blue-800" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-800" },
] as const;

export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "STAFF", label: "Staff" },
  { value: "CLIENT", label: "Client" },
] as const;

export const LEAD_SOURCE_OPTIONS = [
  "Facebook Lead Ad",
  "Website",
  "Referral",
  "Cold Call",
  "Email Campaign",
  "CSV Import",
  "Manual Entry",
  "Other",
] as const;

export const CHART_COLORS = {
  lead: {
    NEW_LEAD: "#3b82f6",
    CONTACTED: "#eab308",
    QUOTED: "#a855f7",
    APPLICATION_SENT: "#6366f1",
    ENROLLED: "#22c55e",
    LOST: "#ef4444",
  },
  ticket: {
    OPEN: "#3b82f6",
    IN_PROGRESS: "#eab308",
    RESOLVED: "#22c55e",
    CLOSED: "#6b7280",
  },
  primary: "#2563eb",
  primaryLight: "#93c5fd",
} as const;
