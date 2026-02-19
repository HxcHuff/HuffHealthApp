import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { FieldMapping, ImportResult } from "@/lib/csv-parser";
import type { InsuranceType, PolicyStatus } from "@/generated/prisma/client";

const VALID_INSURANCE_TYPES: InsuranceType[] = ["ACA", "MEDICARE_SUPPLEMENT", "MEDICARE_ADVANTAGE", "PART_D", "GROUP", "SHORT_TERM", "DENTAL_VISION", "LIFE", "OTHER"];
const VALID_POLICY_STATUSES: PolicyStatus[] = ["ACTIVE", "GRACE_PERIOD", "LAPSED", "CANCELLED", "PENDING"];

export const maxDuration = 25; // Netlify Pro allows up to 26s

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const {
    rows,
    mappings,
    listName,
    fileName,
    source,
    listId: existingListId,
    batchNumber = 1,
    totalBatches = 1,
    totalRows,
    initialStatus,
  } = body as {
    rows: Record<string, string>[];
    mappings: FieldMapping[];
    listName: string;
    fileName: string;
    source: string;
    listId?: string;
    batchNumber?: number;
    totalBatches?: number;
    totalRows?: number;
    initialStatus?: string;
  };

  if (!rows || !mappings || !listName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // On first batch, create the lead list. On subsequent batches, reuse it.
  let listId = existingListId;
  if (!listId) {
    const leadList = await db.leadList.create({
      data: {
        name: listName,
        fileName,
        source,
        totalRecords: totalRows || rows.length,
        fieldMapping: mappings as object[],
        uploadedById: session.user.id,
      },
    });
    listId = leadList.id;
  }

  const activeMappings = mappings.filter((m) => m.leadField !== "skip");
  const result: ImportResult & { listId: string } = {
    totalProcessed: rows.length,
    successCount: 0,
    failedCount: 0,
    errors: [],
    listId,
  };

  // Process this batch — rows are already a manageable size (75 from frontend)
  // But we still chunk DB inserts for safety
  const CHUNK_SIZE = 50;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const leadsToCreate: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      company?: string;
      jobTitle?: string;
      source?: string;
      notes?: string;
      disputeStatus?: string;
      externalLeadId?: string;
      orderId?: string;
      received?: string;
      fund?: string;
      dateOfBirth?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      price?: string;
      insuranceType?: InsuranceType;
      planType?: string;
      policyStatus?: PolicyStatus;
      policyRenewalDate?: Date;
      lastReviewDate?: Date;
      followUpDate?: Date;
      lifeEvent?: string;
      customFields?: object;
      createdById: string;
      leadListId: string;
    }[] = [];

    for (let j = 0; j < chunk.length; j++) {
      const row = chunk[j];
      const rowIndex = i + j + 1;

      const lead: Record<string, string> = {};
      const customFields: Record<string, string> = {};

      for (const mapping of activeMappings) {
        const value = row[mapping.csvColumn]?.trim() || "";
        if (value) {
          lead[mapping.leadField] = value;
        }
      }

      // Collect unmapped non-empty fields into customFields
      for (const [key, value] of Object.entries(row)) {
        const isMapped = activeMappings.some((m) => m.csvColumn === key);
        if (!isMapped && value?.trim()) {
          customFields[key] = value.trim();
        }
      }

      if (!lead.firstName && !lead.lastName) {
        const fullName = lead.firstName || row["name"] || row["full_name"] || row["Name"] || "";
        if (fullName) {
          const parts = fullName.trim().split(/\s+/);
          lead.firstName = parts[0] || "Unknown";
          lead.lastName = parts.slice(1).join(" ") || "Unknown";
        } else {
          result.failedCount++;
          result.errors.push({ row: rowIndex, error: "Missing first name and last name" });
          continue;
        }
      }

      if (!lead.firstName) lead.firstName = "Unknown";
      if (!lead.lastName) lead.lastName = "Unknown";

      // Parse insurance type (normalize to enum value)
      const rawInsuranceType = lead.insuranceType?.toUpperCase().replace(/[\s/]+/g, "_");
      const insuranceType = VALID_INSURANCE_TYPES.find(t => t === rawInsuranceType) || undefined;

      // Parse policy status (normalize to enum value)
      const rawPolicyStatus = lead.policyStatus?.toUpperCase().replace(/[\s]+/g, "_");
      const policyStatus = VALID_POLICY_STATUSES.find(s => s === rawPolicyStatus) || undefined;

      // Parse dates
      const parseDate = (val?: string): Date | undefined => {
        if (!val) return undefined;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d;
      };

      leadsToCreate.push({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        company: lead.company || undefined,
        jobTitle: lead.jobTitle || undefined,
        source: lead.source || source || undefined,
        notes: lead.notes || undefined,
        disputeStatus: lead.disputeStatus || undefined,
        externalLeadId: lead.externalLeadId || undefined,
        orderId: lead.orderId || undefined,
        received: lead.received || undefined,
        fund: lead.fund || undefined,
        dateOfBirth: lead.dateOfBirth || undefined,
        address: lead.address || undefined,
        city: lead.city || undefined,
        state: lead.state || undefined,
        zipCode: lead.zipCode || undefined,
        price: lead.price || undefined,
        insuranceType,
        planType: lead.planType || undefined,
        policyStatus,
        policyRenewalDate: parseDate(lead.policyRenewalDate),
        lastReviewDate: parseDate(lead.lastReviewDate),
        followUpDate: parseDate(lead.followUpDate),
        lifeEvent: lead.lifeEvent || undefined,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        ...(initialStatus === "ENROLLED" ? { status: "ENROLLED" as const } : {}),
        createdById: session.user.id,
        leadListId: listId,
      });
    }

    if (leadsToCreate.length > 0) {
      try {
        const created = await db.lead.createMany({
          data: leadsToCreate,
          skipDuplicates: true,
        });
        result.successCount += created.count;
      } catch (batchError) {
        console.error("Batch insert failed:", batchError);
        // Fall back to individual inserts on batch failure
        for (const leadData of leadsToCreate) {
          try {
            await db.lead.create({ data: leadData });
            result.successCount++;
          } catch (individualError) {
            console.error("Individual insert failed:", individualError);
            result.failedCount++;
            result.errors.push({
              row: 0,
              error: `Failed to import ${leadData.firstName} ${leadData.lastName}: ${individualError instanceof Error ? individualError.message : "Unknown error"}`,
            });
          }
        }
      }
    }
  }

  // On the last batch, update the list totals and log activity
  if (batchNumber === totalBatches) {
    try {
      // Get cumulative counts from all leads in this list
      const totalImported = await db.lead.count({ where: { leadListId: listId } });
      await db.leadList.update({
        where: { id: listId },
        data: {
          importedCount: totalImported,
          failedCount: (totalRows || rows.length) - totalImported,
        },
      });

      await db.activity.create({
        data: {
          type: "LEAD_IMPORTED",
          description: `Imported ${totalImported} ${initialStatus === "ENROLLED" ? "clients" : "leads"} from "${listName}"`,
          performedById: session.user.id,
          metadata: {
            listId,
            totalProcessed: totalRows || rows.length,
            successCount: totalImported,
          },
        },
      });
    } catch (finalizeError) {
      console.error("Failed to finalize import:", finalizeError);
      // Don't fail the whole request — the leads are already imported
    }
  }

  return NextResponse.json(result);
}
