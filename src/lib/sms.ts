export interface SendSmsOptions {
  to: string;
  body: string;
}

export interface SendSmsResult {
  status: "sent" | "skipped_dry_run" | "skipped_no_credentials" | "failed";
  sid?: string;
  error?: string;
}

function isDryRun(): boolean {
  return process.env.LEAD_PIPELINE_DRY_RUN === "true";
}

export async function sendSms({ to, body }: SendSmsOptions): Promise<SendSmsResult> {
  if (isDryRun()) {
    console.info(`[sms] DRY_RUN to=${to} body=${JSON.stringify(body)}`);
    return { status: "skipped_dry_run" };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || (!messagingServiceSid && !from)) {
    console.warn(`[sms] Twilio credentials not configured, skipping SMS to ${to}`);
    return { status: "skipped_no_credentials" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const params = new URLSearchParams({ To: to, Body: body });
  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else if (from) {
    params.set("From", from);
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[sms] Twilio error ${res.status}: ${text}`);
      return { status: "failed", error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as { sid?: string };
    return { status: "sent", sid: data.sid };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[sms] Twilio request failed:", error);
    return { status: "failed", error };
  }
}
