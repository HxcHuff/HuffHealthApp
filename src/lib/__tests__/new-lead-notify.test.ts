import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendSms = vi.fn();
const sendEmail = vi.fn();
const getCurrentConsentStatus = vi.fn();
const findUniqueOrThrow = vi.fn();
const consentLogFindFirst = vi.fn();

vi.mock("@/lib/sms", () => ({ sendSms: (...args: unknown[]) => sendSms(...args) }));
vi.mock("@/lib/email", () => ({ sendEmail: (...args: unknown[]) => sendEmail(...args) }));
vi.mock("@/lib/consent", () => ({
  getCurrentConsentStatus: (...args: unknown[]) => getCurrentConsentStatus(...args),
}));
vi.mock("@/lib/db", () => ({
  db: {
    lead: { findUniqueOrThrow: (...args: unknown[]) => findUniqueOrThrow(...args) },
    consentLog: { findFirst: (...args: unknown[]) => consentLogFindFirst(...args) },
  },
}));

import {
  evaluateSmsConsent,
  evaluateEmailConsent,
  isUntrustedSmsSource,
  notifyNewLead,
} from "../new-lead-notify";

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead-1",
    firstName: "Jane",
    lastName: "Doe",
    phone: "+18635551234",
    email: "jane@example.com",
    source: "website_form",
    tcpaConsent: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  getCurrentConsentStatus.mockResolvedValue({ state: "valid", log: { id: "c1" } });
  consentLogFindFirst.mockResolvedValue(null);
  sendSms.mockResolvedValue({ status: "skipped_outbound_disabled" });
  sendEmail.mockResolvedValue({ status: "skipped_outbound_disabled" });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isUntrustedSmsSource", () => {
  it("flags Google Ads, LeadConnect, and purchased sources", () => {
    expect(isUntrustedSmsSource("google_lead_form")).toBe(true);
    expect(isUntrustedSmsSource("leadconnect")).toBe(true);
    expect(isUntrustedSmsSource("purchased")).toBe(true);
    expect(isUntrustedSmsSource("website_form")).toBe(false);
    expect(isUntrustedSmsSource("fb_lead_ad")).toBe(false);
  });
});

describe("evaluateSmsConsent", () => {
  it("blocks SMS when consent is missing", async () => {
    getCurrentConsentStatus.mockResolvedValue({ state: "none", log: null });
    const result = await evaluateSmsConsent(
      lead({ tcpaConsent: false }) as never,
    );
    expect(result).toEqual({ ok: false, reason: "no_tcpa_consent" });
  });

  it("blocks Google Ads even if the lead boolean is true", async () => {
    getCurrentConsentStatus.mockResolvedValue({ state: "none", log: null });
    const result = await evaluateSmsConsent(
      lead({ source: "google_lead_form", tcpaConsent: true }) as never,
    );
    expect(result).toEqual({ ok: false, reason: "untrusted_source_no_consent" });
  });

  it("allows SMS when a ConsentLog documents TCPA on an untrusted source", async () => {
    getCurrentConsentStatus.mockResolvedValue({ state: "valid", log: { id: "c1" } });
    const result = await evaluateSmsConsent(
      lead({ source: "google_lead_form", tcpaConsent: false }) as never,
    );
    expect(result).toEqual({ ok: true });
  });

  it("allows website-form leads with the stored tcpaConsent flag", async () => {
    getCurrentConsentStatus.mockResolvedValue({ state: "none", log: null });
    const result = await evaluateSmsConsent(lead({ tcpaConsent: true }) as never);
    expect(result).toEqual({ ok: true });
  });
});

describe("evaluateEmailConsent", () => {
  it("blocks when there is no address", async () => {
    const result = await evaluateEmailConsent(lead({ email: null }) as never);
    expect(result).toEqual({ ok: false, reason: "no_email" });
  });

  it("blocks when the address is on EMAIL_SUPPRESSION_LIST", async () => {
    vi.stubEnv("EMAIL_SUPPRESSION_LIST", "other@example.com, jane@example.com");
    const result = await evaluateEmailConsent(lead() as never);
    expect(result).toEqual({ ok: false, reason: "email_suppressed" });
  });

  it("blocks when marketing opt-in was revoked", async () => {
    consentLogFindFirst.mockResolvedValue({
      consentGiven: true,
      revokedAt: new Date(),
    });
    const result = await evaluateEmailConsent(lead() as never);
    expect(result).toEqual({ ok: false, reason: "email_suppressed" });
  });
});

describe("notifyNewLead", () => {
  it("does not send SMS when consent is missing", async () => {
    findUniqueOrThrow.mockResolvedValue(lead({ tcpaConsent: false }));
    getCurrentConsentStatus.mockResolvedValue({ state: "none", log: null });

    const result = await notifyNewLead("lead-1");

    expect(sendSms).not.toHaveBeenCalled();
    expect(result.sms.status).toBe("no_tcpa_consent");
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("does not invoke transports when outbound is evaluated inside them", async () => {
    findUniqueOrThrow.mockResolvedValue(lead());
    sendSms.mockResolvedValue({ status: "skipped_outbound_disabled" });
    sendEmail.mockResolvedValue({ status: "skipped_outbound_disabled" });

    const result = await notifyNewLead("lead-1");

    expect(result.sms.status).toBe("skipped_outbound_disabled");
    expect(result.email.status).toBe("skipped_outbound_disabled");
  });

  it("attempts both email and SMS when consent and address are present", async () => {
    findUniqueOrThrow.mockResolvedValue(lead());
    sendSms.mockResolvedValue({ status: "skipped_dry_run" });
    sendEmail.mockResolvedValue({ status: "skipped_dry_run" });

    const result = await notifyNewLead("lead-1");

    expect(sendSms).toHaveBeenCalledOnce();
    expect(sendEmail).toHaveBeenCalledOnce();
    const smsArg = sendSms.mock.calls[0][0];
    const emailArg = sendEmail.mock.calls[0][0];
    expect(smsArg.to).toBe("+18635551234");
    expect(smsArg.body).toContain("Lakeland Health Insurance");
    expect(smsArg.body).toContain("863-640-3102");
    expect(smsArg.body).not.toContain("No fluff. Just Huff.");
    expect(emailArg.to).toBe("jane@example.com");
    expect(emailArg.subject).toBe("We received your health insurance inquiry");
    expect(result.sms.status).toBe("skipped_dry_run");
    expect(result.email.status).toBe("skipped_dry_run");
  });
});
