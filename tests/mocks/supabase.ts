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
 * Mock storage bucket operations
 */
export const mockStorageBucket = {
  upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
  download: vi.fn().mockResolvedValue({ data: new Blob(["test"]), error: null }),
  getPublicUrl: vi.fn().mockReturnValue({
    data: { publicUrl: "https://test.supabase.co/storage/v1/object/public/case-files/test-path" },
  }),
  createSignedUrl: vi.fn().mockResolvedValue({
    data: { signedUrl: "https://test.supabase.co/storage/v1/object/sign/case-files/test-path?token=abc123" },
    error: null,
  }),
  remove: vi.fn().mockResolvedValue({ data: [], error: null }),
  list: vi.fn().mockResolvedValue({ data: [], error: null }),
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
    from: vi.fn().mockReturnValue(mockStorageBucket),
  },
};

/**
 * Mock admin Supabase client (for server-side operations with service role)
 */
export const mockAdminSupabaseClient = {
  storage: {
    from: vi.fn().mockReturnValue(mockStorageBucket),
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

// Mock the Supabase admin client
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue(mockAdminSupabaseClient),
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
   * Mock successful storage upload
   */
  mockStorageUploadSuccess: (path = "test-path") => {
    mockStorageBucket.upload.mockResolvedValue({ data: { path }, error: null });
    mockStorageBucket.getPublicUrl.mockReturnValue({
      data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/case-files/${path}` },
    });
  },

  /**
   * Mock storage upload failure
   */
  mockStorageUploadError: (message = "Upload failed") => {
    mockStorageBucket.upload.mockResolvedValue({ data: null, error: { message } });
  },

  /**
   * Mock successful signed URL generation
   */
  mockSignedUrlSuccess: (signedUrl = "https://test.supabase.co/storage/v1/object/sign/case-files/test-path?token=abc123") => {
    mockStorageBucket.createSignedUrl.mockResolvedValue({
      data: { signedUrl },
      error: null,
    });
  },

  /**
   * Mock signed URL generation failure
   */
  mockSignedUrlError: (message = "File not found in bucket") => {
    mockStorageBucket.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message },
    });
  },

  /**
   * Get the current mock storage bucket for assertions
   */
  getStorageBucket: () => mockStorageBucket,

  /**
   * Reset all Supabase mocks to default state
   */
  resetMocks: () => {
    // Reset storage bucket mocks to defaults
    mockStorageBucket.upload.mockResolvedValue({ data: { path: "test-path" }, error: null });
    mockStorageBucket.download.mockResolvedValue({ data: new Blob(["test"]), error: null });
    mockStorageBucket.getPublicUrl.mockReturnValue({
      data: { publicUrl: "https://test.supabase.co/storage/v1/object/public/case-files/test-path" },
    });
    mockStorageBucket.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://test.supabase.co/storage/v1/object/sign/case-files/test-path?token=abc123" },
      error: null,
    });
    mockStorageBucket.remove.mockResolvedValue({ data: [], error: null });
    mockStorageBucket.list.mockResolvedValue({ data: [], error: null });

    // Reset auth mocks to default authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    });
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: mockSupabaseUser } },
      error: null,
    });
    
    // Reset storage.from mocks
    mockSupabaseClient.storage.from.mockReturnValue(mockStorageBucket);
    mockAdminSupabaseClient.storage.from.mockReturnValue(mockStorageBucket);
  },
};
