/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Integration tests for dashboard API endpoint
 *
 * Tests cover:
 * - GET /api/dashboard - Get dashboard stats
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
import { createCaseWithRelations } from "../../fixtures/cases";

describe("GET /api/dashboard", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset auth mock to return default user
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

    const { GET } = await import("@/app/api/dashboard/route");

    const request = new Request("http://localhost/api/dashboard");
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("should return empty stats when user has no cases", async () => {
    prismaMock.case.count.mockResolvedValue(0);
    prismaMock.document.count.mockResolvedValue(0);
    prismaMock.property.count.mockResolvedValue(0);
    prismaMock.case.findMany.mockResolvedValue([]);
    prismaMock.jurisdiction.count.mockResolvedValue(0);

    const { GET } = await import("@/app/api/dashboard/route");

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.stats.activeCases).toBe(0);
    expect(data.stats.upcomingDeadlines).toBe(0);
    expect(data.stats.overdueCount).toBe(0);
  });

  it("should calculate correct stats for multiple cases", async () => {
    prismaMock.case.count.mockResolvedValue(3);
    prismaMock.document.count.mockResolvedValue(5);
    prismaMock.property.count.mockResolvedValue(2);
    prismaMock.jurisdiction.count.mockResolvedValue(10);
    
    const now = new Date();
    const upcomingCases = [
      createCaseWithRelations({
        id: "case-urgent",
        status: "ACTIVE",
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      }),
      createCaseWithRelations({
        id: "case-normal",
        status: "ACTIVE",
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      }),
    ];
    const overdueCases = [
      createCaseWithRelations({
        id: "case-overdue",
        status: "ACTIVE",
        dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      }),
    ];
    
    // First findMany call returns upcoming cases, second returns overdue
    prismaMock.case.findMany.mockResolvedValueOnce(upcomingCases as any);
    prismaMock.case.findMany.mockResolvedValueOnce(overdueCases as any);

    const { GET } = await import("@/app/api/dashboard/route");

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.stats.activeCases).toBe(3);
    expect(data.stats.upcomingDeadlines).toBe(2);
    expect(data.stats.overdueCount).toBe(1);
  });

  it("should include deadline radar sorted by urgency", async () => {
    prismaMock.case.count.mockResolvedValue(3);
    prismaMock.document.count.mockResolvedValue(0);
    prismaMock.property.count.mockResolvedValue(1);
    prismaMock.jurisdiction.count.mockResolvedValue(5);

    const now = new Date();
    const upcomingCases = [
      createCaseWithRelations({
        id: "case-urgent",
        status: "ACTIVE",
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      }),
    ];
    const overdueCases = [
      createCaseWithRelations({
        id: "case-overdue",
        status: "ACTIVE",
        dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      }),
    ];

    prismaMock.case.findMany.mockResolvedValueOnce(upcomingCases as any);
    prismaMock.case.findMany.mockResolvedValueOnce(overdueCases as any);

    const { GET } = await import("@/app/api/dashboard/route");

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.deadlineRadar).toBeDefined();
    expect(Array.isArray(data.deadlineRadar)).toBe(true);
    expect(data.deadlineRadar.length).toBe(2);
  });

  it("should handle database errors gracefully", async () => {
    prismaMock.case.count.mockRejectedValue(new Error("Database connection failed"));

    const { GET } = await import("@/app/api/dashboard/route");

    const response = await GET();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
