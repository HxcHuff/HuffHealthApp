import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { FieldMapping, ImportResult } from "@/lib/csv-parser";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { rows, mappings, listName, fileName, source } = body as {
    rows: Record<string, string>[];
    mappings: FieldMapping[];
    listName: string;
    fileName: string;
    source: string;
  };

  if (!rows || !mappings || !listName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const leadList = await db.leadList.create({
    data: {
      name: listName,
      fileName,
      source,
      totalRecords: rows.length,
      fieldMapping: mappings as object[],
      uploadedById: session.user.id,
    },
  });

  const activeMappings = mappings.filter((m) => m.leadField !== "skip");
  const result: ImportResult = {
    totalProcessed: rows.length,
    successCount: 0,
    failedCount: 0,
    errors: [],
  };

  const CHUNK_SIZE = 100;
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
        // Try to split a "name" or "full_name" field
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
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        createdById: session.user.id,
        leadListId: leadList.id,
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

  await db.leadList.update({
    where: { id: leadList.id },
    data: {
      importedCount: result.successCount,
      failedCount: result.failedCount,
    },
  });

  await db.activity.create({
    data: {
      type: "LEAD_IMPORTED",
      description: `Imported ${result.successCount} leads from "${listName}"`,
      performedById: session.user.id,
      metadata: {
        listId: leadList.id,
        totalProcessed: result.totalProcessed,
        successCount: result.successCount,
        failedCount: result.failedCount,
      },
    },
  });

  return NextResponse.json(result);
}
