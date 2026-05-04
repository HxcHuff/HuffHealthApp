import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { randomUUID, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { routeLeadAsync } from "@/lib/lead-router";
import { recordConsent, TCPA_DISCLOSURE_TEXT } from "@/lib/consent";

const GoogleColumnSchema = z.object({
  column_id: z.string().optional(),
  column_name: z.string().optional(),
  string_value: z.string().optional(),
});

const GoogleLeadPayloadSchema = z.object({
  lead_id: z.string().min(1),
  api_version: z.string().optional(),
  form_id: z.union([z.string(), z.number()]).optional(),
  campaign_id: z.union([z.string(), z.number()]).optional(),
  gcl_id: z.string().optional(),
  google_key: z.string().min(1),
  is_test: z.boolean().optional(),
  user_column_data: z.array(GoogleColumnSchema).default([]),
});

type GoogleLeadPayload = z.infer<typeof GoogleLeadPayloadSchema>;

interface NormalizedLead {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  zip?: string;
  campaign?: string;
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    const buf = Buffer.from(a);
    timingSafeEqual(buf, buf);
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function valueFor(payload: GoogleLeadPayload, names: string[]): string | undefined {
  const lookup = new Set(names.map((n) => n.toUpperCase()));
  for (const col of payload.user_column_data) {
    const name = (col.column_name ?? col.column_id ?? "").toUpperCase();
    if (lookup.has(name) && col.string_value && col.string_value.trim()) {
      return col.string_value.trim();
    }
  }
  return undefined;
}

function splitFullName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function normalize(payload: GoogleLeadPayload): { ok: true; data: NormalizedLead } | { ok: false; error: string } {
  const first =
    valueFor(payload, ["FIRST_NAME", "GIVEN_NAME"]) ??
    (() => {
      const full = valueFor(payload, ["FULL_NAME", "NAME"]);
      return full ? splitFullName(full).first : undefined;
    })();

  const last =
    valueFor(payload, ["LAST_NAME", "FAMILY_NAME"]) ??
    (() => {
      const full = valueFor(payload, ["FULL_NAME", "NAME"]);
      return full ? splitFullName(full).last : undefined;
    })();

  const email = valueFor(payload, ["EMAIL", "USER_EMAIL", "WORK_EMAIL"]);
  const rawPhone = valueFor(payload, ["PHONE_NUMBER", "WORK_PHONE", "USER_PHONE"]);
  const zipRaw = valueFor(payload, ["POSTAL_CODE", "ZIP_CODE", "ZIP"]);

  if (!first) return { ok: false, error: "missing first name" };
  if (!email) return { ok: false, error: "missing email" };
  if (!rawPhone) return { ok: false, error: "missing phone" };

  const parsedPhone = parsePhoneNumberFromString(rawPhone, "US");
  if (!parsedPhone || !parsedPhone.isValid()) {
    return { ok: false, error: "invalid phone number" };
  }

  const emailParse = z.string().email().safeParse(email);
  if (!emailParse.success) return { ok: false, error: "invalid email" };

  const zip = zipRaw && /^\d{5}$/.test(zipRaw) ? zipRaw : undefined;
  const campaign = payload.campaign_id != null ? String(payload.campaign_id) : undefined;

  return {
    ok: true,
    data: {
      firstName: first,
      lastName: last ?? "",
      email,
      phoneE164: parsedPhone.format("E.164"),
      zip,
      campaign,
    },
  };
}

async function getSystemUserId(): Promise<string> {
  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) throw new Error("No admin user found for Google lead webhook");
  return admin.id;
}

export async function POST(req: NextRequest) {
  const correlationId = randomUUID();

  const expectedKey = process.env.GOOGLE_LEAD_WEBHOOK_KEY;
  if (!expectedKey) {
    console.error(`[google-leads] [${correlationId}] GOOGLE_LEAD_WEBHOOK_KEY not configured`);
    return NextResponse.json({ error: "Not configured", correlationId }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.error(`[google-leads] [${correlationId}] Invalid JSON body`);
    return NextResponse.json({ error: "Invalid JSON body", correlationId }, { status: 400 });
  }

  const parsed = GoogleLeadPayloadSchema.safeParse(body);
  if (!parsed.success) {
    console.error(
      `[google-leads] [${correlationId}] Schema validation failed`,
      parsed.error.flatten().fieldErrors,
    );
    return NextResponse.json(
      { error: "Invalid payload", fields: parsed.error.flatten().fieldErrors, correlationId },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (!constantTimeCompare(payload.google_key, expectedKey)) {
    console.error(`[google-leads] [${correlationId}] google_key mismatch for lead_id=${payload.lead_id}`);
    return NextResponse.json({ error: "Unauthorized", correlationId }, { status: 401 });
  }

  if (payload.is_test === true) {
    console.info(`[google-leads] [${correlationId}] Test ping accepted (lead_id=${payload.lead_id})`);
    return NextResponse.json({ ok: true, test: true, correlationId }, { status: 200 });
  }

  const normalized = normalize(payload);
  if (!normalized.ok) {
    console.error(`[google-leads] [${correlationId}] Normalization failed: ${normalized.error}`);
    return NextResponse.json(
      { error: "Validation failed", reason: normalized.error, correlationId },
      { status: 400 },
    );
  }

  const data = normalized.data;
  const formId = payload.form_id != null ? String(payload.form_id) : undefined;

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existing = await db.lead.findFirst({
      where: {
        AND: [
          { createdAt: { gte: thirtyDaysAgo } },
          { OR: [{ phone: data.phoneE164 }, { email: data.email }] },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      await db.$transaction([
        db.lead.update({
          where: { id: existing.id },
          data: { lastTouchAt: new Date() },
        }),
        db.leadEvent.create({
          data: {
            leadId: existing.id,
            type: "DUPLICATE_SUBMISSION",
            payload: {
              source: "google_lead_form",
              googleLeadId: payload.lead_id,
              formId: formId ?? null,
              campaignId: data.campaign ?? null,
              submittedAt: new Date().toISOString(),
            },
          },
        }),
      ]);

      console.info(`[google-leads] [${correlationId}] Duplicate lead: ${existing.id}`);
      return NextResponse.json(
        { lead_id: existing.id, duplicate: true, correlationId },
        { status: 200 },
      );
    }

    const systemUserId = await getSystemUserId();

    const lead = await db.lead.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phoneE164,
        email: data.email,
        zipCode: data.zip,
        source: "google_lead_form",
        campaign: data.campaign,
        utmSource: "google",
        utmCampaign: data.campaign,
        externalLeadId: payload.lead_id,
        tcpaConsent: true,
        tcpaConsentText: TCPA_DISCLOSURE_TEXT,
        tcpaTimestamp: new Date(),
        status: "NEW_LEAD",
        lastTouchAt: new Date(),
        createdById: systemUserId,
        leadEvents: {
          create: {
            type: "CREATED",
            payload: {
              source: "google_lead_form",
              googleLeadId: payload.lead_id,
              formId: formId ?? null,
              campaignId: data.campaign ?? null,
              ingestCorrelationId: correlationId,
            },
          },
        },
      },
      select: { id: true },
    });

    console.info(`[google-leads] [${correlationId}] Created lead: ${lead.id}`);

    try {
      await recordConsent({
        leadId: lead.id,
        consentType: "TCPA_EXPRESS_WRITTEN",
        consentMethod: "WEB_FORM",
        consentText: TCPA_DISCLOSURE_TEXT,
        source: "google_lead_form",
        metadata: {
          googleLeadId: payload.lead_id,
          formId: formId ?? null,
          campaignId: data.campaign ?? null,
          ingestCorrelationId: correlationId,
        },
      });
    } catch (consentErr) {
      console.error(`[google-leads] [${correlationId}] Failed to record consent`, consentErr);
    }

    routeLeadAsync(lead.id);

    return NextResponse.json(
      { lead_id: lead.id, duplicate: false, correlationId },
      { status: 200 },
    );
  } catch (err) {
    console.error(`[google-leads] [${correlationId}] DB error`, err);
    return NextResponse.json(
      { error: "Internal server error", correlationId },
      { status: 500 },
    );
  }
}
