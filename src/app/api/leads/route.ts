import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type {
  LeadStatus,
  LeadPriority,
  LeadSourceCategory,
} from "@/generated/prisma/client";

const VALID_STATUSES: LeadStatus[] = [
  "NEW_LEAD",
  "CONTACTED",
  "QUOTED",
  "APPLICATION_SENT",
  "ENROLLED",
  "LOST",
];
const VALID_PRIORITIES: LeadPriority[] = ["HOT", "WARM", "COLD"];
const VALID_SOURCE_CATEGORIES: LeadSourceCategory[] = [
  "PAID",
  "ORGANIC",
  "REFERRAL",
  "DIRECT",
  "OTHER",
];

function parseEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const n = value ? parseInt(value, 10) : NaN;
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = parseEnum(searchParams.get("status"), VALID_STATUSES);
  const priority = parseEnum(searchParams.get("priority"), VALID_PRIORITIES);
  const sourceCategory = parseEnum(
    searchParams.get("sourceCategory"),
    VALID_SOURCE_CATEGORIES,
  );
  const assignedToId = searchParams.get("assignedToId") ?? undefined;
  const search = searchParams.get("q")?.trim();
  const limit = clampInt(searchParams.get("limit"), 50, 1, 200);
  const cursor = searchParams.get("cursor") ?? undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (sourceCategory) where.sourceCategory = sourceCategory;
  if (assignedToId) where.assignedToId = assignedToId;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const leads = await db.lead.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      zipCode: true,
      status: true,
      priority: true,
      sourceCategory: true,
      source: true,
      campaign: true,
      utmSource: true,
      utmCampaign: true,
      insuranceType: true,
      assignedToId: true,
      routedAt: true,
      speedToLeadAt: true,
      lastTouchAt: true,
      createdAt: true,
    },
  });

  const hasMore = leads.length > limit;
  const items = hasMore ? leads.slice(0, limit) : leads;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}
