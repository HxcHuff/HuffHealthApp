import { describe, it, expect } from "vitest";
import {
  classifyLineOfBusiness,
  renderSpeedToLeadSms,
  renderAdminAlertSms,
} from "../sms-templates";

describe("classifyLineOfBusiness", () => {
  it("groups Medicare variants together", () => {
    expect(classifyLineOfBusiness("MEDICARE_SUPPLEMENT")).toBe("MEDICARE");
    expect(classifyLineOfBusiness("MEDICARE_ADVANTAGE")).toBe("MEDICARE");
    expect(classifyLineOfBusiness("PART_D")).toBe("MEDICARE");
  });

  it("groups ACA-adjacent under ACA", () => {
    expect(classifyLineOfBusiness("ACA")).toBe("ACA");
    expect(classifyLineOfBusiness("SHORT_TERM")).toBe("ACA");
    expect(classifyLineOfBusiness("GROUP")).toBe("ACA");
  });

  it("falls back to GENERIC when no insurance type", () => {
    expect(classifyLineOfBusiness(null)).toBe("GENERIC");
    expect(classifyLineOfBusiness(undefined)).toBe("GENERIC");
  });
});

describe("renderSpeedToLeadSms", () => {
  it("includes the lead's first name and a STOP footer", () => {
    const sms = renderSpeedToLeadSms({ firstName: "Jane" });
    expect(sms).toContain("Jane");
    expect(sms).toContain("Reply STOP to opt out.");
  });

  it("uses the ACA template for ACA leads", () => {
    const sms = renderSpeedToLeadSms({
      firstName: "Jane",
      insuranceType: "ACA",
    });
    expect(sms).toContain("subsidy-eligible");
  });

  it("mentions the qualifying event when present on ACA leads", () => {
    const sms = renderSpeedToLeadSms({
      firstName: "Jane",
      insuranceType: "ACA",
      qualifyingEvent: "Lost employer coverage",
    });
    expect(sms).toContain("Lost employer coverage");
    expect(sms).toContain("Special Enrollment");
  });

  it("uses the Medicare template for Medicare leads", () => {
    const sms = renderSpeedToLeadSms({
      firstName: "Bob",
      insuranceType: "MEDICARE_ADVANTAGE",
    });
    expect(sms).toContain("Medicare");
    expect(sms).toContain("Advantage");
  });

  it("uses the dental/vision template", () => {
    const sms = renderSpeedToLeadSms({
      firstName: "Sue",
      insuranceType: "DENTAL_VISION",
    });
    expect(sms).toContain("dental/vision");
  });

  it("uses the life template", () => {
    const sms = renderSpeedToLeadSms({
      firstName: "Tim",
      insuranceType: "LIFE",
    });
    expect(sms).toContain("life insurance");
  });

  it("uses the generic template when no insurance type is set", () => {
    const sms = renderSpeedToLeadSms({ firstName: "Pat" });
    expect(sms).toContain("Pat");
    expect(sms).toContain("5-min call");
  });

  it("respects a custom agent name", () => {
    const sms = renderSpeedToLeadSms({
      firstName: "Pat",
      agentName: "Sarah at Huff",
    });
    expect(sms).toContain("Sarah at Huff");
  });
});

describe("renderAdminAlertSms", () => {
  it("flags HOT leads with a flame", () => {
    const msg = renderAdminAlertSms({
      firstName: "Jane",
      lastName: "Doe",
      sourceCategory: "PAID",
      priority: "HOT",
      leadId: "lead-123",
    });
    expect(msg.startsWith("🔥")).toBe(true);
    expect(msg).toContain("HOT");
    expect(msg).toContain("Jane Doe");
  });

  it("does not flame WARM/COLD leads", () => {
    const msg = renderAdminAlertSms({
      firstName: "Jane",
      lastName: "Doe",
      sourceCategory: "ORGANIC",
      priority: "WARM",
      leadId: "lead-123",
    });
    expect(msg.startsWith("🔥")).toBe(false);
    expect(msg).toContain("WARM");
  });

  it("includes phone, email, and a deep link", () => {
    const msg = renderAdminAlertSms({
      firstName: "Jane",
      lastName: "Doe",
      phone: "+18635551234",
      email: "jane@example.com",
      sourceCategory: "PAID",
      priority: "HOT",
      leadId: "lead-123",
      appUrl: "https://crm.example.com",
    });
    expect(msg).toContain("+18635551234");
    expect(msg).toContain("jane@example.com");
    expect(msg).toContain("https://crm.example.com/leads/lead-123");
  });
});
