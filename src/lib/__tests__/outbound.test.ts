import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getOutboundSkipReason,
  isOutboundNotificationsEnabled,
  shouldSendLiveOutbound,
} from "../outbound";

describe("outbound kill switch", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is fail-closed when the enable flag is missing", () => {
    vi.stubEnv("OUTBOUND_NOTIFICATIONS_ENABLED", "");
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "");
    expect(isOutboundNotificationsEnabled()).toBe(false);
    expect(shouldSendLiveOutbound()).toBe(false);
    expect(getOutboundSkipReason()).toBe("skipped_outbound_disabled");
  });

  it("is fail-closed when the flag is any value other than true", () => {
    vi.stubEnv("OUTBOUND_NOTIFICATIONS_ENABLED", "yes");
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "false");
    expect(getOutboundSkipReason()).toBe("skipped_outbound_disabled");
  });

  it("skips as dry-run when enabled but LEAD_PIPELINE_DRY_RUN is true", () => {
    vi.stubEnv("OUTBOUND_NOTIFICATIONS_ENABLED", "true");
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "true");
    expect(shouldSendLiveOutbound()).toBe(false);
    expect(getOutboundSkipReason()).toBe("skipped_dry_run");
  });

  it("allows live send only when enabled and dry-run is off", () => {
    vi.stubEnv("OUTBOUND_NOTIFICATIONS_ENABLED", "true");
    vi.stubEnv("LEAD_PIPELINE_DRY_RUN", "false");
    expect(shouldSendLiveOutbound()).toBe(true);
    expect(getOutboundSkipReason()).toBeNull();
  });
});
