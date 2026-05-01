import twilio, { Twilio } from "twilio";

export interface TwilioEnv {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  conversationsServiceSid: string;
  messagingServiceSid?: string;
  webhookBaseUrl?: string;
}

let cached: Twilio | null = null;

export function isDryRun(): boolean {
  return process.env.LEAD_PIPELINE_DRY_RUN === "true";
}

export function readTwilioEnv(): TwilioEnv | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;
  const conversationsServiceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const webhookBaseUrl = process.env.TWILIO_WEBHOOK_BASE_URL;

  if (!accountSid || !authToken || !phoneNumber || !conversationsServiceSid) {
    return null;
  }

  return {
    accountSid,
    authToken,
    phoneNumber,
    conversationsServiceSid,
    messagingServiceSid,
    webhookBaseUrl,
  };
}

export function getTwilioClient(): Twilio {
  if (cached) return cached;
  const env = readTwilioEnv();
  if (!env) {
    throw new Error(
      "Twilio not configured: requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (or TWILIO_FROM_NUMBER), TWILIO_CONVERSATIONS_SERVICE_SID",
    );
  }
  cached = twilio(env.accountSid, env.authToken);
  return cached;
}

export function isTwilioConfigured(): boolean {
  return readTwilioEnv() !== null;
}

export function resetTwilioClientCache(): void {
  cached = null;
}
