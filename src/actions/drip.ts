"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  getDripContact,
  getDripSequences,
  syncToDripEngine,
  enrollInSequence,
  type DripContact,
  type DripSequence,
} from "@/lib/drip-engine";

export async function getDripStatus(email: string): Promise<DripContact | null> {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) return null;
  return getDripContact(email);
}

export async function getAvailableSequences(): Promise<DripSequence[]> {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) return [];
  return getDripSequences();
}

export async function syncToDrip(
  type: "lead" | "contact",
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    if (type === "lead") {
      const lead = await db.lead.findUnique({ where: { id } });
      if (!lead) return { success: false, error: "Lead not found" };
      if (!lead.email) return { success: false, error: "Lead has no email" };

      await syncToDripEngine({
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email,
        phone: lead.phone || undefined,
        zip_code: lead.zipCode || undefined,
        lead_source: lead.source || undefined,
        crm_lead_id: lead.id,
      });
    } else {
      const contact = await db.contact.findUnique({ where: { id } });
      if (!contact) return { success: false, error: "Contact not found" };

      await syncToDripEngine({
        first_name: contact.firstName,
        last_name: contact.lastName,
        email: contact.email,
        phone: contact.phone || undefined,
        zip_code: contact.zipCode || undefined,
        crm_contact_id: contact.id,
      });
    }

    return { success: true };
  } catch {
    return { success: false, error: "Sync failed" };
  }
}

export async function enrollInDripSequence(
  email: string,
  sequenceId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await enrollInSequence(email, sequenceId);
  return result ? { success: true } : { success: false, error: "Enrollment failed" };
}
