
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Simple check for env var
const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!url) {
  console.error("Error: DATABASE_URL or DIRECT_URL is not set in environment.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Connecting to database...");
    const jurisdictionCount = await prisma.jurisdiction.count();
    console.log(`Total Jurisdictions: ${jurisdictionCount}`);

    const activeCount = await prisma.jurisdiction.count({ where: { isActive: true } });
    console.log(`Active Jurisdictions: ${activeCount}`);

    if (jurisdictionCount > 0) {
      const jurisdictions = await prisma.jurisdiction.findMany({
        take: 3,
        select: { state: true, city: true, isActive: true, coverageLevel: true }
      });
      console.log('Sample Jurisdictions:', JSON.stringify(jurisdictions, null, 2));
    }

  } catch (e) {
    console.error("Database error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
