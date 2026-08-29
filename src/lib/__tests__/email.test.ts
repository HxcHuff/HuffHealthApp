import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEmail } from "../email";

describe("sendEmail", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns skipped_outbound_disabled when the kill switch is off", async () => {
    vi.stubEnv("OUTBOUND_NOTIFICATIONS_ENABLED", "");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");

    const result = await sendEmail({
      to: "jane@example.com",
      subject: "hi",
      html: "<p>hi</p>",
    });

    expect(result.status).toBe("skipped_outbound_disabled");
  });

  it("returns skipped_dry_run when outbound is on but dry-run is set", async () => {
    vi.stubEnv("OUTBOUND_NOTIFICATIONS_ENABLED", "true");
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "true");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");

    const result = await sendEmail({
      to: "jane@example.com",
      subject: "hi",
      html: "<p>hi</p>",
    });

    expect(result.status).toBe("skipped_dry_run");
  });

  it("returns skipped_no_credentials when enabled and no Resend key", async () => {
    vi.stubEnv("OUTBOUND_NOTIFICATIONS_ENABLED", "true");
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "");
    vi.stubEnv("RESEND_API_KEY", "");

    const result = await sendEmail({
      to: "jane@example.com",
      subject: "hi",
      html: "<p>hi</p>",
    });

    expect(result.status).toBe("skipped_no_credentials");
  });
});
