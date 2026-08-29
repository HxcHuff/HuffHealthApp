import { describe, it, expect } from "vitest";
import { mapFacebookLeadToLead } from "../facebook";

describe("mapFacebookLeadToLead", () => {
  it("does not invent TCPA consent for Facebook Lead Ads", () => {
    const mapped = mapFacebookLeadToLead({
      id: "fb-1",
      created_time: "2026-04-27T12:00:00Z",
      field_data: [
        { name: "first_name", values: ["Jane"] },
        { name: "last_name", values: ["Doe"] },
        { name: "email", values: ["jane@example.com"] },
        { name: "phone_number", values: ["8635551234"] },
      ],
    });

    expect(mapped.source).toBe("fb_lead_ad");
    expect(mapped.tcpaConsent).toBe(false);
    expect(mapped.firstName).toBe("Jane");
    expect(mapped.email).toBe("jane@example.com");
  });
});
