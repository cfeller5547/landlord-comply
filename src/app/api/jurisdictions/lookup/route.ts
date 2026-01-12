import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";

// GET /api/jurisdictions/lookup?state=CA&city=San Francisco
// Returns the best matching jurisdiction with its current rules
export async function GET(request: Request) {
  try {
    const db = requireDb();
    const { searchParams } = new URL(request.url);

    const stateCode = searchParams.get("state");
    const city = searchParams.get("city");

    if (!stateCode) {
      return NextResponse.json(
        { error: "State code is required" },
        { status: 400 }
      );
    }

    // Try to find city-level jurisdiction first
    let jurisdiction = null;

    if (city) {
      jurisdiction = await db.jurisdiction.findFirst({
        where: {
          stateCode: stateCode.toUpperCase(),
          city: { equals: city, mode: "insensitive" },
          isActive: true,
        },
        include: {
          ruleSets: {
            where: {
              effectiveDate: { lte: new Date() },
            },
            orderBy: { effectiveDate: "desc" },
            take: 1,
            include: {
              citations: true,
              penalties: true,
            },
          },
        },
      });
    }

    // Fall back to state-level jurisdiction
    if (!jurisdiction) {
      jurisdiction = await db.jurisdiction.findFirst({
        where: {
          stateCode: stateCode.toUpperCase(),
          city: null,
          isActive: true,
        },
        include: {
          ruleSets: {
            where: {
              effectiveDate: { lte: new Date() },
            },
            orderBy: { effectiveDate: "desc" },
            take: 1,
            include: {
              citations: true,
              penalties: true,
            },
          },
        },
      });
    }

    if (!jurisdiction) {
      return NextResponse.json(
        {
          error: "Jurisdiction not found",
          message: `We don't have coverage for ${stateCode}${city ? ` / ${city}` : ""} yet.`,
        },
        { status: 404 }
      );
    }

    const currentRuleSet = jurisdiction.ruleSets[0] || null;

    return NextResponse.json({
      jurisdiction: {
        id: jurisdiction.id,
        state: jurisdiction.state,
        stateCode: jurisdiction.stateCode,
        city: jurisdiction.city,
        coverageLevel: jurisdiction.coverageLevel,
      },
      ruleSet: currentRuleSet
        ? {
            id: currentRuleSet.id,
            version: currentRuleSet.version,
            effectiveDate: currentRuleSet.effectiveDate,
            verifiedAt: currentRuleSet.verifiedAt,
            returnDeadlineDays: currentRuleSet.returnDeadlineDays,
            returnDeadlineDescription: currentRuleSet.returnDeadlineDescription,
            interestRequired: currentRuleSet.interestRequired,
            interestRate: currentRuleSet.interestRate,
            interestRateSource: currentRuleSet.interestRateSource,
            itemizationRequired: currentRuleSet.itemizationRequired,
            itemizationRequirements: currentRuleSet.itemizationRequirements,
            maxDepositMonths: currentRuleSet.maxDepositMonths,
            allowedDeliveryMethods: currentRuleSet.allowedDeliveryMethods,
            citations: currentRuleSet.citations,
            penalties: currentRuleSet.penalties,
          }
        : null,
    });
  } catch (error) {
    console.error("Error looking up jurisdiction:", error);
    return NextResponse.json(
      { error: "Failed to look up jurisdiction" },
      { status: 500 }
    );
  }
}
