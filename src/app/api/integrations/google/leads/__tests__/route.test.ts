import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { findFirst: vi.fn() },
    lead: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    leadEvent: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/lead-router", () => ({
  routeLeadAsync: vi.fn(),
}));

vi.mock("@/lib/consent", () => ({
  recordConsent: vi.fn().mockResolvedValue({ id: "consent-id" }),
  TCPA_DISCLOSURE_TEXT: "TCPA disclosure",
}));

import { POST } from "../route";
import { db } from "@/lib/db";
import { routeLeadAsync } from "@/lib/lead-router";
import { recordConsent } from "@/lib/consent";
import { NextRequest } from "next/server";

const VALID_KEY = "test-google-key-1234";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/integrations/google/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function googlePayload(overrides: Record<string, unknown> = {}) {
  return {
    lead_id: "g-lead-abc",
    api_version: "1.0",
    form_id: 12345,
    campaign_id: 67890,
    google_key: VALID_KEY,
    is_test: false,
    user_column_data: [
      { column_name: "FULL_NAME", string_value: "Jane Doe" },
      { column_name: "EMAIL", string_value: "jane@example.com" },
      { column_name: "PHONE_NUMBER", string_value: "8635551234" },
      { column_name: "POSTAL_CODE", string_value: "33801" },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_LEAD_WEBHOOK_KEY", VALID_KEY);
  vi.clearAllMocks();

  (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "admin-id" });
  (db.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (db.lead.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "new-lead-id" });
});

describe("POST /api/integrations/google/leads", () => {
  it("creates a lead from a valid Google payload (FULL_NAME variant)", async () => {
    const res = await POST(makeRequest(googlePayload()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.lead_id).toBe("new-lead-id");
    expect(json.duplicate).toBe(false);

    expect(db.lead.create).toHaveBeenCalledOnce();
    const createCall = (db.lead.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.firstName).toBe("Jane");
    expect(createCall.data.lastName).toBe("Doe");
    expect(createCall.data.phone).toBe("+18635551234");
    expect(createCall.data.email).toBe("jane@example.com");
    expect(createCall.data.zipCode).toBe("33801");
    expect(createCall.data.source).toBe("google_lead_form");
    expect(createCall.data.utmSource).toBe("google");
    expect(createCall.data.campaign).toBe("67890");
    expect(createCall.data.externalLeadId).toBe("g-lead-abc");
    expect(createCall.data.tcpaConsent).toBe(true);

    expect(routeLeadAsync).toHaveBeenCalledWith("new-lead-id");
    expect(recordConsent).toHaveBeenCalledOnce();
  });

  it("prefers FIRST_NAME / LAST_NAME columns over FULL_NAME", async () => {
    const payload = googlePayload({
      user_column_data: [
        { column_name: "FIRST_NAME", string_value: "John" },
        { column_name: "LAST_NAME", string_value: "Smith" },
        { column_name: "FULL_NAME", string_value: "Should Not Use" },
        { column_name: "EMAIL", string_value: "john@example.com" },
        { column_name: "PHONE_NUMBER", string_value: "8635559999" },
      ],
    });
    await POST(makeRequest(payload));
    const createCall = (db.lead.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.firstName).toBe("John");
    expect(createCall.data.lastName).toBe("Smith");
  });

  it("returns 401 when google_key does not match", async () => {
    const res = await POST(makeRequest(googlePayload({ google_key: "wrong-key" })));
    expect(res.status).toBe(401);
    expect(db.lead.create).not.toHaveBeenCalled();
  });

  it("returns 503 when GOOGLE_LEAD_WEBHOOK_KEY is not configured", async () => {
    vi.stubEnv("GOOGLE_LEAD_WEBHOOK_KEY", "");
    const res = await POST(makeRequest(googlePayload()));
    expect(res.status).toBe(503);
    expect(db.lead.create).not.toHaveBeenCalled();
  });

  it("returns 200 without creating a lead when is_test is true", async () => {
    const res = await POST(makeRequest(googlePayload({ is_test: true })));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.test).toBe(true);
    expect(db.lead.create).not.toHaveBeenCalled();
    expect(routeLeadAsync).not.toHaveBeenCalled();
  });

  it("returns 400 when the phone is invalid", async () => {
    const payload = googlePayload({
      user_column_data: [
        { column_name: "FULL_NAME", string_value: "Jane Doe" },
        { column_name: "EMAIL", string_value: "jane@example.com" },
        { column_name: "PHONE_NUMBER", string_value: "123" },
      ],
    });
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect(db.lead.create).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", async () => {
    const payload = googlePayload({
      user_column_data: [
        { column_name: "EMAIL", string_value: "jane@example.com" },
      ],
    });
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
  });

  it("returns 400 when google_key is missing entirely", async () => {
    const payload = googlePayload();
    delete (payload as Record<string, unknown>).google_key;
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
  });

  it("returns 200 with duplicate:true for an existing lead in last 30 days", async () => {
    (db.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "existing-id" });
    (db.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([{}, {}]);

    const res = await POST(makeRequest(googlePayload()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.lead_id).toBe("existing-id");
    expect(json.duplicate).toBe(true);
    expect(db.lead.create).not.toHaveBeenCalled();
    expect(routeLeadAsync).not.toHaveBeenCalled();
  });

  it("returns 500 when DB throws (so Google retries)", async () => {
    (db.lead.findFirst as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("connection refused"));
    const res = await POST(makeRequest(googlePayload()));
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain("connection refused");
  });
});
