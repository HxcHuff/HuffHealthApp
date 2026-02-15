"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { ROLE_OPTIONS } from "@/lib/constants";
import { UserPlus, Ban, Check, Copy, CheckCheck } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { assignedLeads: number; assignedTickets: number };
}

interface Props {
  users: UserRow[];
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function UserManagement({ users }: Props) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPassword] = useState(generateTempPassword);
  const [createdUser, setCreatedUser] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreateUser(formData: FormData) {
    setLoading(true);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: tempPassword, role }),
    });

    if (res.ok) {
      setShowCreateForm(false);
      setCreatedUser({ name, email, password: tempPassword });
      router.refresh();
    }
    setLoading(false);
  }

  async function copyCredentials() {
    if (!createdUser) return;
    await navigator.clipboard.writeText(
      `Email: ${createdUser.email}\nTemporary Password: ${createdUser.password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleActive(userId: string, isActive: boolean) {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  async function changeRole(userId: string, role: string) {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setCreatedUser(null); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          Invite Team Member
        </button>
      </div>

      {/* Credentials display after creation */}
      {createdUser && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="text-sm font-semibold text-green-900 mb-2">
            Team member created successfully
          </h3>
          <p className="text-sm text-green-800 mb-3">
            Share these credentials with <strong>{createdUser.name}</strong>:
          </p>
          <div className="rounded-lg bg-white border border-green-200 p-3 font-mono text-sm space-y-1">
            <p>Email: {createdUser.email}</p>
            <p>Temporary Password: {createdUser.password}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={copyCredentials}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Credentials"}
            </button>
            <button
              onClick={() => setCreatedUser(null)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Invite Team Member</h3>
          <form action={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                name="name"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                defaultValue="STAFF"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temp Password</label>
              <input
                value={tempPassword}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Auto-generated. Share with the user.</p>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create & Invite"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Leads</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Tickets</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Joined</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                  {user._count.assignedLeads}
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                  {user._count.assignedTickets}
                </td>
                <td className="px-4 py-3">
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      <Ban className="h-3 w-3" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                  {formatRelativeTime(user.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleActive(user.id, user.isActive)}
                    className={`text-xs font-medium ${
                      user.isActive
                        ? "text-red-600 hover:text-red-700"
                        : "text-green-600 hover:text-green-700"
                    }`}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
