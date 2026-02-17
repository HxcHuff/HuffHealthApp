export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthProvider } from "@/providers/session-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { getSiteSettings } from "@/actions/site-settings";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role === "CLIENT") redirect("/portal");

  const siteSettings = await getSiteSettings();

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar role={session.user.role} landingPageUrl={siteSettings?.landingPageUrl} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav user={session.user} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
