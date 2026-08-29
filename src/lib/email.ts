import { Resend } from "resend";
import { getOutboundSkipReason } from "@/lib/outbound";

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS?.trim() ||
  "HuffHealth CRM <notifications@huffhealth.com>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  status:
    | "sent"
    | "skipped_outbound_disabled"
    | "skipped_dry_run"
    | "skipped_no_credentials"
    | "failed";
  error?: string;
}

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<SendEmailResult> {
  const skip = getOutboundSkipReason();
  if (skip) {
    console.info(`[email] ${skip} to=${to} subject=${JSON.stringify(subject)}`);
    return { status: skip };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping email to:", to);
    return { status: "skipped_no_credentials" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    return { status: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to send email:", error);
    return { status: "failed", error: message };
  }
}
