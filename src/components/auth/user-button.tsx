"use client";

import { useState, useRef, useEffect } from "react";
import { logout } from "@/actions/auth";
import { getInitials } from "@/lib/utils";
import { LogOut, User, ChevronDown } from "lucide-react";

interface UserButtonProps {
  name: string;
  email: string;
  role: string;
}

export function UserButton({ name, email, role }: UserButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
          {getInitials(name)}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500 capitalize">{role.toLowerCase()}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="h-4 w-4" />
              Profile
            </button>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
