/**
 * First-touch copy for a new health-insurance inquiry.
 * Previewable in tests. Do not add the banned slogan "No fluff. Just Huff."
 *
 * 863-640-3102 is the office callback number printed in the message.
 * The Twilio sender is always TWILIO_FROM_NUMBER (never hardcoded).
 */

export const AGENT_NAME_DEFAULT = "David Huff";
export const AGENT_BUSINESS_DEFAULT = "Lakeland Health Insurance";
export const AGENT_CONTACT_PHONE_DEFAULT = "863-640-3102";
export const STOP_FOOTER = "Reply STOP to opt out.";

export interface FirstTouchContext {
  firstName: string;
  agentName?: string;
  businessName?: string;
  contactPhone?: string;
}

function resolveCtx(ctx: FirstTouchContext) {
  return {
    firstName: ctx.firstName.trim() || "there",
    agentName: ctx.agentName?.trim() || process.env.AGENT_DISPLAY_NAME?.trim() || AGENT_NAME_DEFAULT,
    businessName:
      ctx.businessName?.trim() ||
      process.env.AGENT_BUSINESS_NAME?.trim() ||
      AGENT_BUSINESS_DEFAULT,
    contactPhone:
      ctx.contactPhone?.trim() ||
      process.env.AGENT_CONTACT_PHONE?.trim() ||
      AGENT_CONTACT_PHONE_DEFAULT,
  };
}

export function renderFirstTouchSms(ctx: FirstTouchContext): string {
  const { firstName, agentName, businessName, contactPhone } = resolveCtx(ctx);
  return [
    `Hi ${firstName}, this is ${agentName} with ${businessName}.`,
    "I received your health insurance inquiry and I am happy to help.",
    `Call or text ${contactPhone} anytime.`,
    STOP_FOOTER,
  ].join(" ");
}

export function renderFirstTouchEmail(ctx: FirstTouchContext): {
  subject: string;
  html: string;
  text: string;
} {
  const { firstName, agentName, businessName, contactPhone } = resolveCtx(ctx);
  const subject = "We received your health insurance inquiry";
  const text = [
    `Hi ${firstName},`,
    "",
    `Thank you for reaching out about health insurance. I am ${agentName} with ${businessName}, and I will help you review your options.`,
    "",
    `You can reach me at ${contactPhone}.`,
    "",
    `— ${agentName}`,
    businessName,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.5;">
        Thank you for reaching out about health insurance. I am ${escapeHtml(agentName)} with
        ${escapeHtml(businessName)}, and I will help you review your options.
      </p>
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        You can reach me at <strong>${escapeHtml(contactPhone)}</strong>.
      </p>
      <p style="margin:24px 0 0;color:#374151;font-size:16px;">
        — ${escapeHtml(agentName)}<br>
        ${escapeHtml(businessName)}
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
