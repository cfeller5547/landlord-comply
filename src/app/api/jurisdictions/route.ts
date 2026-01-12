import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";

// GET /api/jurisdictions - List all jurisdictions
export async function GET(request: Request) {
  try {
    const db = requireDb();
    const { searchParams } = new URL(request.url);

    const stateCode = searchParams.get("state");
    const city = searchParams.get("city");

    const jurisdictions = await db.jurisdiction.findMany({
      where: {
        ...(stateCode && { stateCode }),
        ...(city && { city: { contains: city, mode: "insensitive" } }),
        // isActive: true, // Temporarily allow all jurisdictions for debugging
      },
      include: {
        ruleSets: {
          orderBy: { effectiveDate: "desc" },
          take: 1,
          include: {
            citations: true,
            penalties: true,
          },
        },
      },
      orderBy: [{ state: "asc" }, { city: "asc" }],
    });

    return NextResponse.json(jurisdictions);
  } catch (error) {
    console.error("Error fetching jurisdictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch jurisdictions" },
      { status: 500 }
    );
  }
}
