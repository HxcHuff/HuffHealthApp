export const dynamic = "force-dynamic";

import { AuthProvider } from "@/providers/session-provider";
import { getAppName, getAppTagline } from "@/lib/app-brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const appName = getAppName();
  const appTagline = getAppTagline();

  return (
    <AuthProvider>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">{appName}</h1>
            <p className="text-sm text-gray-500 mt-1">{appTagline}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
