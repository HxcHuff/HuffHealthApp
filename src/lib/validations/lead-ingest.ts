import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const LEAD_SOURCES = [
  "fb_lead_ad",
  "website_form",
  "fb_traffic",
  "google_lead_form",
  "leadconnect",
  "purchased",
  "referral",
  "bni",
  "manual",
] as const;

const phoneE164 = z
  .string()
  .transform((val, ctx) => {
    const parsed = parsePhoneNumberFromString(val, "US");
    if (!parsed || !parsed.isValid()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid phone number. Must be a valid US phone number.",
      });
      return z.NEVER;
    }
    return parsed.format("E.164");
  });

export const LeadIngestSchema = z.object({
  source: z.enum(LEAD_SOURCES),
  campaign: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: phoneE164,
  email: z.string().email("Invalid email address"),
  zip: z
    .string()
    .regex(/^\d{5}$/, "ZIP must be exactly 5 digits")
    .optional(),
  household_size: z.number().int().positive("Must be a positive integer").optional(),
  estimated_income: z.number().positive("Must be a positive number").optional(),
  qualifying_event: z.string().optional(),
  tcpa_consent: z.boolean(),
  tcpa_consent_text: z.string().optional(),
  tcpa_timestamp: z.string().datetime("Must be a valid ISO 8601 datetime").optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.tcpa_consent) {
    if (!data.tcpa_consent_text?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tcpa_consent_text"],
        message: "TCPA consent text is required when consent is true",
      });
    }
    if (!data.tcpa_timestamp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tcpa_timestamp"],
        message: "TCPA timestamp is required when consent is true",
      });
    }
  }
});

export type LeadIngestInput = z.infer<typeof LeadIngestSchema>;
