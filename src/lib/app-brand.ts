const DEFAULT_APP_NAME = "HuffHealth";
const DEFAULT_APP_TAGLINE = "CRM & Client Portal";

export function getAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME?.trim() || DEFAULT_APP_NAME;
}

export function getAppTagline() {
  return process.env.NEXT_PUBLIC_APP_TAGLINE?.trim() || DEFAULT_APP_TAGLINE;
}

export function getAppInitials() {
  const name = getAppName();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
