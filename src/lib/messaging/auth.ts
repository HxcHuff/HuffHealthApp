import { NextRequest } from "next/server";

export function isMessagingAuthorized(req: NextRequest): boolean {
  const expectedKey = process.env.DRIP_ENGINE_API_KEY;
  const providedKey = req.headers.get("x-api-key");

  // In production, require a configured key and exact match.
  if (process.env.NODE_ENV === "production") {
    return !!expectedKey && !!providedKey && expectedKey === providedKey;
  }

  // In non-production, if key is configured, enforce it. If not configured, allow local bootstrapping.
  if (expectedKey) {
    return providedKey === expectedKey;
  }
  return true;
}
