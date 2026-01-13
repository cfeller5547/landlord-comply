/**
 * Test fixtures for users
 */

import { faker } from "@faker-js/faker";

// Default test user (matches mockSupabaseUser in supabase.ts)
export const defaultTestUser = {
  id: "test-user-id-123",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  plan: "BETA" as const,
  reminderEnabled: true,
  reminderDays: [7, 3, 1],
  stripeCustomerId: null,
  subscriptionEndsAt: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Pro plan user
export const proUser = {
  ...defaultTestUser,
  id: "pro-user-id-456",
  email: "pro@example.com",
  name: "Pro User",
  plan: "PRO" as const,
  stripeCustomerId: "cus_test123",
  subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
};

// Free plan user
export const freeUser = {
  ...defaultTestUser,
  id: "free-user-id-789",
  email: "free@example.com",
  name: "Free User",
  plan: "FREE" as const,
};

// Different user (for ownership/authorization tests)
export const otherUser = {
  ...defaultTestUser,
  id: "other-user-id-000",
  email: "other@example.com",
  name: "Other User",
};

/**
 * Factory function to create a user with custom data
 */
export function createUser(overrides: Partial<typeof defaultTestUser> = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    avatarUrl: null,
    plan: "BETA" as const,
    reminderEnabled: true,
    reminderDays: [7, 3, 1],
    stripeCustomerId: null,
    subscriptionEndsAt: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Supabase auth user format (for mocking getCurrentUser)
 */
export function createSupabaseAuthUser(dbUser: typeof defaultTestUser) {
  return {
    id: dbUser.id,
    email: dbUser.email,
    user_metadata: {
      name: dbUser.name,
      avatar_url: dbUser.avatarUrl,
    },
    app_metadata: {},
    aud: "authenticated",
    created_at: dbUser.createdAt.toISOString(),
  };
}
