import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendOutboundMessage } from "@/lib/twilio/outbound";
import { ConsentRequiredError } from "@/lib/twilio/compliance";
import { buildEnrollmentLinkMessage, buildEnrollmentUrl } from "@/lib/healthsherpa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ sid: string }> },
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { sid } = await ctx.params;
  const conversation = await db.conversation.findUnique({
    where: { twilioConversationSid: sid },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          zipCode: true,
          insuranceType: true,
        },
      },
    },
  });
  if (!conversation || !conversation.lead) {
    return NextResponse.json({ error: "Conversation or lead not found" }, { status: 404 });
  }
  const lead = conversation.lead;

  const url = buildEnrollmentUrl({
    firstName: lead.firstName,
    lastName: lead.lastName,
    zipCode: lead.zipCode,
    email: lead.email,
    phone: lead.phone,
    insuranceType: lead.insuranceType,
    agentId: process.env.HEALTHSHERPA_AGENT_ID,
    agentEmail: process.env.HEALTHSHERPA_MEDICARE_AGENT_EMAIL,
  });

  const body = buildEnrollmentLinkMessage({ firstName: lead.firstName, enrollmentUrl: url });

  try {
    const result = await sendOutboundMessage({
      conversationSid: sid,
      body,
      author: session.user.name ?? "Agent",
      isReplyToInbound: true,
    });
    await db.activity.create({
      data: {
        type: "EMAIL",
        description: `Sent enrollment link via SMS: ${url}`,
        leadId: lead.id,
        performedById: session.user.id,
        metadata: { url, conversationSid: sid },
      },
    });
    return NextResponse.json({ success: true, url, ...result });
  } catch (err) {
    if (err instanceof ConsentRequiredError) {
      return NextResponse.json({ error: `Compliance: ${err.reasons.join(", ")}` }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 },
    );
  }
}
