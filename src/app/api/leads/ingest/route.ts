import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LeadIngestSchema } from "@/lib/validations/lead-ingest";
import { randomUUID } from "crypto";
import { timingSafeEqual } from "crypto";

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against self to avoid timing leak on length mismatch
    const buf = Buffer.from(a);
    timingSafeEqual(buf, buf);
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function verifyAuth(req: NextRequest): boolean {
  const secret = process.env.LEAD_INGEST_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const token = header.slice(7);
  return constantTimeCompare(token, secret);
}

async function getSystemUserId(): Promise<string> {
  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) throw new Error("No admin user found for lead ingest");
  return admin.id;
}

export async function POST(req: NextRequest) {
  const correlationId = randomUUID();

  // Auth check
  if (!verifyAuth(req)) {
    console.error(`[lead-ingest] [${correlationId}] Unauthorized request`);
    return NextResponse.json(
      { error: "Unauthorized", correlationId },
      { status: 401 }
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.error(`[lead-ingest] [${correlationId}] Invalid JSON body`);
    return NextResponse.json(
      { error: "Invalid JSON body", correlationId },
      { status: 400 }
    );
  }

  // Validate
  const result = LeadIngestSchema.safeParse(body);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    console.error(
      `[lead-ingest] [${correlationId}] Validation failed`,
      fieldErrors
    );
    return NextResponse.json(
      { error: "Validation failed", fields: fieldErrors, correlationId },
      { status: 400 }
    );
  }

  const data = result.data;

  try {
    // Dedupe: check for existing lead with same phone or email in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existing = await db.lead.findFirst({
      where: {
        AND: [
          { createdAt: { gte: thirtyDaysAgo } },
          {
            OR: [
              { phone: data.phone },
              { email: data.email },
            ],
          },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      // Duplicate: update lastTouchAt and log event
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
              source: data.source,
              campaign: data.campaign ?? null,
              utmSource: data.utm_source ?? null,
              utmCampaign: data.utm_campaign ?? null,
              utmContent: data.utm_content ?? null,
              ipAddress: data.ip_address ?? null,
              submittedAt: new Date().toISOString(),
            },
          },
        }),
      ]);

      console.info(
        `[lead-ingest] [${correlationId}] Duplicate lead detected: ${existing.id}`
      );
      return NextResponse.json(
        { leadId: existing.id, duplicate: true, correlationId },
        { status: 200 }
      );
    }

    // New lead
    const systemUserId = await getSystemUserId();

    const lead = await db.lead.create({
      data: {
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        email: data.email,
        zipCode: data.zip,
        householdSize: data.household_size,
        estimatedIncome: data.estimated_income,
        qualifyingEvent: data.qualifying_event,
        source: data.source,
        campaign: data.campaign,
        utmSource: data.utm_source,
        utmCampaign: data.utm_campaign,
        utmContent: data.utm_content,
        tcpaConsent: data.tcpa_consent,
        tcpaConsentText: data.tcpa_consent_text,
        tcpaTimestamp: new Date(data.tcpa_timestamp),
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        status: "NEW_LEAD",
        lastTouchAt: new Date(),
        createdById: systemUserId,
        leadEvents: {
          create: {
            type: "CREATED",
            payload: {
              source: data.source,
              campaign: data.campaign ?? null,
              ingestCorrelationId: correlationId,
            },
          },
        },
      },
      select: { id: true },
    });

    console.info(
      `[lead-ingest] [${correlationId}] Created lead: ${lead.id}`
    );
    return NextResponse.json(
      { leadId: lead.id, duplicate: false, correlationId },
      { status: 201 }
    );
  } catch (err) {
    console.error(`[lead-ingest] [${correlationId}] DB error`, err);
    return NextResponse.json(
      { error: "Internal server error", correlationId },
      { status: 500 }
    );
  }
}
