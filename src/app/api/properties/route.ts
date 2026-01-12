import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/properties - List user's properties
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = requireDb();

    const properties = await db.property.findMany({
      where: { userId: user.id },
      include: {
        jurisdiction: true,
        _count: {
          select: { cases: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// POST /api/properties - Create a new property
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = requireDb();
    const body = await request.json();

    const { address, unit, city, state, zipCode } = body;

    if (!address || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: "Address, city, state, and zip code are required" },
        { status: 400 }
      );
    }

    // Look up or create jurisdiction
    // First try to find city-level jurisdiction
    let jurisdiction = await db.jurisdiction.findFirst({
      where: {
        stateCode: state.toUpperCase(),
        city: { equals: city, mode: "insensitive" },
        isActive: true,
      },
    });

    // Fall back to state-level
    if (!jurisdiction) {
      jurisdiction = await db.jurisdiction.findFirst({
        where: {
          stateCode: state.toUpperCase(),
          city: null,
          isActive: true,
        },
      });
    }

    if (!jurisdiction) {
      return NextResponse.json(
        {
          error: "Jurisdiction not supported",
          message: `We don't have coverage for ${state} yet. You can request it.`,
        },
        { status: 400 }
      );
    }

    const property = await db.property.create({
      data: {
        userId: user.id,
        address,
        unit,
        city,
        state: state.toUpperCase(),
        zipCode,
        jurisdictionId: jurisdiction.id,
      },
      include: {
        jurisdiction: true,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
