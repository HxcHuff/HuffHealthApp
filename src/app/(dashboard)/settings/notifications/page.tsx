import { getNotificationPreferences } from "@/actions/settings";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { redirect } from "next/navigation";

export default async function NotificationSettingsPage() {
  const preferences = await getNotificationPreferences();
  if (!preferences) redirect("/login");

  return (
    <>
      <PageHeader title="Notification Preferences" description="Manage your email notifications" />
      <div className="max-w-lg">
        <NotificationPreferencesForm preferences={preferences} />
      </div>
    </>
  );
}
