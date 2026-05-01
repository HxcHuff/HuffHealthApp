import { createHmac, timingSafeEqual } from "crypto";

export function validateTwilioSignature(params: {
  authToken: string;
  signatureHeader: string | null;
  url: string;
  body: Record<string, string>;
}): boolean {
  const { authToken, signatureHeader, url, body } = params;
  if (!signatureHeader) return false;

  const sortedKeys = Object.keys(body).sort();
  const data = sortedKeys.reduce((acc, key) => acc + key + body[key], url);

  const computed = createHmac("sha1", authToken).update(data).digest("base64");
  if (computed.length !== signatureHeader.length) return false;

  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "(none)";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 6) return "***";
  return `${phone.slice(0, 3)}***${digits.slice(-4)}`;
}
