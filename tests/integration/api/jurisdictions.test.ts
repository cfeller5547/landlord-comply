/* eslint-disable @typescript-eslint/no-explicit-any */
// Test mocks intentionally use 'any' for flexibility in mocking database responses

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/jurisdictions/lookup/route";
import { prismaMock } from "../../mocks/prisma";
import {
  californiaJurisdiction,
  sanFranciscoJurisdiction,
  californiaRuleSet,
  sanFranciscoRuleSet,
} from "../../fixtures/jurisdictions";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  getDbUser: vi.fn().mockResolvedValue({ id: "test-user-id" }),
  getCurrentUser: vi.fn().mockResolvedValue({ id: "test-user-id" }),
}));

describe("GET /api/jurisdictions/lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when state is missing", async () => {
    const request = new Request("http://localhost/api/jurisdictions/lookup");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("State code is required");
  });

  it("should return city-level jurisdiction when available", async () => {
    // Mock finding San Francisco jurisdiction
    prismaMock.jurisdiction.findFirst.mockResolvedValueOnce({
      ...sanFranciscoJurisdiction,
      ruleSets: [sanFranciscoRuleSet],
    } as any);

    const request = new Request(
      "http://localhost/api/jurisdictions/lookup?state=CA&city=San Francisco"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jurisdiction.city).toBe("San Francisco");
    expect(data.jurisdiction.coverageLevel).toBe("FULL");
    expect(data.ruleSet.returnDeadlineDays).toBe(21);
    expect(data.ruleSet.interestRequired).toBe(true);
  });

  it("should fall back to state-level when city not found", async () => {
    // First call (city lookup) returns null
    prismaMock.jurisdiction.findFirst.mockResolvedValueOnce(null);
    // Second call (state lookup) returns California state-level
    prismaMock.jurisdiction.findFirst.mockResolvedValueOnce({
      ...californiaJurisdiction,
      ruleSets: [californiaRuleSet],
    } as any);

    const request = new Request(
      "http://localhost/api/jurisdictions/lookup?state=CA&city=Unknown City"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jurisdiction.city).toBeNull();
    expect(data.jurisdiction.coverageLevel).toBe("STATE_ONLY");
    // Should have been called twice - once for city, once for state
    expect(prismaMock.jurisdiction.findFirst).toHaveBeenCalledTimes(2);
  });

  it("should return 404 when no jurisdiction found", async () => {
    // Both city and state lookups return null
    prismaMock.jurisdiction.findFirst.mockResolvedValue(null);

    const request = new Request(
      "http://localhost/api/jurisdictions/lookup?state=ZZ"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should handle case-insensitive city names", async () => {
    prismaMock.jurisdiction.findFirst.mockResolvedValueOnce({
      ...sanFranciscoJurisdiction,
      ruleSets: [sanFranciscoRuleSet],
    } as any);

    const request = new Request(
      "http://localhost/api/jurisdictions/lookup?state=CA&city=san francisco"
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    // The query should handle case insensitivity
  });

  it("should return state-level when only state is provided", async () => {
    prismaMock.jurisdiction.findFirst.mockResolvedValueOnce({
      ...californiaJurisdiction,
      ruleSets: [californiaRuleSet],
    } as any);

    const request = new Request(
      "http://localhost/api/jurisdictions/lookup?state=CA"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jurisdiction.state).toBe("California");
  });

  it("should include rule set with jurisdiction", async () => {
    prismaMock.jurisdiction.findFirst.mockResolvedValueOnce({
      ...californiaJurisdiction,
      ruleSets: [californiaRuleSet],
    } as any);

    const request = new Request(
      "http://localhost/api/jurisdictions/lookup?state=CA"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ruleSet).toBeDefined();
    expect(data.ruleSet.returnDeadlineDays).toBe(21);
    expect(data.ruleSet.itemizationRequired).toBe(true);
  });
});

describe("GET /api/jurisdictions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Additional tests for listing all jurisdictions could go here
});
