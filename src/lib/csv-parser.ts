import Papa from "papaparse";
import * as XLSX from "xlsx";

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

export function parseExcelBuffer(buffer: ArrayBuffer): ParsedFile {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, {
    defval: "",
  });
  const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
  return {
    headers,
    rows: jsonData,
    totalRows: jsonData.length,
  };
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
  | "price";

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
