import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSiteSettings } from "@/actions/site-settings";
import { PageHeader } from "@/components/shared/page-header";
import { LandingPageForm } from "@/components/settings/landing-page-form";

export default async function LandingPageSettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader title="Landing Page" />
      <div className="max-w-xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Website / Landing Page URL</h2>
          <p className="text-xs text-gray-500 mb-4">
            Set the URL for your landing page or website. This will appear in the sidebar for quick access.
          </p>
          <LandingPageForm currentUrl={settings?.landingPageUrl || ""} />
        </div>
      </div>
    </>
  );
}
