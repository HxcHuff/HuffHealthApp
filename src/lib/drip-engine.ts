export async function syncToDripEngine(data: {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  zip_code?: string;
  plan_type?: string;
  lead_source?: string;
  crm_lead_id?: string;
  crm_contact_id?: string;
}): Promise<void> {
  const url = process.env.DRIP_ENGINE_URL;
  const apiKey = process.env.DRIP_ENGINE_API_KEY;

  if (!url) return;

  fetch(`${url}/api/webhook/intake`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    body: JSON.stringify(data),
  }).catch((err) => {
    console.error("[drip-engine] Sync failed:", err.message);
  });
}
