/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Integration tests for deductions API endpoints
 *
 * Tests cover:
 * - GET /api/cases/[id]/deductions - List deductions
 * - POST /api/cases/[id]/deductions - Create deduction
 * - PATCH /api/cases/[id]/deductions - Update deduction
 * - DELETE /api/cases/[id]/deductions - Delete deduction
 * - POST /api/deductions/[id]/improve - AI improve description
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
import {
  sampleDeduction,
  sampleDeductions,
} from "../../fixtures/deductions";

describe("GET /api/cases/[id]/deductions", () => {
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

    const { GET } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions");
    const response = await GET(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 404 when case not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/nonexistent/deductions");
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("not found");
  });

  it("should return empty array when case has no deductions", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions");
    const response = await GET(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it("should return deductions ordered by creation date", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.findMany.mockResolvedValue(sampleDeductions as any);

    const { GET } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions");
    const response = await GET(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(sampleDeductions.length);
    expect(prismaMock.deduction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "asc" },
      })
    );
  });
});

describe("POST /api/cases/[id]/deductions", () => {
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

    const { POST } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Test", amount: 100, category: "CLEANING" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 404 when case not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/nonexistent/deductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Test", amount: 100, category: "CLEANING" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });

  it("should create deduction successfully", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.create.mockResolvedValue(sampleDeduction as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { POST } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Carpet cleaning",
        amount: 150,
        category: "CLEANING",
        notes: "Heavy stains in living room",
      }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(201);
    expect(prismaMock.deduction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          caseId: "case-123",
          description: "Carpet cleaning",
          amount: 150,
          category: "CLEANING",
        }),
      })
    );
  });

  it("should create deduction with risk assessment fields", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.create.mockResolvedValue(sampleDeduction as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { POST } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Wall repair",
        amount: 300,
        category: "REPAIRS",
        riskLevel: "LOW",
        itemAge: 24, // 2 years
        damageType: "BEYOND_NORMAL",
        hasEvidence: true,
      }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(201);
    expect(prismaMock.deduction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          riskLevel: "LOW",
          itemAge: 24,
          damageType: "BEYOND_NORMAL",
          hasEvidence: true,
        }),
      })
    );
  });

  it("should set hasEvidence when attachmentIds provided", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.create.mockResolvedValue(sampleDeduction as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { POST } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Hole in wall",
        amount: 200,
        category: "DAMAGES",
        attachmentIds: ["att-1", "att-2"],
      }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(201);
    expect(prismaMock.deduction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attachmentIds: ["att-1", "att-2"],
          hasEvidence: true,
        }),
      })
    );
  });

  it("should create audit event for new deduction", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.create.mockResolvedValue(sampleDeduction as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { POST } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Pet damage fee",
        amount: 500,
        category: "DAMAGES",
      }),
    });
    await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(prismaMock.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          caseId: "case-123",
          action: "deduction_added",
          userId: defaultTestUser.id,
        }),
      })
    );
  });
});

describe("PATCH /api/cases/[id]/deductions", () => {
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

    const { PATCH } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deductionId: "ded-1", amount: 200 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 400 when deductionId is missing", async () => {
    const { PATCH } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 200 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("deductionId");
  });

  it("should return 404 when case not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/nonexistent/deductions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deductionId: "ded-1", amount: 200 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("Case not found");
  });

  it("should return 404 when deduction not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.findUnique.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deductionId: "nonexistent", amount: 200 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("Deduction not found");
  });

  it("should update deduction successfully", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.findUnique.mockResolvedValue(sampleDeduction as any);
    prismaMock.deduction.update.mockResolvedValue({ ...sampleDeduction, amount: 200 } as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deductionId: "ded-1", amount: 200 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(prismaMock.deduction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ded-1" },
        data: expect.objectContaining({
          amount: 200,
        }),
      })
    );
  });

  it("should update risk level and damage type", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.findUnique.mockResolvedValue(sampleDeduction as any);
    prismaMock.deduction.update.mockResolvedValue(sampleDeduction as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deductionId: "ded-1",
        riskLevel: "MEDIUM",
        damageType: "INTENTIONAL",
        itemAge: 12,
      }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(prismaMock.deduction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          riskLevel: "MEDIUM",
          damageType: "INTENTIONAL",
          itemAge: 12,
        }),
      })
    );
  });

  it("should set hasEvidence when attachmentIds updated", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.findUnique.mockResolvedValue(sampleDeduction as any);
    prismaMock.deduction.update.mockResolvedValue(sampleDeduction as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deductionId: "ded-1",
        attachmentIds: ["att-1"],
      }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(prismaMock.deduction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attachmentIds: ["att-1"],
          hasEvidence: true,
        }),
      })
    );
  });
});

describe("DELETE /api/cases/[id]/deductions", () => {
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

    const { DELETE } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deductionId: "ded-1" }),
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 404 when case not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/nonexistent/deductions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deductionId: "ded-1" }),
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });

  it("should return 404 when deduction not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.findUnique.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deductionId: "nonexistent" }),
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(404);
  });

  it("should delete deduction successfully", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.findUnique.mockResolvedValue(sampleDeduction as any);
    prismaMock.deduction.delete.mockResolvedValue(sampleDeduction as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { DELETE } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deductionId: "ded-1" }),
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(prismaMock.deduction.delete).toHaveBeenCalledWith({
      where: { id: "ded-1" },
    });
  });

  it("should create audit event for deleted deduction", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.deduction.findUnique.mockResolvedValue(sampleDeduction as any);
    prismaMock.deduction.delete.mockResolvedValue(sampleDeduction as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { DELETE } = await import("@/app/api/cases/[id]/deductions/route");

    const request = new Request("http://localhost/api/cases/case-123/deductions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deductionId: "ded-1" }),
    });
    await DELETE(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(prismaMock.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          caseId: "case-123",
          action: "deduction_deleted",
          userId: defaultTestUser.id,
        }),
      })
    );
  });
});

describe("POST /api/deductions/[id]/improve", () => {
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

    const { POST: improveDeduction } = await import("@/app/api/deductions/[id]/improve/route");

    const request = new Request("http://localhost/api/deductions/ded-1/improve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatHappened: "Tenant broke window" }),
    });
    const response = await improveDeduction(request, { params: Promise.resolve({ id: "ded-1" }) });

    expect(response.status).toBe(401);
  });

  it("should return 404 when deduction not found", async () => {
    prismaMock.deduction.findUnique.mockResolvedValue(null);

    const { POST: improveDeduction } = await import("@/app/api/deductions/[id]/improve/route");

    const request = new Request("http://localhost/api/deductions/nonexistent/improve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatHappened: "Test" }),
    });
    const response = await improveDeduction(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });
});
