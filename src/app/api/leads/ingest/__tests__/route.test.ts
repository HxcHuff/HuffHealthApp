import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module before importing the route
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findFirst: vi.fn(),
    },
    lead: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    leadEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { POST } from "../route";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";

const VALID_SECRET = "test-ingest-secret-1234";

function makeRequest(body: unknown, token?: string): NextRequest {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }
  return new NextRequest("http://localhost:3000/api/leads/ingest", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    source: "website_form",
    first_name: "Jane",
    last_name: "Doe",
    phone: "8635551234",
    email: "jane@example.com",
    tcpa_consent: true,
    tcpa_consent_text: "I agree to receive calls and texts.",
    tcpa_timestamp: "2026-04-27T12:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv("LEAD_INGEST_SECRET", VALID_SECRET);
  vi.clearAllMocks();

  // Default: admin user exists
  (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "admin-user-id",
  });

  // Default: no duplicate
  (db.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

  // Default: create returns new lead
  (db.lead.create as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "new-lead-id",
  });
});

describe("POST /api/leads/ingest", () => {
  it("returns 201 for a valid payload", async () => {
    const res = await POST(makeRequest(validPayload(), VALID_SECRET));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.leadId).toBe("new-lead-id");
    expect(json.duplicate).toBe(false);
    expect(json.correlationId).toBeDefined();

    expect(db.lead.create).toHaveBeenCalledOnce();
    const createCall = (db.lead.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(createCall.data.phone).toBe("+18635551234"); // normalized E.164
    expect(createCall.data.firstName).toBe("Jane");
    expect(createCall.data.status).toBe("NEW_LEAD");
  });

  it("returns 401 when no auth header is provided", async () => {
    const res = await POST(makeRequest(validPayload()));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 401 when the token is wrong", async () => {
    const res = await POST(makeRequest(validPayload(), "wrong-token"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with duplicate:true for existing lead within 30 days", async () => {
    (db.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing-lead-id",
    });
    (db.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([
      {},
      {},
    ]);

    const res = await POST(makeRequest(validPayload(), VALID_SECRET));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.leadId).toBe("existing-lead-id");
    expect(json.duplicate).toBe(true);
    expect(db.$transaction).toHaveBeenCalledOnce();
  });

  it("returns 400 for an invalid phone number", async () => {
    const res = await POST(
      makeRequest(validPayload({ phone: "123" }), VALID_SECRET)
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Validation failed");
    expect(json.fields.phone).toBeDefined();
  });

  it("returns 400 when tcpa_consent is false", async () => {
    const res = await POST(
      makeRequest(validPayload({ tcpa_consent: false }), VALID_SECRET)
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Validation failed");
    expect(json.fields.tcpa_consent).toBeDefined();
  });

  it("returns 400 when tcpa_consent is missing", async () => {
    const payload = validPayload();
    delete (payload as Record<string, unknown>).tcpa_consent;
    const res = await POST(makeRequest(payload, VALID_SECRET));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.fields.tcpa_consent).toBeDefined();
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(
      makeRequest({ source: "manual" }, VALID_SECRET)
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.fields.first_name).toBeDefined();
    expect(json.fields.last_name).toBeDefined();
    expect(json.fields.phone).toBeDefined();
    expect(json.fields.email).toBeDefined();
  });

  it("returns 500 when DB throws", async () => {
    (db.lead.findFirst as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("connection refused")
    );

    const res = await POST(makeRequest(validPayload(), VALID_SECRET));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
    expect(json.correlationId).toBeDefined();
    // Should NOT leak the actual error message
    expect(JSON.stringify(json)).not.toContain("connection refused");
  });
});
