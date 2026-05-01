"use client";

import { useState } from "react";
import { TCPA_DISCLOSURE_TEXT } from "@/lib/consent";

interface ConsentCaptureProps {
  /** Hidden field name for the form (defaults to tcpa_consent) */
  name?: string;
  /** Optional callback when consent state changes */
  onChange?: (checked: boolean, text: string) => void;
  required?: boolean;
}

export function ConsentCapture({
  name = "tcpa_consent",
  onChange,
  required = true,
}: ConsentCaptureProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <label className="flex items-start gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          name={name}
          required={required}
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
            onChange?.(e.target.checked, TCPA_DISCLOSURE_TEXT);
          }}
          className="mt-0.5"
        />
        <span>{TCPA_DISCLOSURE_TEXT}</span>
      </label>
      <input type="hidden" name="tcpa_consent_text" value={TCPA_DISCLOSURE_TEXT} />
      <input
        type="hidden"
        name="tcpa_timestamp"
        value={checked ? new Date().toISOString() : ""}
      />
    </div>
  );
}

interface ConsentBadgeProps {
  state: "valid" | "inbound_only" | "revoked" | "none" | "medicare";
  className?: string;
}

const BADGE_STYLES: Record<ConsentBadgeProps["state"], { color: string; label: string }> = {
  valid: { color: "bg-green-100 text-green-800", label: "TCPA consent valid" },
  inbound_only: {
    color: "bg-yellow-100 text-yellow-800",
    label: "Inbound-only consent",
  },
  revoked: { color: "bg-red-100 text-red-800", label: "Consent revoked" },
  none: { color: "bg-red-100 text-red-800", label: "No consent on file" },
  medicare: { color: "bg-blue-100 text-blue-800", label: "Medicare — SOA required" },
};

export function ConsentBadge({ state, className }: ConsentBadgeProps) {
  const style = BADGE_STYLES[state];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.color} ${className ?? ""}`}
    >
      {style.label}
    </span>
  );
}
