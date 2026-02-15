"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/settings";
import { formatDate } from "@/lib/utils";

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    role: string;
    createdAt: string | Date;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateProfile({ name: name.trim(), email: email.trim() });

    if (result.error) {
      setMessage({ type: "error", text: typeof result.error === "string" ? result.error : "Failed to update" });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully" });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <input
          value={user.role}
          disabled
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Joined</label>
        <input
          value={formatDate(user.createdAt)}
          disabled
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
