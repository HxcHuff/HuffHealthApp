export interface EnrollmentLinkInput {
  firstName?: string | null;
  lastName?: string | null;
  zipCode?: string | null;
  email?: string | null;
  phone?: string | null;
  insuranceType?: string | null;
  agentId?: string;
  agentEmail?: string;
}

const BASE_URL = "https://www.healthsherpa.com";
const QUOTECONNECT_BASE = "https://www.quoteconnect.com";

export function buildEnrollmentUrl(input: EnrollmentLinkInput): string {
  const isMedicare = input.insuranceType?.startsWith("MEDICARE") || input.insuranceType === "PART_D";
  const base = isMedicare ? QUOTECONNECT_BASE : BASE_URL;
  const params = new URLSearchParams();
  if (input.agentId) params.set("_agent_id", input.agentId);
  if (input.firstName) params.set("first_name", input.firstName);
  if (input.lastName) params.set("last_name", input.lastName);
  if (input.zipCode) params.set("zip", input.zipCode);
  if (input.email) params.set("email", input.email);
  if (input.phone) params.set("phone", input.phone);
  return `${base}/?${params.toString()}`;
}

export function buildDocumentRequestMessage(args: {
  firstName: string;
  documentList: string;
  agentEmail?: string;
}): string {
  const email = args.agentEmail ?? "dhuff@healthmarkets.com";
  return `Hi ${args.firstName}, to complete your enrollment I'll need: ${args.documentList}. You can text photos of these documents directly to this number, or email them to ${email}. Let me know if you have questions.`;
}

export function buildEnrollmentLinkMessage(args: {
  firstName: string;
  enrollmentUrl: string;
}): string {
  return `Hi ${args.firstName}, here's your personalized enrollment link to review and select your plan: ${args.enrollmentUrl} — I'll walk you through it if you need help. Just call or text me.`;
}
