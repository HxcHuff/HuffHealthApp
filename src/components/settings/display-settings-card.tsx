"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "huff-theme";

function applyTheme(preference: ThemePreference) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = preference === "dark" || (preference === "system" && systemDark);
  document.documentElement.classList.toggle("dark", useDark);
  document.documentElement.style.colorScheme = useDark ? "dark" : "light";
}

export function DisplaySettingsCard() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });

  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (preference === "system") applyTheme("system");
    };
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [preference]);

  function handleSelect(nextPreference: ThemePreference) {
    setPreference(nextPreference);
    localStorage.setItem(STORAGE_KEY, nextPreference);
    applyTheme(nextPreference);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
          <Monitor className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Display Settings</p>
          <p className="text-xs text-gray-500">Choose how the app should look.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => handleSelect("light")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            preference === "light"
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          <Sun className="h-4 w-4" />
          Light
        </button>
        <button
          type="button"
          onClick={() => handleSelect("dark")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            preference === "dark"
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          <Moon className="h-4 w-4" />
          Dark
        </button>
        <button
          type="button"
          onClick={() => handleSelect("system")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            preference === "system"
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          <Monitor className="h-4 w-4" />
          System
        </button>
      </div>
    </div>
  );
}
