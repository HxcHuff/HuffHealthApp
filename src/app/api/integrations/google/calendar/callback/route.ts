import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import type { Prisma } from "@/generated/prisma/client";

type UserPrefs = Record<string, unknown>;

export async function GET(request: Request) {
  const session = await auth();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/integrations/google-calendar?error=${encodeURIComponent(error)}`, appUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings/integrations/google-calendar?error=missing_code", appUrl)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/integrations/google/calendar/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/settings/integrations/google-calendar?error=missing_google_env", appUrl)
    );
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        new URL("/settings/integrations/google-calendar?error=token_exchange_failed", appUrl)
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
      token_type: string;
    };

    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        new URL("/settings/integrations/google-calendar?error=userinfo_failed", appUrl)
      );
    }

    const userInfo = (await userInfoResponse.json()) as { email?: string; name?: string };
    const nowIso = new Date().toISOString();

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPreferences: true },
    });
    const prefs = ((user?.notificationPreferences as UserPrefs | null) || {}) as UserPrefs;

    const encryptedAccessToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null;

    const nextPrefs: UserPrefs = {
      ...prefs,
      googleCalendar: {
        connected: true,
        email: userInfo.email || null,
        name: userInfo.name || null,
        connectedAt: nowIso,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiryEpochMs: Date.now() + tokenData.expires_in * 1000,
        scope: tokenData.scope,
      },
    };

    await db.user.update({
      where: { id: session.user.id },
      data: { notificationPreferences: nextPrefs as Prisma.InputJsonValue },
    });

    return NextResponse.redirect(new URL("/settings/integrations/google-calendar?success=connected", appUrl));
  } catch {
    return NextResponse.redirect(
      new URL("/settings/integrations/google-calendar?error=oauth_callback_failed", appUrl)
    );
  }
}
