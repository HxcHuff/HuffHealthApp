import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getLongLivedToken, getPageAccessTokens } from "@/lib/facebook";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/integrations/facebook/callback`;

  if (error || !code) {
    return NextResponse.redirect(
      `${appUrl}/settings/integrations/facebook?error=auth_denied`
    );
  }

  try {
    // Exchange code for short-lived token
    const { access_token: shortToken } = await exchangeCodeForToken(code, redirectUri);

    // Exchange for long-lived token
    const longLivedToken = await getLongLivedToken(shortToken);

    // Get pages the user manages
    const pages = await getPageAccessTokens(longLivedToken);

    if (pages.length === 0) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations/facebook?error=no_pages`
      );
    }

    // Encode pages data in query params (temporary - for the setup flow)
    const pagesData = encodeURIComponent(
      JSON.stringify(
        pages.map((p) => ({
          id: p.id,
          name: p.name,
          token: p.access_token,
        }))
      )
    );

    return NextResponse.redirect(
      `${appUrl}/settings/integrations/facebook?step=select-page&pages=${pagesData}`
    );
  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    return NextResponse.redirect(
      `${appUrl}/settings/integrations/facebook?error=auth_failed`
    );
  }
}
