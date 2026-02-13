export const LEAD_STATUS_OPTIONS = [
  { value: "NEW", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "CONTACTED", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { value: "QUALIFIED", label: "Qualified", color: "bg-purple-100 text-purple-800" },
  { value: "CONVERTED", label: "Converted", color: "bg-green-100 text-green-800" },
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
