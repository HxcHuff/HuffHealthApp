import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AGENT_BUSINESS_DEFAULT,
  AGENT_CONTACT_PHONE_DEFAULT,
  AGENT_NAME_DEFAULT,
  renderFirstTouchEmail,
  renderFirstTouchSms,
} from "../first-touch";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("AGENT_DISPLAY_NAME", "");
  vi.stubEnv("AGENT_BUSINESS_NAME", "");
  vi.stubEnv("AGENT_CONTACT_PHONE", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("renderFirstTouchSms", () => {
  it("is a short professional first-touch with office callback and STOP", () => {
    const sms = renderFirstTouchSms({ firstName: "Jane" });
    expect(sms).toContain("Jane");
    expect(sms).toContain(AGENT_NAME_DEFAULT);
    expect(sms).toContain(AGENT_BUSINESS_DEFAULT);
    expect(sms).toContain(AGENT_CONTACT_PHONE_DEFAULT);
    expect(sms).toContain("health insurance inquiry");
    expect(sms).toContain("Reply STOP to opt out.");
    expect(sms).not.toContain("No fluff. Just Huff.");
    expect(sms).not.toContain("+18632707035");
  });

  it("respects a custom agent name", () => {
    const sms = renderFirstTouchSms({
      firstName: "Pat",
      agentName: "Alex Rivera",
    });
    expect(sms).toContain("Alex Rivera");
  });
});

describe("renderFirstTouchEmail", () => {
  it("uses a professional subject and the same identity as SMS", () => {
    const email = renderFirstTouchEmail({ firstName: "Jane" });
    expect(email.subject).toBe("We received your health insurance inquiry");
    expect(email.text).toContain("Jane");
    expect(email.text).toContain(AGENT_NAME_DEFAULT);
    expect(email.text).toContain(AGENT_BUSINESS_DEFAULT);
    expect(email.text).toContain(AGENT_CONTACT_PHONE_DEFAULT);
    expect(email.html).toContain("Jane");
    expect(email.html).not.toContain("No fluff. Just Huff.");
    expect(email.text).not.toContain("No fluff. Just Huff.");
  });
});
