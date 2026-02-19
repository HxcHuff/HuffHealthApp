import Papa from "papaparse";
import ExcelJS from "exceljs";

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export function parseCSVContent(content: string): ParsedFile {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });
  return {
    headers: result.meta.fields || [],
    rows: result.data as Record<string, string>[],
    totalRows: result.data.length,
  };
}

export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParsedFile> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const firstSheet = workbook.worksheets[0];
  if (!firstSheet || firstSheet.rowCount === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headerRow = firstSheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, string>[] = [];
  for (let i = 2; i <= firstSheet.rowCount; i++) {
    const row = firstSheet.getRow(i);
    const record: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      const value = cell.value == null ? "" : String(cell.value);
      record[header] = value;
      if (value) hasValue = true;
    });
    if (hasValue) rows.push(record);
  }

  return { headers, rows, totalRows: rows.length };
}

export type LeadMappableField =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "company"
  | "jobTitle"
  | "source"
  | "notes"
  | "disputeStatus"
  | "externalLeadId"
  | "orderId"
  | "received"
  | "fund"
  | "dateOfBirth"
  | "address"
  | "city"
  | "state"
  | "zipCode"
  | "price"
  | "insuranceType"
  | "planType"
  | "policyStatus"
  | "policyRenewalDate"
  | "lastReviewDate"
  | "followUpDate"
  | "lifeEvent";

export interface FieldMapping {
  csvColumn: string;
  leadField: LeadMappableField | "skip";
}

export const LEAD_FIELD_OPTIONS: { value: LeadMappableField | "skip"; label: string }[] = [
  { value: "skip", label: "-- Skip --" },
  { value: "disputeStatus", label: "Dispute Status" },
  { value: "externalLeadId", label: "Lead Id" },
  { value: "orderId", label: "Order Id" },
  { value: "received", label: "Received" },
  { value: "fund", label: "Fund" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "dateOfBirth", label: "Date of Birth" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Primary Phone" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zipCode", label: "Zip Code" },
  { value: "price", label: "Price" },
  { value: "company", label: "Company" },
  { value: "jobTitle", label: "Job Title" },
  { value: "source", label: "Source" },
  { value: "notes", label: "Notes" },
  { value: "insuranceType", label: "Insurance Type" },
  { value: "planType", label: "Plan Type" },
  { value: "policyStatus", label: "Policy Status" },
  { value: "policyRenewalDate", label: "Policy Renewal Date" },
  { value: "lastReviewDate", label: "Last Review Date" },
  { value: "followUpDate", label: "Follow-Up Date" },
  { value: "lifeEvent", label: "Life Event" },
];

const HEADER_ALIASES: Record<LeadMappableField, string[]> = {
  firstName: ["first_name", "firstname", "first name", "fname", "given name", "first"],
  lastName: ["last_name", "lastname", "last name", "lname", "surname", "family name", "last"],
  email: ["email", "email_address", "e-mail", "emailaddress", "email address"],
  phone: ["phone", "phone_number", "phonenumber", "telephone", "tel", "mobile", "cell", "primary phone", "primary_phone", "primaryphone"],
  company: ["company", "company_name", "companyname", "organization", "org", "business"],
  jobTitle: ["job_title", "jobtitle", "title", "position", "role", "job title"],
  source: ["source", "lead_source", "leadsource", "channel", "lead source", "utm_source"],
  notes: ["notes", "note", "comments", "description", "details"],
  disputeStatus: ["dispute_status", "disputestatus", "dispute status"],
  externalLeadId: ["lead_id", "leadid", "lead id", "external_lead_id"],
  orderId: ["order_id", "orderid", "order id", "order"],
  received: ["received", "received_date", "date_received"],
  fund: ["fund", "fund_name", "funding"],
  dateOfBirth: ["date_of_birth", "dateofbirth", "date of birth", "dob", "birthday", "birth_date", "birthdate"],
  address: ["address", "street", "street_address", "address1", "address_1"],
  city: ["city", "town"],
  state: ["state", "province", "region"],
  zipCode: ["zip_code", "zipcode", "zip code", "zip", "postal_code", "postalcode", "postal code"],
  price: ["price", "amount", "cost", "total", "value"],
  insuranceType: ["insurance_type", "insurancetype", "insurance type", "insurance", "coverage_type", "coverage type"],
  planType: ["plan_type", "plantype", "plan type", "plan", "plan_name", "plan name"],
  policyStatus: ["policy_status", "policystatus", "policy status"],
  policyRenewalDate: ["policy_renewal_date", "renewal_date", "renewaldate", "renewal date", "policy renewal date"],
  lastReviewDate: ["last_review_date", "lastreviewdate", "last review date", "review_date", "review date"],
  followUpDate: ["follow_up_date", "followupdate", "follow up date", "followup_date", "follow-up date"],
  lifeEvent: ["life_event", "lifeevent", "life event", "qualifying_event", "qualifying event"],
};

export function autoDetectMapping(headers: string[]): FieldMapping[] {
  return headers.map((header) => {
    const normalized = header.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(normalized)) {
        return { csvColumn: header, leadField: field as LeadMappableField };
      }
    }
    return { csvColumn: header, leadField: "skip" as const };
  });
}

export interface ImportResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errors: { row: number; error: string }[];
}
