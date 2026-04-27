import { PageHeader } from "@/components/shared/page-header";
import { GoogleCalendarIntegration } from "@/components/settings/google-calendar-integration";
import { getGoogleCalendarIntegration } from "@/actions/google-calendar";

export default async function GoogleCalendarSettingsPage() {
  const connection = await getGoogleCalendarIntegration();

  return (
    <>
      <PageHeader
        title="Google Calendar"
        description="Connect an agent Google Calendar account for scheduling integration."
      />
      <div className="max-w-2xl">
        <GoogleCalendarIntegration connection={connection} />
      </div>
    </>
  );
}
