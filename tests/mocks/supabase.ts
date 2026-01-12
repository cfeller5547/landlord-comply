import { vi } from "vitest";

/**
 * Default mock user for testing
 */
export const mockSupabaseUser = {
  id: "test-user-id-123",
  email: "test@example.com",
  user_metadata: {
    name: "Test User",
    avatar_url: null,
  },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

/**
 * Mock Supabase client
 */
export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    }),
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: mockSupabaseUser,
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
        },
      },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: mockSupabaseUser, session: {} },
      error: null,
    }),
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: "https://test.supabase.co/storage/test-path" },
      }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
};

// Mock the Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabaseClient),
}));

// Mock the Supabase browser client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn().mockReturnValue(mockSupabaseClient),
}));

/**
 * Helper functions to customize mock behavior
 */
export const supabaseMockHelpers = {
  /**
   * Mock an authenticated user
   */
  mockAuthenticatedUser: (userData?: Partial<typeof mockSupabaseUser>) => {
    const user = { ...mockSupabaseUser, ...userData };
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });
    return user;
  },

  /**
   * Mock an unauthenticated state
   */
  mockUnauthenticated: () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  },

  /**
   * Mock an auth error
   */
  mockAuthError: (message: string = "Auth error") => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message, status: 401 },
    });
  },

  /**
   * Reset all Supabase mocks to default state
   */
  resetMocks: () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    });
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: mockSupabaseUser } },
      error: null,
    });
  },
};
