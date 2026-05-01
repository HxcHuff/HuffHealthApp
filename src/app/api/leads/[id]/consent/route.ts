import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getConsentHistory,
  getCurrentConsentStatus,
  recordConsent,
  revokeConsent,
  TCPA_DISCLOSURE_TEXT,
} from "@/lib/consent";
import type { ConsentMethod, ConsentType } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const [history, status] = await Promise.all([
    getConsentHistory(id),
    getCurrentConsentStatus(id),
  ]);
  return NextResponse.json({
    success: true,
    leadId: id,
    status,
    history,
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    consentType?: ConsentType;
    consentMethod?: ConsentMethod;
    consentText?: string;
    consentGiven?: boolean;
    revoke?: boolean;
    reason?: string;
  };

  if (body.revoke) {
    const result = await revokeConsent({
      leadId: id,
      reason: body.reason ?? `manual revoke by ${session.user.name ?? session.user.email}`,
      source: "agent_ui",
    });
    return NextResponse.json({ success: true, log: result });
  }

  if (!body.consentType || !body.consentMethod) {
    return NextResponse.json(
      { error: "consentType and consentMethod are required" },
      { status: 400 },
    );
  }

  const log = await recordConsent({
    leadId: id,
    consentType: body.consentType,
    consentMethod: body.consentMethod,
    consentText: body.consentText ?? TCPA_DISCLOSURE_TEXT,
    consentGiven: body.consentGiven ?? true,
    source: "agent_ui",
    metadata: { recordedBy: session.user.email },
  });

  return NextResponse.json({ success: true, log });
}
