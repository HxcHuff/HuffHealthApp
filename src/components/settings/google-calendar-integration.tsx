"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Unplug, AlertCircle } from "lucide-react";
import { disconnectGoogleCalendarIntegration } from "@/actions/google-calendar";

interface GoogleCalendarIntegrationProps {
  connection: {
    connected: boolean;
    email?: string;
    name?: string;
    connectedAt?: string;
  };
}

export function GoogleCalendarIntegration({ connection }: GoogleCalendarIntegrationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${appUrl}/api/integrations/google/calendar/callback`;
  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
  );

  const oauthUrl = googleClientId
    ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&access_type=offline&prompt=consent&scope=${scope}`
    : null;

  const errorMessages: Record<string, string> = {
    access_denied: "Google authorization was denied.",
    missing_code: "No authorization code was returned by Google.",
    missing_google_env: "Google OAuth environment variables are not configured.",
    token_exchange_failed: "Google token exchange failed.",
    userinfo_failed: "Could not read Google account details.",
    oauth_callback_failed: "Google OAuth callback failed.",
  };

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectGoogleCalendarIntegration();
      router.push("/settings/integrations/google-calendar");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {errorMessages[error] || "An unknown integration error occurred."}
          </div>
        </div>
      )}

      {success === "connected" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Google Calendar connected successfully.
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Agent Google Calendar</h2>
              <p className="text-xs text-gray-500">
                Connect each agent account to sync appointments and scheduling workflows.
              </p>
            </div>
          </div>
          {connection.connected ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              Connected
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
              Not Connected
            </span>
          )}
        </div>

        {connection.connected ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-700">
              Connected account: <span className="font-medium text-gray-900">{connection.email || connection.name || "Google Account"}</span>
            </p>
            <button
              type="button"
              onClick={handleDisconnect}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Unplug className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </div>
        ) : (
          <div className="mt-4">
            {oauthUrl ? (
              <a
                href={oauthUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <CalendarDays className="h-4 w-4" />
                Connect Google Calendar
              </a>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_ID</code>, and <code>GOOGLE_CLIENT_SECRET</code>.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
