import { describe, it, expect } from "vitest";
import { classifyLead } from "../lead-router";

describe("classifyLead", () => {
  it("classifies fb_lead_ad as HOT/PAID", () => {
    expect(classifyLead({ source: "fb_lead_ad" })).toEqual({
      sourceCategory: "PAID",
      priority: "HOT",
    });
  });

  it("classifies google ads UTM as HOT/PAID even with website_form source", () => {
    expect(
      classifyLead({ source: "website_form", utmSource: "google" }),
    ).toEqual({ sourceCategory: "PAID", priority: "HOT" });
  });

  it("classifies referrals as HOT/REFERRAL", () => {
    expect(classifyLead({ source: "referral" })).toEqual({
      sourceCategory: "REFERRAL",
      priority: "HOT",
    });
    expect(classifyLead({ source: "bni" })).toEqual({
      sourceCategory: "REFERRAL",
      priority: "HOT",
    });
  });

  it("classifies organic search as WARM/ORGANIC", () => {
    expect(
      classifyLead({ source: "website_form", utmSource: "organic" }),
    ).toEqual({ sourceCategory: "ORGANIC", priority: "WARM" });
  });

  it("classifies bare website_form as WARM/DIRECT", () => {
    expect(classifyLead({ source: "website_form" })).toEqual({
      sourceCategory: "DIRECT",
      priority: "WARM",
    });
  });

  it("classifies manual entries as WARM/DIRECT", () => {
    expect(classifyLead({ source: "manual" })).toEqual({
      sourceCategory: "DIRECT",
      priority: "WARM",
    });
  });

  it("falls back to COLD/OTHER for unknown sources", () => {
    expect(
      classifyLead({ source: "mystery_source", utmSource: "weird" }),
    ).toEqual({ sourceCategory: "OTHER", priority: "COLD" });
  });

  it("is case-insensitive on UTM source", () => {
    expect(
      classifyLead({ source: "website_form", utmSource: "GOOGLE" }),
    ).toEqual({ sourceCategory: "PAID", priority: "HOT" });
  });

  it("treats empty/null inputs as OTHER/COLD", () => {
    expect(classifyLead({})).toEqual({
      sourceCategory: "OTHER",
      priority: "COLD",
    });
  });
});
