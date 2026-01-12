import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Use DATABASE_URL (pooled connection with PgBouncer) for serverless
// DIRECT_URL is only for migrations (session mode)
const connectionString = process.env.DATABASE_URL;

// Check if database is configured
const isDatabaseConfigured = connectionString && !connectionString.includes("[YOUR-DB-PASSWORD]");

// Create a singleton pool and client
const globalForPrisma = globalThis as unknown as {
  pool: Pool | undefined;
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient | null {
  if (!isDatabaseConfigured) {
    console.warn("Database not configured. Some features will be unavailable.");
    return null;
  }

  if (!globalForPrisma.pool) {
    // Configure pool for serverless with minimal connections
    globalForPrisma.pool = new Pool({
      connectionString,
      max: 1, // Minimal connections since PgBouncer handles pooling
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    });
  }

  const adapter = new PrismaPg(globalForPrisma.pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

// Cache the client in all environments (important for serverless)
if (db) {
  globalForPrisma.prisma = db;
}

// Helper to check if db is available
export function requireDb() {
  if (!db) {
    throw new Error("Database not configured");
  }
  return db;
}
