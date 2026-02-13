export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthProvider } from "@/providers/session-provider";
import { PortalHeader } from "@/components/layout/portal-header";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <PortalHeader user={session.user} />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </div>
    </AuthProvider>
  );
}
