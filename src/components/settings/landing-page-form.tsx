"use client";

import { useState } from "react";
import { updateSiteSettings } from "@/actions/site-settings";

interface LandingPageFormProps {
  currentUrl: string;
}

export function LandingPageForm({ currentUrl }: LandingPageFormProps) {
  const [url, setUrl] = useState(currentUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const result = await updateSiteSettings({ landingPageUrl: url });

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Saved successfully");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="landingPageUrl" className="block text-sm font-medium text-gray-700 mb-1">
          URL
        </label>
        <input
          id="landingPageUrl"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourdomain.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {message && (
          <span className={`text-sm ${message === "Saved successfully" ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
