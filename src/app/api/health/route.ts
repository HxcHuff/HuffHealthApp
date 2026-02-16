import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const checks: Record<string, unknown> = {
    auth_secret: !!process.env.AUTH_SECRET,
    nextauth_secret: !!process.env.NEXTAUTH_SECRET,
    database_url: !!process.env.DATABASE_URL,
    auth_url: process.env.AUTH_URL || "not set",
    nextauth_url: process.env.NEXTAUTH_URL || "not set",
  };

  try {
    const userCount = await db.user.count();
    checks.db_connected = true;
    checks.user_count = userCount;
  } catch (e: unknown) {
    checks.db_connected = false;
    checks.db_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(checks);
}
