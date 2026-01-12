import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

// GET /api/dashboard - Get dashboard stats and upcoming cases
export async function GET() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = requireDb();
    const now = new Date();

    // Get counts
    const [activeCases, totalDocuments, totalProperties] = await Promise.all([
      db.case.count({
        where: {
          userId: user.id,
          status: { in: ["ACTIVE", "PENDING_SEND"] },
        },
      }),
      db.document.count({
        where: {
          case: { userId: user.id },
        },
      }),
      db.property.count({
        where: { userId: user.id },
      }),
    ]);

    // Get upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingCases = await db.case.findMany({
      where: {
        userId: user.id,
        status: { in: ["ACTIVE", "PENDING_SEND"] },
        dueDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        property: {
          include: {
            jurisdiction: true,
          },
        },
        tenants: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    // Get overdue cases
    const overdueCases = await db.case.findMany({
      where: {
        userId: user.id,
        status: { in: ["ACTIVE", "PENDING_SEND"] },
        dueDate: { lt: now },
      },
      include: {
        property: {
          include: {
            jurisdiction: true,
          },
        },
        tenants: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Calculate days until deadline for each case
    const casesWithDeadlineInfo = [...overdueCases, ...upcomingCases].map((c) => {
      const daysUntilDue = Math.ceil(
        (c.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...c,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
        urgency:
          daysUntilDue < 0
            ? "overdue"
            : daysUntilDue <= 3
            ? "urgent"
            : daysUntilDue <= 7
            ? "soon"
            : "normal",
      };
    });

    // Get coverage stats
    const jurisdictionsCovered = await db.jurisdiction.count({
      where: { isActive: true },
    });

    return NextResponse.json({
      stats: {
        activeCases,
        totalDocuments,
        totalProperties,
        upcomingDeadlines: upcomingCases.length,
        overdueCount: overdueCases.length,
        jurisdictionsCovered,
      },
      deadlineRadar: casesWithDeadlineInfo.slice(0, 10),
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
