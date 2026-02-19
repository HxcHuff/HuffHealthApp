"use client";

import { useEffect } from "react";

export default function LeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Leads page error:", error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
      <pre className="text-sm text-red-700 whitespace-pre-wrap break-words mb-4 bg-red-100 rounded-lg p-3">
        {error.message}
      </pre>
      {error.digest && (
        <p className="text-xs text-red-500 mb-4">Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
