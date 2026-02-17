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

function dripHeaders(): Record<string, string> {
  const apiKey = process.env.DRIP_ENGINE_API_KEY;
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { "x-api-key": apiKey } : {}),
  };
}

export type DripContact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  zip_code: string;
  plan_type: string;
  lead_source: string;
  tags: string[];
  opted_in_channels: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DripSequence = {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  segment_ids: string[];
  steps: { id: string; order: number; channel: string; template_id: string; delay_minutes: number }[];
};

export async function getDripContact(email: string): Promise<DripContact | null> {
  const url = process.env.DRIP_ENGINE_URL;
  if (!url) return null;

  try {
    const res = await fetch(`${url}/api/contacts`, { headers: dripHeaders() });
    if (!res.ok) return null;
    const contacts: DripContact[] = await res.json();
    return contacts.find((c) => c.email === email) || null;
  } catch {
    return null;
  }
}

export async function getDripSequences(): Promise<DripSequence[]> {
  const url = process.env.DRIP_ENGINE_URL;
  if (!url) return [];

  try {
    const res = await fetch(`${url}/api/sequences`, { headers: dripHeaders() });
    if (!res.ok) return [];
    const sequences: DripSequence[] = await res.json();
    return sequences.filter((s) => s.is_active);
  } catch {
    return [];
  }
}

export async function autoEnrollByStatus(email: string, newStatus: string): Promise<void> {
  const { DRIP_STATUS_SEQUENCE_MAP } = await import("@/lib/constants");
  const sequenceName = DRIP_STATUS_SEQUENCE_MAP[newStatus];
  if (!sequenceName) return;

  try {
    const sequences = await getDripSequences();
    const match = sequences.find(
      (s) => s.name.toLowerCase() === sequenceName.toLowerCase()
    );
    if (!match) return;

    const contact = await getDripContact(email);
    if (!contact) return;

    await syncToDripEngine({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      zip_code: contact.zip_code,
      plan_type: contact.plan_type,
      lead_source: contact.lead_source,
    });
  } catch (err) {
    console.error("[drip-engine] Auto-enroll failed:", (err as Error).message);
  }
}

export async function enrollInSequence(contactEmail: string, sequenceId: string): Promise<boolean> {
  const url = process.env.DRIP_ENGINE_URL;
  if (!url) return false;

  try {
    // Re-sync contact through intake to trigger auto-enrollment
    // The intake endpoint handles enrollment based on matching segments
    const contact = await getDripContact(contactEmail);
    if (!contact) return false;

    const res = await fetch(`${url}/api/webhook/intake`, {
      method: "POST",
      headers: dripHeaders(),
      body: JSON.stringify({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        zip_code: contact.zip_code,
        plan_type: contact.plan_type,
        lead_source: contact.lead_source,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
