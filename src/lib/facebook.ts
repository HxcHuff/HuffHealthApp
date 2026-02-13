const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface FacebookFieldData {
  name: string;
  values: string[];
}

export interface FacebookLead {
  id: string;
  created_time: string;
  field_data: FacebookFieldData[];
  ad_id?: string;
  campaign_id?: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export interface FacebookForm {
  id: string;
  name: string;
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(
    `https://graph.facebook.com/oauth/access_token?${params}`
  );
  if (!res.ok) throw new Error("Failed to exchange code for token");
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getLongLivedToken(shortToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    fb_exchange_token: shortToken,
  });

  const res = await fetch(`${GRAPH_BASE_URL}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error("Failed to get long-lived token");
  const data = await res.json();
  return data.access_token;
}

export async function getPageAccessTokens(
  longLivedToken: string
): Promise<FacebookPage[]> {
  const res = await fetch(
    `${GRAPH_BASE_URL}/me/accounts?access_token=${longLivedToken}&fields=id,name,access_token`
  );
  if (!res.ok) throw new Error("Failed to get page access tokens");
  const data = await res.json();
  return data.data || [];
}

export async function getPageForms(
  pageId: string,
  pageAccessToken: string
): Promise<FacebookForm[]> {
  const res = await fetch(
    `${GRAPH_BASE_URL}/${pageId}/leadgen_forms?access_token=${pageAccessToken}&fields=id,name`
  );
  if (!res.ok) throw new Error("Failed to get page forms");
  const data = await res.json();
  return data.data || [];
}

export async function getFormLeads(
  formId: string,
  pageAccessToken: string,
  since?: Date
): Promise<FacebookLead[]> {
  const leads: FacebookLead[] = [];
  let url = `${GRAPH_BASE_URL}/${formId}/leads?access_token=${pageAccessToken}&fields=id,created_time,field_data,ad_id,campaign_id&limit=50`;

  if (since) {
    url += `&filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${Math.floor(since.getTime() / 1000)}}]`;
  }

  while (url) {
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    leads.push(...(data.data || []));
    url = data.paging?.next || "";
  }

  return leads;
}

export async function subscribePageToWebhook(
  pageId: string,
  pageAccessToken: string
): Promise<void> {
  const res = await fetch(
    `${GRAPH_BASE_URL}/${pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${pageAccessToken}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to subscribe page to webhook");
}

export async function fetchSingleLead(
  leadId: string,
  pageAccessToken: string
): Promise<FacebookLead | null> {
  const res = await fetch(
    `${GRAPH_BASE_URL}/${leadId}?access_token=${pageAccessToken}&fields=id,created_time,field_data,ad_id,campaign_id`
  );
  if (!res.ok) return null;
  return res.json();
}

// Map Facebook field_data to our Lead schema fields
const FIELD_MAP: Record<string, string> = {
  email: "email",
  phone_number: "phone",
  full_name: "fullName",
  first_name: "firstName",
  last_name: "lastName",
  company_name: "company",
  job_title: "jobTitle",
};

export function mapFacebookLeadToLead(fbLead: FacebookLead) {
  const mapped: Record<string, string | null> = {
    firstName: "",
    lastName: "",
    email: null,
    phone: null,
    company: null,
    jobTitle: null,
  };
  const customFields: Record<string, string> = {};

  for (const field of fbLead.field_data) {
    const value = field.values[0] || "";
    const mappedField = FIELD_MAP[field.name];

    if (mappedField === "fullName") {
      const parts = value.split(" ");
      mapped.firstName = parts[0] || "";
      mapped.lastName = parts.slice(1).join(" ") || "";
    } else if (mappedField) {
      mapped[mappedField] = value || null;
    } else {
      customFields[field.name] = value;
    }
  }

  // Store Facebook-specific metadata
  if (fbLead.ad_id) customFields.fb_ad_id = fbLead.ad_id;
  if (fbLead.campaign_id) customFields.fb_campaign_id = fbLead.campaign_id;
  customFields.fb_lead_id = fbLead.id;
  customFields.fb_created_time = fbLead.created_time;

  return {
    firstName: mapped.firstName || "Unknown",
    lastName: mapped.lastName || "",
    email: mapped.email,
    phone: mapped.phone,
    company: mapped.company,
    jobTitle: mapped.jobTitle,
    source: "Facebook Lead Ad",
    customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
  };
}
