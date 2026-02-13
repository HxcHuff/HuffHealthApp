"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateNotificationPreferences } from "@/actions/settings";

interface NotificationPreferencesFormProps {
  preferences: {
    ticketUpdates: boolean;
    leadAssignments: boolean;
    announcements: boolean;
  };
}

export function NotificationPreferencesForm({
  preferences: initial,
}: NotificationPreferencesFormProps) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const result = await updateNotificationPreferences(prefs);
    setSaving(false);
    if (result.success) {
      setMessage("Preferences saved");
      router.refresh();
    } else {
      setMessage("Failed to save");
    }
  };

  const options = [
    {
      key: "ticketUpdates" as const,
      label: "Ticket Updates",
      description: "Get notified when tickets are updated or receive new comments",
    },
    {
      key: "leadAssignments" as const,
      label: "Lead Assignments",
      description: "Get notified when a lead is assigned to you",
    },
    {
      key: "announcements" as const,
      label: "Announcements",
      description: "Get notified when new announcements are posted",
    },
  ];

  return (
    <div className="space-y-4">
      {options.map((opt) => (
        <div
          key={opt.key}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">{opt.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
          </div>
          <button
            type="button"
            onClick={() => toggle(opt.key)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              prefs[opt.key] ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                prefs[opt.key] ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        {message && (
          <span className="text-sm text-green-600">{message}</span>
        )}
      </div>
    </div>
  );
}
