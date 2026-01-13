/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Test Helpers
 *
 * Utilities for testing Next.js API routes with mocked dependencies.
 * Provides consistent request/response handling and mock management.
 */

import { vi, expect } from "vitest";
import { prismaMock } from "../mocks/prisma";
import { mockSupabaseClient, supabaseMockHelpers } from "../mocks/supabase";
import { defaultTestUser, otherUser, createUser } from "../fixtures/users";

/**
 * Create a mock Request object for API testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: object;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = "GET", body, headers = {} } = options;

  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(url, requestInit);
}

/**
 * Create params object for dynamic routes (simulating Next.js params)
 */
export function createRouteParams<T extends Record<string, string>>(
  params: T
): { params: Promise<T> } {
  return {
    params: Promise.resolve(params),
  };
}

/**
 * Parse JSON response with error handling
 */
export async function parseJsonResponse<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    throw new Error("Empty response body");
  }
  return JSON.parse(text) as T;
}

/**
 * Assert common API response patterns
 */
export const assertResponse = {
  /**
   * Assert successful response (2xx status)
   */
  success: (response: Response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
  },

  /**
   * Assert unauthorized response
   */
  unauthorized: async (response: Response) => {
    expect(response.status).toBe(401);
    const data = await parseJsonResponse(response);
    expect(data.error).toBe("Unauthorized");
  },

  /**
   * Assert forbidden response
   */
  forbidden: async (response: Response) => {
    expect(response.status).toBe(403);
    const data = await parseJsonResponse(response);
    expect(data.error).toMatch(/Forbidden|Unauthorized/);
  },

  /**
   * Assert not found response
   */
  notFound: async (response: Response, entityName?: string) => {
    expect(response.status).toBe(404);
    const data = await parseJsonResponse(response);
    if (entityName) {
      expect(data.error).toContain(entityName);
    }
    expect(data.error).toMatch(/not found/i);
  },

  /**
   * Assert bad request response
   */
  badRequest: async (response: Response, expectedError?: string | RegExp) => {
    expect(response.status).toBe(400);
    const data = await parseJsonResponse(response);
    if (expectedError) {
      if (typeof expectedError === "string") {
        expect(data.error).toBe(expectedError);
      } else {
        expect(data.error).toMatch(expectedError);
      }
    }
  },

  /**
   * Assert server error response
   */
  serverError: async (response: Response) => {
    expect(response.status).toBe(500);
    const data = await parseJsonResponse(response);
    expect(data.error).toBeDefined();
  },

  /**
   * Assert redirect response
   */
  redirect: (response: Response, expectedUrl?: string) => {
    expect([301, 302, 303, 307, 308]).toContain(response.status);
    if (expectedUrl) {
      expect(response.headers.get("location")).toBe(expectedUrl);
    }
  },

  /**
   * Assert PDF response
   */
  pdf: (response: Response) => {
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toMatch(/attachment.*\.pdf/);
  },
};

/**
 * Setup mock authentication for API tests
 */
export const mockAuth = {
  /**
   * Set up authenticated user (default test user)
   */
  asUser: (user: typeof defaultTestUser = defaultTestUser) => {
    vi.doMock("@/lib/auth", () => ({
      getDbUser: vi.fn().mockResolvedValue(user),
      getCurrentUser: vi.fn().mockResolvedValue({
        id: user.id,
        email: user.email,
        user_metadata: { name: user.name },
      }),
      requireUser: vi.fn().mockResolvedValue(user),
    }));
    supabaseMockHelpers.mockAuthenticatedUser({ id: user.id, email: user.email });
    return user;
  },

  /**
   * Set up as different user (for ownership tests)
   */
  asOtherUser: () => {
    return mockAuth.asUser(otherUser);
  },

  /**
   * Set up unauthenticated state
   */
  asUnauthenticated: () => {
    vi.doMock("@/lib/auth", () => ({
      getDbUser: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
      requireUser: vi.fn().mockRejectedValue(new Error("Unauthorized")),
    }));
    supabaseMockHelpers.mockUnauthenticated();
  },

  /**
   * Reset auth mocks to default authenticated state
   */
  reset: () => {
    vi.doMock("@/lib/auth", () => ({
      getDbUser: vi.fn().mockResolvedValue(defaultTestUser),
      getCurrentUser: vi.fn().mockResolvedValue({
        id: defaultTestUser.id,
        email: defaultTestUser.email,
        user_metadata: { name: defaultTestUser.name },
      }),
      requireUser: vi.fn().mockResolvedValue(defaultTestUser),
    }));
    supabaseMockHelpers.resetMocks();
  },
};

/**
 * Common Prisma mock setups for API tests
 */
export const mockDb = {
  /**
   * Mock case lookup (findUnique)
   */
  caseExists: (caseData: any) => {
    prismaMock.case.findUnique.mockResolvedValue(caseData);
  },

  /**
   * Mock case not found
   */
  caseNotFound: () => {
    prismaMock.case.findUnique.mockResolvedValue(null);
  },

  /**
   * Mock case owned by different user
   */
  caseOwnedByOther: (caseData: any) => {
    prismaMock.case.findUnique.mockResolvedValue({
      ...caseData,
      userId: otherUser.id,
    });
  },

  /**
   * Mock document lookup
   */
  documentExists: (docData: any) => {
    prismaMock.document.findUnique.mockResolvedValue(docData);
  },

  /**
   * Mock document not found
   */
  documentNotFound: () => {
    prismaMock.document.findUnique.mockResolvedValue(null);
  },

  /**
   * Mock successful create operation
   */
  createSucceeds: (model: keyof typeof prismaMock, returnData: any) => {
    (prismaMock[model] as any).create.mockResolvedValue(returnData);
  },

  /**
   * Mock successful update operation
   */
  updateSucceeds: (model: keyof typeof prismaMock, returnData: any) => {
    (prismaMock[model] as any).update.mockResolvedValue(returnData);
  },

  /**
   * Mock database error
   */
  throwsError: (model: keyof typeof prismaMock, method: string, error: Error = new Error("Database error")) => {
    (prismaMock[model] as any)[method].mockRejectedValue(error);
  },

  /**
   * Reset all Prisma mocks
   */
  reset: () => {
    vi.clearAllMocks();
  },
};

/**
 * Mock Supabase storage operations
 */
export const mockStorage = {
  /**
   * Mock successful upload
   */
  uploadSucceeds: (path = "test-path") => {
    mockSupabaseClient.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: `https://test.supabase.co/storage/${path}` },
      }),
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: `https://test.supabase.co/storage/signed/${path}` },
        error: null,
      }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);
  },

  /**
   * Mock upload failure
   */
  uploadFails: (errorMessage = "Upload failed") => {
    mockSupabaseClient.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
      download: vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
      remove: vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
    } as any);
  },

  /**
   * Mock signed URL generation success
   */
  signedUrlSucceeds: (signedUrl = "https://test.supabase.co/storage/signed/test-path?token=abc") => {
    mockSupabaseClient.storage.from.mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl },
        error: null,
      }),
      upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: signedUrl } }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);
  },

  /**
   * Mock signed URL generation failure
   */
  signedUrlFails: (errorMessage = "File not found") => {
    mockSupabaseClient.storage.from.mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      }),
      upload: vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
      download: vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
      remove: vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
    } as any);
  },
};

/**
 * Create a full test context with all mocks configured
 */
export function createTestContext(options: {
  authenticated?: boolean;
  user?: typeof defaultTestUser;
} = {}) {
  const { authenticated = true, user = defaultTestUser } = options;

  if (authenticated) {
    mockAuth.asUser(user);
  } else {
    mockAuth.asUnauthenticated();
  }

  mockStorage.uploadSucceeds();

  return {
    user: authenticated ? user : null,
    prismaMock,
    mockSupabaseClient,
    cleanup: () => {
      mockAuth.reset();
      mockDb.reset();
    },
  };
}
