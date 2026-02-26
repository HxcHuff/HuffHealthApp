import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type ExportType = "leads" | "clients";

const CSV_COLUMNS = [
  "id",
  "firstName",
  "lastName",
  "email",
  "phone",
  "source",
  "status",
  "assignedTo",
  "insuranceType",
  "policyStatus",
  "policyRenewalDate",
  "followUpDate",
  "createdAt",
  "updatedAt",
] as const;

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\r?\n/g, " ");
  if (/[",]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((row) => CSV_COLUMNS.map((col) => escapeCsv(row[col])).join(","));
  return [header, ...lines].join("\n");
}

function getFileName(type: ExportType): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${type}-${date}.csv`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const typeParam = request.nextUrl.searchParams.get("type");
  const type: ExportType = typeParam === "clients" ? "clients" : "leads";
  const statusFilter = type === "clients" ? "ENROLLED" : undefined;

  const records = await db.lead.findMany({
    where: statusFilter ? { status: statusFilter } : { status: { not: "ENROLLED" } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      source: true,
      status: true,
      insuranceType: true,
      policyStatus: true,
      policyRenewalDate: true,
      followUpDate: true,
      createdAt: true,
      updatedAt: true,
      assignedTo: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const rows = records.map((record) => ({
    ...record,
    assignedTo: record.assignedTo
      ? `${record.assignedTo.name} <${record.assignedTo.email}>`
      : "",
    policyRenewalDate: record.policyRenewalDate?.toISOString() ?? "",
    followUpDate: record.followUpDate?.toISOString() ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }));

  const csv = toCsv(rows as Array<Record<string, unknown>>);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${getFileName(type)}\"`,
      "Cache-Control": "no-store",
    },
  });
}
