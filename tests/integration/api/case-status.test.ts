/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Integration tests for case status API endpoint
 *
 * Tests cover:
 * - PATCH /api/cases/[id]/status - Update case status with delivery proof
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";
import "../../mocks/supabase";
import "../../mocks/logger";

// Default test user
const defaultTestUser = {
  id: "test-user-id-123",
  email: "test@example.com",
  name: "Test User",
  plan: "BETA" as const,
  reminderEnabled: true,
  reminderDays: [7, 3, 1],
  createdAt: new Date(),
  updatedAt: new Date(),
  avatarUrl: null,
  stripeCustomerId: null,
  subscriptionEndsAt: null,
};

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  getDbUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// Import test fixtures
import { sampleActiveCase } from "../../fixtures/cases";

// Helper to create case data with checklistItems (required by the route)
const createCaseWithChecklist = (overrides: Record<string, unknown> = {}) => ({
  ...sampleActiveCase,
  checklistItems: [], // Empty means no blockers
  ...overrides,
});

describe("PATCH /api/cases/[id]/status", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getDbUser, getCurrentUser } = await import("@/lib/auth");
    vi.mocked(getDbUser).mockResolvedValue(defaultTestUser);
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: defaultTestUser.id,
      email: defaultTestUser.email,
    });
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getDbUser } = await import("@/lib/auth");
    vi.mocked(getDbUser).mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/cases/[id]/status/route");

    const request = new Request("http://localhost/api/cases/case-123/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SENT" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 404 when case not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/cases/[id]/status/route");

    const request = new Request("http://localhost/api/cases/nonexistent/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SENT" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });

  it("should update case to PENDING_SEND", async () => {
    prismaMock.case.findUnique.mockResolvedValue(createCaseWithChecklist() as any);
    prismaMock.case.update.mockResolvedValue(createCaseWithChecklist({ status: "PENDING_SEND" }) as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/status/route");

    const request = new Request("http://localhost/api/cases/case-123/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING_SEND" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(prismaMock.case.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING_SEND",
        }),
      })
    );
  });

  it("should update case to SENT with delivery details", async () => {
    // Case must be in PENDING_SEND status to transition to SENT
    prismaMock.case.findUnique.mockResolvedValue(createCaseWithChecklist({ status: "PENDING_SEND" }) as any);
    prismaMock.case.update.mockResolvedValue(createCaseWithChecklist({
      status: "SENT",
      deliveryMethod: "certified_mail",
      sentDate: new Date("2024-01-20"),
      trackingNumber: "9400111899223033371234",
      deliveryAddress: "456 New Street, Oakland, CA 94607",
    }) as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/status/route");

    const request = new Request("http://localhost/api/cases/case-123/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "SENT",
        deliveryMethod: "certified_mail",
        sentDate: "2024-01-20",
        trackingNumber: "9400111899223033371234",
        deliveryAddress: "456 New Street, Oakland, CA 94607",
      }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(prismaMock.case.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SENT",
          deliveryMethod: "certified_mail",
          trackingNumber: "9400111899223033371234",
          deliveryAddress: "456 New Street, Oakland, CA 94607",
        }),
      })
    );
  });

  it("should update case to CLOSED with reason", async () => {
    prismaMock.case.findUnique.mockResolvedValue(createCaseWithChecklist() as any);
    prismaMock.case.update.mockResolvedValue(createCaseWithChecklist({
      status: "CLOSED",
      closedAt: new Date(),
      closedReason: "Deposit returned with full documentation",
    }) as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/status/route");

    const request = new Request("http://localhost/api/cases/case-123/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "CLOSED",
        closedReason: "Deposit returned with full documentation",
      }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(prismaMock.case.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CLOSED",
          closedAt: expect.any(Date),
          closedReason: "Deposit returned with full documentation",
        }),
      })
    );
  });

  it("should save delivery proof attachment IDs", async () => {
    // Case must be in PENDING_SEND status to transition to SENT
    prismaMock.case.findUnique.mockResolvedValue(createCaseWithChecklist({ status: "PENDING_SEND" }) as any);
    prismaMock.case.update.mockResolvedValue(createCaseWithChecklist({
      status: "SENT",
      deliveryProofIds: ["att-proof-1", "att-proof-2"],
    }) as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/status/route");

    const request = new Request("http://localhost/api/cases/case-123/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "SENT",
        deliveryMethod: "hand_delivery",
        deliveryProofIds: ["att-proof-1", "att-proof-2"],
      }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(prismaMock.case.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deliveryProofIds: ["att-proof-1", "att-proof-2"],
        }),
      })
    );
  });

  it("should create audit event for status change", async () => {
    prismaMock.case.findUnique.mockResolvedValue(createCaseWithChecklist() as any);
    prismaMock.case.update.mockResolvedValue(createCaseWithChecklist({ status: "PENDING_SEND" }) as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/status/route");

    const request = new Request("http://localhost/api/cases/case-123/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING_SEND" }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(prismaMock.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          caseId: "case-123",
          action: "status_pending_send",
          userId: defaultTestUser.id,
        }),
      })
    );
  });
});
