export interface MessageTemplate {
  id: string;
  category: "first_touch" | "enrollment" | "documents" | "appointment" | "follow_up";
  label: string;
  body: string;
}

const STOP_FOOTER = "Reply STOP to opt out.";

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "first_touch_facebook",
    category: "first_touch",
    label: "First Touch — Facebook",
    body: `Hi {firstName}, thanks for reaching out about health insurance! I'm David Huff, a licensed broker here in Lakeland. I can help you find the best plan for your situation. When's a good time to chat? ${STOP_FOOTER}`,
  },
  {
    id: "first_touch_website",
    category: "first_touch",
    label: "First Touch — Website",
    body: `Hi {firstName}, I got your request from lakelandhealthinsurance.com. I specialize in finding the right ACA or Medicare plan for folks in {city}. I'll give you a call shortly — or reply here if you prefer texting. ${STOP_FOOTER}`,
  },
  {
    id: "enrollment_confirmed",
    category: "enrollment",
    label: "Enrollment Confirmed",
    body: `Great news, {firstName}! Your {planType} enrollment is confirmed with {carrierName}. Your coverage starts {effectiveDate}. I'll send you a summary shortly. Save this number — I'm your broker year-round.`,
  },
  {
    id: "documents_request",
    category: "documents",
    label: "Document Request",
    body: `Hi {firstName}, to complete your enrollment I'll need: {documentList}. You can text photos of these documents directly to this number, or email them to dhuff@healthmarkets.com. Let me know if you have questions.`,
  },
  {
    id: "appointment_scheduling",
    category: "appointment",
    label: "Schedule a Call",
    body: `Hi {firstName}, when works best for a 15-minute call this week? I have openings Tue/Wed/Thu — let me know what fits.`,
  },
  {
    id: "follow_up_no_response",
    category: "follow_up",
    label: "Follow-up — No Response",
    body: `Hi {firstName}, just checking back. I'm still happy to help you sort out your coverage options whenever you're ready — text or call anytime.`,
  },
];

export function applyTemplateVariables(
  template: string,
  vars: Record<string, string | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    return vars[key] ?? `{${key}}`;
  });
}

export function smsSegmentCount(body: string): number {
  // GSM-7 single segment is 160 chars; concatenated 153 per segment.
  // Unicode (UCS-2) is 70 / 67. We approximate by checking for non-ASCII.
  const isUnicode = /[^\x00-\x7F]/.test(body);
  const single = isUnicode ? 70 : 160;
  const concat = isUnicode ? 67 : 153;
  if (body.length <= single) return 1;
  return Math.ceil(body.length / concat);
}
