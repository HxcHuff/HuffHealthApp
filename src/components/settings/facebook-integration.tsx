"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  saveFacebookIntegration,
  disconnectFacebookIntegration,
  triggerFacebookSync,
} from "@/actions/facebook";
import { getPageForms } from "@/lib/facebook";
import { formatRelativeTime } from "@/lib/utils";
import { Facebook, RefreshCw, Unplug, CheckCircle2, AlertCircle } from "lucide-react";

interface Integration {
  id: string;
  pageId: string;
  pageName: string;
  formIds: string[];
  isActive: boolean;
  lastSyncAt: Date | null;
  createdAt: Date;
}

interface FacebookIntegrationSettingsProps {
  integrations: Integration[];
}

export function FacebookIntegrationSettings({
  integrations,
}: FacebookIntegrationSettingsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get("step");
  const error = searchParams.get("error");
  const pagesParam = searchParams.get("pages");

  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    synced?: number;
    duplicates?: number;
    errors?: number;
  } | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Page selection state
  const [selectedPage, setSelectedPage] = useState<{
    id: string;
    name: string;
    token: string;
  } | null>(null);
  const [forms, setForms] = useState<{ id: string; name: string }[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [saving, setSaving] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  const oauthUrl = fbAppId
    ? `https://www.facebook.com/v21.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(`${appUrl}/api/integrations/facebook/callback`)}&scope=pages_show_list,leads_retrieval,pages_manage_ads`
    : null;

  // Parse pages from OAuth callback
  const pages = pagesParam
    ? (JSON.parse(decodeURIComponent(pagesParam)) as {
        id: string;
        name: string;
        token: string;
      }[])
    : [];

  const handleSelectPage = async (page: { id: string; name: string; token: string }) => {
    setSelectedPage(page);
    setLoadingForms(true);
    try {
      const pageForms = await getPageForms(page.id, page.token);
      setForms(pageForms);
      setSelectedForms(pageForms.map((f) => f.id));
    } catch {
      setForms([]);
    }
    setLoadingForms(false);
  };

  const handleSave = async () => {
    if (!selectedPage || selectedForms.length === 0) return;
    setSaving(true);
    const result = await saveFacebookIntegration({
      pageId: selectedPage.id,
      pageName: selectedPage.name,
      accessToken: selectedPage.token,
      formIds: selectedForms,
    });
    setSaving(false);
    if (result.success) {
      router.push("/settings/integrations/facebook");
      router.refresh();
    }
  };

  const handleSync = async (id: string) => {
    setSyncing(id);
    setSyncResult(null);
    const result = await triggerFacebookSync(id);
    setSyncResult(result);
    setSyncing(null);
    router.refresh();
  };

  const handleDisconnect = async (id: string) => {
    setDisconnecting(id);
    await disconnectFacebookIntegration(id);
    setDisconnecting(null);
    router.refresh();
  };

  // Error display
  if (error) {
    const errorMessages: Record<string, string> = {
      auth_denied: "Facebook authorization was denied.",
      no_pages: "No Facebook pages found. You need to manage at least one page.",
      auth_failed: "Failed to authenticate with Facebook. Please try again.",
    };

    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{errorMessages[error] || "An error occurred."}</p>
        </div>
        <button
          onClick={() => router.push("/settings/integrations/facebook")}
          className="mt-4 text-sm text-red-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Step: Select page from OAuth results
  if (step === "select-page" && pages.length > 0) {
    if (selectedPage && !loadingForms && forms.length >= 0) {
      // Show form selection
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Selected Page: {selectedPage.name}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Select which lead forms to sync
            </p>
            {forms.length === 0 ? (
              <p className="text-sm text-gray-500">
                No lead forms found on this page. Create a lead form in Facebook Ads Manager first.
              </p>
            ) : (
              <div className="space-y-2">
                {forms.map((form) => (
                  <label
                    key={form.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedForms.includes(form.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForms((prev) => [...prev, form.id]);
                        } else {
                          setSelectedForms((prev) => prev.filter((id) => id !== form.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-900">{form.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedPage(null)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedForms.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Connecting..." : "Connect Page"}
            </button>
          </div>
        </div>
      );
    }

    // Show page selection
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Select a Facebook Page</h3>
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => handleSelectPage(page)}
            disabled={loadingForms}
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900">{page.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">Page ID: {page.id}</p>
          </button>
        ))}
        {loadingForms && (
          <p className="text-sm text-gray-500">Loading forms...</p>
        )}
      </div>
    );
  }

  // Connected state - show integrations
  if (integrations.length > 0) {
    return (
      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Facebook className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {integration.pageName}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600">Connected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1 mb-4">
              <p>{integration.formIds.length} form(s) synced</p>
              <p>
                Last sync:{" "}
                {integration.lastSyncAt
                  ? formatRelativeTime(integration.lastSyncAt)
                  : "Never"}
              </p>
            </div>

            {syncResult && syncing === null && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-800">
                Synced {syncResult.synced} leads, {syncResult.duplicates} duplicates
                {syncResult.errors ? `, ${syncResult.errors} errors` : ""}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleSync(integration.id)}
                disabled={syncing === integration.id}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${syncing === integration.id ? "animate-spin" : ""}`}
                />
                {syncing === integration.id ? "Syncing..." : "Sync Now"}
              </button>
              <button
                onClick={() => handleDisconnect(integration.id)}
                disabled={disconnecting === integration.id}
                className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Unplug className="h-3.5 w-3.5" />
                {disconnecting === integration.id ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        ))}

        {oauthUrl && (
          <a
            href={oauthUrl}
            className="block text-center rounded-lg border border-gray-200 p-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            + Connect another page
          </a>
        )}
      </div>
    );
  }

  // Not connected state
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <Facebook className="h-7 w-7 text-blue-600" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connect Facebook Lead Ads
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
        Automatically import leads from your Facebook Lead Ad campaigns directly
        into your CRM. Supports real-time webhook and manual sync.
      </p>
      {oauthUrl ? (
        <a
          href={oauthUrl}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Facebook className="h-4 w-4" />
          Connect Facebook Account
        </a>
      ) : (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          Set <code>NEXT_PUBLIC_FACEBOOK_APP_ID</code> in your environment to enable
          Facebook integration.
        </div>
      )}
    </div>
  );
}
