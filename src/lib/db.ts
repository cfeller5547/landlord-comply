import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Connection string - prefer DIRECT_URL for server-side operations
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

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
    globalForPrisma.pool = new Pool({ connectionString });
  }

  const adapter = new PrismaPg(globalForPrisma.pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && db) {
  globalForPrisma.prisma = db;
}

// Helper to check if db is available
export function requireDb() {
  if (!db) {
    throw new Error("Database not configured");
  }
  return db;
}
