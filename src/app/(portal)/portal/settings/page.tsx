import { getNotificationPreferences } from "@/actions/settings";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { redirect } from "next/navigation";

export default async function PortalSettingsPage() {
  const preferences = await getNotificationPreferences();
  if (!preferences) redirect("/login");

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Manage your notification preferences</p>
      <div className="max-w-lg">
        <NotificationPreferencesForm preferences={preferences} />
      </div>
    </div>
  );
}
