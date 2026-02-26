import { PortalAppointmentsWorkspace } from "@/components/v2/workspaces/portal-appointments-workspace";

const upcoming = [
  { when: "2026-02-24T10:30", with: "Taylor Morgan", type: "Renewal Review" },
  { when: "2026-03-02T14:00", with: "Jordan Lee", type: "Policy Service" },
];

export default function PortalAppointmentsPage() {
  return <PortalAppointmentsWorkspace initialAppointments={upcoming} />;
}
