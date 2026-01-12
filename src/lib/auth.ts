import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getDbUser() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // If database is not configured, return a minimal user object
  if (!db) {
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split("@")[0],
      avatarUrl: user.user_metadata?.avatar_url,
      plan: "FREE" as const,
      reminderEnabled: true,
      reminderDays: [7, 3, 1],
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeCustomerId: null,
      subscriptionEndsAt: null,
    };
  }

  // Get or create user in our database
  let dbUser = await db.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    // Create user in our database if doesn't exist
    dbUser = await db.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split("@")[0],
        avatarUrl: user.user_metadata?.avatar_url,
      },
    });
  }

  return dbUser;
}

export async function requireUser() {
  const user = await getDbUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
