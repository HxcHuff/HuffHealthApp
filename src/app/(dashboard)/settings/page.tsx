import { auth } from "@/auth";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Users, Bell, Facebook, User, ListFilter } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Link
          href="/settings/profile"
          className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profile</p>
              <p className="text-xs text-gray-500">{session?.user.email}</p>
            </div>
          </div>
        </Link>
        {isAdmin && (
          <Link
            href="/settings/users"
            className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">User Management</p>
                <p className="text-xs text-gray-500">Manage users and roles</p>
              </div>
            </div>
          </Link>
        )}
        <Link
          href="/settings/notifications"
          className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
              <Bell className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">Manage email notifications</p>
            </div>
          </div>
        </Link>
        {isAdmin && (
          <>
            <Link
              href="/settings/sources"
              className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <ListFilter className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Lead Sources</p>
                  <p className="text-xs text-gray-500">Add, edit, or remove sources</p>
                </div>
              </div>
            </Link>
            <Link
              href="/settings/integrations/facebook"
              className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Facebook className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Facebook Lead Ads</p>
                  <p className="text-xs text-gray-500">Connect your Facebook page</p>
                </div>
              </div>
            </Link>
          </>
        )}
      </div>
    </>
  );
}
