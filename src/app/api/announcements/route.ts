import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreateAnnouncementSchema } from "@/lib/validations/announcement";
import { notifyAnnouncement } from "@/lib/notifications";

export async function GET() {
  const announcements = await db.announcement.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });
  return NextResponse.json(announcements);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validated = CreateAnnouncementSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.flatten() }, { status: 400 });
  }

  const announcement = await db.announcement.create({
    data: {
      ...validated.data,
      authorId: session.user.id,
      publishedAt: validated.data.isPublished ? new Date() : null,
    },
  });

  if (announcement.isPublished) {
    void notifyAnnouncement({ announcementId: announcement.id });
  }

  return NextResponse.json(announcement, { status: 201 });
}
