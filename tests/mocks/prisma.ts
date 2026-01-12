/* eslint-disable @typescript-eslint/no-explicit-any */
// Test mocks intentionally use 'any' for flexibility in mocking database responses

import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { beforeEach, vi } from "vitest";

// Create a deep mock of the Prisma client
export const prismaMock = mockDeep<PrismaClient>();

// Type for the mocked Prisma client
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: prismaMock,
  requireDb: () => prismaMock,
}));

// Reset all mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

/**
 * Helper to set up common Prisma mock responses
 */
export function setupPrismaMock() {
  return {
    /**
     * Mock a successful case findUnique
     */
    mockCaseFindUnique: (caseData: object | null) => {
      prismaMock.case.findUnique.mockResolvedValue(caseData as any);
    },

    /**
     * Mock a successful case findMany
     */
    mockCaseFindMany: (cases: object[]) => {
      prismaMock.case.findMany.mockResolvedValue(cases as any);
    },

    /**
     * Mock a successful case create
     */
    mockCaseCreate: (caseData: object) => {
      prismaMock.case.create.mockResolvedValue(caseData as any);
    },

    /**
     * Mock a successful jurisdiction findFirst
     */
    mockJurisdictionFindFirst: (jurisdiction: object | null) => {
      prismaMock.jurisdiction.findFirst.mockResolvedValue(jurisdiction as any);
    },

    /**
     * Mock a successful deduction findMany
     */
    mockDeductionFindMany: (deductions: object[]) => {
      prismaMock.deduction.findMany.mockResolvedValue(deductions as any);
    },

    /**
     * Mock audit event creation (usually just needs to resolve)
     */
    mockAuditEventCreate: () => {
      prismaMock.auditEvent.create.mockResolvedValue({} as any);
    },
  };
}
