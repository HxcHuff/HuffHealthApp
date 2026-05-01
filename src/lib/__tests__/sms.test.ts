import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendSms } from "../sms";

describe("sendSms", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("returns skipped_dry_run when LEAD_PIPELINE_DRY_RUN is true", async () => {
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "true");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC-real");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "real-token");
    vi.stubEnv("TWILIO_FROM_NUMBER", "+15555550000");

    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;

    const res = await sendSms({ to: "+18635551234", body: "hi" });
    expect(res.status).toBe("skipped_dry_run");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns skipped_no_credentials when env is missing", async () => {
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    vi.stubEnv("TWILIO_FROM_NUMBER", "");
    vi.stubEnv("TWILIO_MESSAGING_SERVICE_SID", "");

    const res = await sendSms({ to: "+18635551234", body: "hi" });
    expect(res.status).toBe("skipped_no_credentials");
  });

  it("uses MessagingServiceSid when TWILIO_MESSAGING_SERVICE_SID is set", async () => {
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "ACtest");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "secret");
    vi.stubEnv("TWILIO_MESSAGING_SERVICE_SID", "MG8d3f03dbda");
    vi.stubEnv("TWILIO_FROM_NUMBER", "+15555550000");

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ sid: "SM456" }),
    });
    globalThis.fetch = fetchSpy as typeof fetch;

    const res = await sendSms({ to: "+18635551234", body: "hi" });
    expect(res.status).toBe("sent");
    const body = (fetchSpy.mock.calls[0][1] as RequestInit).body as string;
    expect(body).toContain("MessagingServiceSid=MG8d3f03dbda");
    expect(body).not.toContain("From=");
  });

  it("posts to Twilio when fully configured", async () => {
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "ACtest");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "secret");
    vi.stubEnv("TWILIO_FROM_NUMBER", "+15555550000");

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ sid: "SM123" }),
    });
    globalThis.fetch = fetchSpy as typeof fetch;

    const res = await sendSms({ to: "+18635551234", body: "hello world" });
    expect(res.status).toBe("sent");
    expect(res.sid).toBe("SM123");
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain("api.twilio.com");
    expect(url).toContain("ACtest");
    expect((init as RequestInit).method).toBe("POST");
    const body = (init as RequestInit).body as string;
    expect(body).toContain("To=%2B18635551234");
    expect(body).toContain("Body=hello+world");
  });

  it("returns failed on Twilio error", async () => {
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "ACtest");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "secret");
    vi.stubEnv("TWILIO_FROM_NUMBER", "+15555550000");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad number",
    }) as typeof fetch;

    const res = await sendSms({ to: "+1notvalid", body: "x" });
    expect(res.status).toBe("failed");
    expect(res.error).toBe("HTTP 400");
  });
});
