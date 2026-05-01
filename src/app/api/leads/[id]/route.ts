import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const PatchSchema = z.object({
  status: z
    .enum(["NEW_LEAD", "CONTACTED", "QUOTED", "APPLICATION_SENT", "ENROLLED", "LOST"])
    .optional(),
  priority: z.enum(["HOT", "WARM", "COLD"]).optional(),
  assignedToId: z.string().nullable().optional(),
  notes: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      leadEvents: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const before = await db.lead.findUnique({
    where: { id },
    select: { status: true, priority: true, assignedToId: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = parsed.data;
  const stageChanged = data.status && data.status !== before.status;

  const updated = await db.lead.update({
    where: { id },
    data: {
      ...data,
      ...(stageChanged ? { stageEnteredAt: new Date() } : {}),
      lastTouchAt: new Date(),
    },
  });

  if (stageChanged) {
    await db.leadEvent.create({
      data: {
        leadId: id,
        type: "STAGE_CHANGED",
        payload: {
          from: before.status,
          to: data.status,
          actorId: session.user.id,
        },
      },
    });
  }

  return NextResponse.json({ lead: updated });
}
