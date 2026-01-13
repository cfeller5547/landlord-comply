/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Integration tests for properties API endpoint
 *
 * Tests cover:
 * - GET /api/properties - List user's properties
 * - POST /api/properties - Create new property
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
import { sampleProperty } from "../../fixtures/cases";
import { sanFranciscoJurisdiction, sanFranciscoRuleSet } from "../../fixtures/jurisdictions";

describe("GET /api/properties", () => {
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

    const { GET } = await import("@/app/api/properties/route");

    const request = new Request("http://localhost/api/properties");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("should return empty array when user has no properties", async () => {
    prismaMock.property.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/properties/route");

    const request = new Request("http://localhost/api/properties");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it("should return user's properties with jurisdiction", async () => {
    const properties = [
      {
        ...sampleProperty,
        jurisdiction: sanFranciscoJurisdiction,
      },
    ];
    prismaMock.property.findMany.mockResolvedValue(properties as any);

    const { GET } = await import("@/app/api/properties/route");

    const request = new Request("http://localhost/api/properties");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].address).toBe("123 Main Street");
    expect(data[0].jurisdiction).toBeDefined();
  });

  it("should only return properties for authenticated user", async () => {
    prismaMock.property.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/properties/route");

    const request = new Request("http://localhost/api/properties");
    await GET(request);

    expect(prismaMock.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: defaultTestUser.id,
        },
      })
    );
  });
});

describe("POST /api/properties", () => {
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

    const { POST } = await import("@/app/api/properties/route");

    const request = new Request("http://localhost/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "123 Test St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94102",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("should return 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/properties/route");

    const request = new Request("http://localhost/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "123 Test St",
        // Missing city, state, zipCode
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should find matching jurisdiction and create property", async () => {
    const jurisdictionWithRules = {
      ...sanFranciscoJurisdiction,
      ruleSets: [sanFranciscoRuleSet],
    };
    prismaMock.jurisdiction.findFirst.mockResolvedValue(jurisdictionWithRules as any);
    prismaMock.property.create.mockResolvedValue({
      ...sampleProperty,
      jurisdiction: sanFranciscoJurisdiction,
    } as any);

    const { POST } = await import("@/app/api/properties/route");

    const request = new Request("http://localhost/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "456 New Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94102",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(prismaMock.property.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: defaultTestUser.id,
          address: "456 New Street",
          city: "San Francisco",
          state: "CA",
          zipCode: "94102",
        }),
      })
    );
  });

  it("should fall back to state-level jurisdiction when city not found", async () => {
    // First call for city returns null
    prismaMock.jurisdiction.findFirst.mockResolvedValueOnce(null);
    // Second call for state returns state-level
    const stateJurisdiction = {
      id: "jur-ca-state",
      state: "California",
      stateCode: "CA",
      city: null,
      coverageLevel: "STATE_ONLY",
      ruleSets: [{
        id: "rs-ca-2024",
        returnDeadlineDays: 21,
      }],
    };
    prismaMock.jurisdiction.findFirst.mockResolvedValueOnce(stateJurisdiction as any);
    prismaMock.property.create.mockResolvedValue({
      ...sampleProperty,
      city: "Unknown City",
      jurisdiction: stateJurisdiction,
    } as any);

    const { POST } = await import("@/app/api/properties/route");

    const request = new Request("http://localhost/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "789 Unknown St",
        city: "Unknown City",
        state: "CA",
        zipCode: "99999",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
  });

  it("should return 400 when no jurisdiction found", async () => {
    prismaMock.jurisdiction.findFirst.mockResolvedValue(null);

    const { POST } = await import("@/app/api/properties/route");

    const request = new Request("http://localhost/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "123 Test St",
        city: "Unknown City",
        state: "ZZ", // Invalid state
        zipCode: "00000",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.toLowerCase()).toContain("jurisdiction");
  });
});
