/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Integration tests for /api/cases endpoints
 *
 * Tests cover:
 * - GET /api/cases - List user's cases
 * - POST /api/cases - Create new case
 * - GET /api/cases/[id] - Get single case
 * - PATCH /api/cases/[id] - Update case
 * - DELETE /api/cases/[id] - Delete case
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";
import "../../mocks/supabase";
import "../../mocks/logger";
import {
  sampleActiveCase,
  sampleProperty,
  sampleTenant,
  createCaseWithRelations,
} from "../../fixtures/cases";
import {
  sanFranciscoJurisdiction,
  sanFranciscoRuleSet,
} from "../../fixtures/jurisdictions";
import { defaultTestUser } from "../../fixtures/users";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  getDbUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe("GET /api/cases", () => {
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

    const { GET } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return empty array when user has no cases", async () => {
    prismaMock.case.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it("should return user's cases ordered by due date", async () => {
    const cases = [
      createCaseWithRelations({ id: "case-1", dueDate: new Date("2024-02-01") }),
      createCaseWithRelations({ id: "case-2", dueDate: new Date("2024-01-15") }),
    ];
    prismaMock.case.findMany.mockResolvedValue(cases as any);

    const { GET } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(prismaMock.case.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { dueDate: "asc" },
      })
    );
  });

  it("should filter cases by status when provided", async () => {
    prismaMock.case.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases?status=ACTIVE");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prismaMock.case.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ACTIVE",
        }),
      })
    );
  });

  it("should respect limit parameter", async () => {
    prismaMock.case.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases?limit=10");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prismaMock.case.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
      })
    );
  });

  it("should include property, tenants, and ruleSet relations", async () => {
    const caseWithRelations = createCaseWithRelations();
    prismaMock.case.findMany.mockResolvedValue([caseWithRelations as any]);

    const { GET } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prismaMock.case.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          property: expect.any(Object),
          tenants: true,
          ruleSet: true,
        }),
      })
    );
  });
});

describe("POST /api/cases", () => {
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

    const { POST } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("should return 400 when propertyId is missing", async () => {
    const { POST } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moveOutDate: "2024-01-15",
        depositAmount: 2500,
        tenants: [{ name: "John Doe" }],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Property ID");
  });

  it("should return 400 when moveOutDate is missing", async () => {
    const { POST } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: "prop-123",
        depositAmount: 2500,
        tenants: [{ name: "John Doe" }],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Move-out date");
  });

  it("should return 400 when depositAmount is invalid", async () => {
    const { POST } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: "prop-123",
        moveOutDate: "2024-01-15",
        depositAmount: "invalid",
        tenants: [{ name: "John Doe" }],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("deposit amount");
  });

  it("should return 400 when tenants array is empty", async () => {
    const { POST } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: "prop-123",
        moveOutDate: "2024-01-15",
        depositAmount: 2500,
        tenants: [],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("tenant");
  });

  it("should return 404 when property not found", async () => {
    prismaMock.property.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: "nonexistent-prop",
        moveOutDate: "2024-01-15",
        leaseStartDate: "2023-01-15",
        leaseEndDate: "2024-01-15",
        depositAmount: 2500,
        tenants: [{ name: "John Doe" }],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("Property not found");
  });

  it("should create case with calculated due date", async () => {
    const propertyWithRules = {
      ...sampleProperty,
      jurisdiction: {
        ...sanFranciscoJurisdiction,
        ruleSets: [sanFranciscoRuleSet],
      },
    };
    prismaMock.property.findUnique.mockResolvedValue(propertyWithRules as any);

    const createdCase = {
      ...sampleActiveCase,
      property: sampleProperty,
      tenants: [sampleTenant],
      ruleSet: sanFranciscoRuleSet,
    };
    prismaMock.case.create.mockResolvedValue(createdCase as any);

    const { POST } = await import("@/app/api/cases/route");
    const request = new Request("http://localhost/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: "prop-123",
        moveOutDate: "2024-01-15",
        leaseStartDate: "2023-01-15",
        leaseEndDate: "2024-01-15",
        depositAmount: 2500,
        tenants: [{ name: "John Doe", email: "john@example.com" }],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(prismaMock.case.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: defaultTestUser.id,
          propertyId: "prop-123",
          depositAmount: 2500,
        }),
      })
    );
  });
});

describe("GET /api/cases/[id]", () => {
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

    const { GET } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/case-123");
    const response = await GET(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 404 when case not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/nonexistent");
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("not found");
  });

  it("should return case with all relations", async () => {
    const fullCase = createCaseWithRelations({ id: "case-123" });
    prismaMock.case.findUnique.mockResolvedValue(fullCase as any);

    const { GET } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/case-123");
    const response = await GET(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("case-123");
    expect(prismaMock.case.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          property: expect.any(Object),
          tenants: true,
          deductions: true,
        }),
      })
    );
  });

  it("should only return cases owned by the authenticated user", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/case-123");
    await GET(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(prismaMock.case.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "case-123",
          userId: defaultTestUser.id,
        },
      })
    );
  });
});

describe("PATCH /api/cases/[id]", () => {
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

    const { PATCH } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/case-123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SENT" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 404 when case not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/nonexistent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SENT" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });

  it("should update case status", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.case.update.mockResolvedValue({ ...sampleActiveCase, status: "SENT" } as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/case-123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SENT" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(prismaMock.case.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SENT",
        }),
      })
    );
  });

  it("should set closedAt when status changes to CLOSED", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.case.update.mockResolvedValue({ ...sampleActiveCase, status: "CLOSED" } as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/case-123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED", closedReason: "Deposit returned" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(prismaMock.case.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CLOSED",
          closedAt: expect.any(Date),
          closedReason: "Deposit returned",
        }),
      })
    );
  });

  it("should create audit event for updates", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.case.update.mockResolvedValue(sampleActiveCase as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);

    const { PATCH } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/case-123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositAmount: 3000 }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(prismaMock.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          caseId: "case-123",
          action: "case_updated",
          userId: defaultTestUser.id,
        }),
      })
    );
  });
});

describe("DELETE /api/cases/[id]", () => {
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

    const { DELETE } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/case-123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 404 when case not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/nonexistent", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });

  it("should delete case successfully", async () => {
    prismaMock.case.findUnique.mockResolvedValue(sampleActiveCase as any);
    prismaMock.case.delete.mockResolvedValue(sampleActiveCase as any);

    const { DELETE } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/case-123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(prismaMock.case.delete).toHaveBeenCalledWith({
      where: { id: "case-123" },
    });
  });

  it("should only delete cases owned by the authenticated user", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/cases/[id]/route");
    const request = new Request("http://localhost/api/cases/case-123", {
      method: "DELETE",
    });
    await DELETE(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(prismaMock.case.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "case-123",
          userId: defaultTestUser.id,
        },
      })
    );
  });
});
