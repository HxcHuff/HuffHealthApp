import { createHash } from "node:crypto";

export interface MailchimpEnv {
  apiKey: string;
  serverPrefix: string;
  audienceId: string;
}

export function isDryRun(): boolean {
  return process.env.LEAD_PIPELINE_DRY_RUN === "true";
}

/**
 * Mailchimp API keys end with `-usX` where `usX` is the data center / server
 * prefix used in the API host. Allow an explicit override via env, otherwise
 * derive it from the key suffix.
 */
function deriveServerPrefix(apiKey: string, override?: string): string | null {
  if (override) return override;
  const dash = apiKey.lastIndexOf("-");
  if (dash === -1) return null;
  const suffix = apiKey.slice(dash + 1).trim();
  return suffix.length > 0 ? suffix : null;
}

export function readMailchimpEnv(): MailchimpEnv | null {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  const serverPrefix = deriveServerPrefix(
    apiKey ?? "",
    process.env.MAILCHIMP_SERVER_PREFIX,
  );

  if (!apiKey || !audienceId || !serverPrefix) {
    return null;
  }

  return { apiKey, serverPrefix, audienceId };
}

export function isMailchimpConfigured(): boolean {
  return readMailchimpEnv() !== null;
}

export function mailchimpBaseUrl(env: MailchimpEnv): string {
  return `https://${env.serverPrefix}.api.mailchimp.com/3.0`;
}

/**
 * Mailchimp identifies subscribers by the MD5 hash of the lowercased email.
 */
export function subscriberHash(email: string): string {
  return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

export function mailchimpAuthHeader(env: MailchimpEnv): string {
  const token = Buffer.from(`anystring:${env.apiKey}`).toString("base64");
  return `Basic ${token}`;
}

export interface MailchimpFetchResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function mailchimpFetch<T>(
  env: MailchimpEnv,
  path: string,
  init: RequestInit & { method: string },
): Promise<MailchimpFetchResult<T>> {
  const url = `${mailchimpBaseUrl(env)}${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: mailchimpAuthHeader(env),
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    if (res.status === 204) {
      return { ok: true, status: res.status };
    }

    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : undefined;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: `HTTP ${res.status}`,
      };
    }
    return { ok: true, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
