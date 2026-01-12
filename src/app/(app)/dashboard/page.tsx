// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeadlineChip, CoverageBadge, StatusBadge, TrustBanner } from "@/components/domain";
import { requireDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Briefcase, Clock, AlertTriangle, Plus, FileDown } from "lucide-react";

async function getDashboardData(userId: string) {
  console.log("[DASHBOARD] getDashboardData() called with userId:", userId);
  const db = requireDb();
  if (!db) {
    console.log("[DASHBOARD] No database connection");
    return null;
  }

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  // Get all active cases
  const cases = await db.case.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "PENDING_SEND"] },
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
      checklistItems: {
        where: { blocksExport: true, completed: false },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 20,
  });

  // Calculate stats
  const activeCases = cases.length;
  const dueIn7Days = cases.filter(
    (c) => c.dueDate <= sevenDaysFromNow && c.dueDate > now
  ).length;
  const dueIn3Days = cases.filter(
    (c) => c.dueDate <= threeDaysFromNow && c.dueDate > now
  ).length;

  // Transform cases for display
  const casesWithDays = cases.map((c) => {
    const daysLeft = Math.ceil(
      (c.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      id: c.id,
      tenantName: c.tenants[0]?.name || "Unknown",
      propertyAddress: `${c.property.city}, ${c.property.state}`,
      dueDate: c.dueDate,
      daysLeft,
      coverageLevel: c.property.jurisdiction.coverageLevel.toLowerCase() as "full" | "partial" | "state_only",
      status: c.status.toLowerCase() as "active" | "pending_send" | "sent" | "closed",
      hasBlockers: c.checklistItems.length > 0,
      blockerCount: c.checklistItems.length,
    };
  });

  return {
    stats: { activeCases, dueIn7Days, dueIn3Days },
    cases: casesWithDays,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Get dashboard data if user is logged in and db is available
  const data = user ? await getDashboardData(user.id).catch(() => null) : null;

  const stats = data?.stats || { activeCases: 0, dueIn7Days: 0, dueIn3Days: 0 };
  const cases = data?.cases || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track your security deposit cases and deadlines
          </p>
        </div>
        <Button asChild>
          <Link href="/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Link>
        </Button>
      </div>

      {/* Trust Banner */}
      <TrustBanner />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Cases
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCases}</div>
            <p className="text-xs text-muted-foreground">
              Requiring action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Due in 7 Days
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.dueIn7Days}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming deadlines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Due in 3 Days
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{stats.dueIn3Days}</div>
            <p className="text-xs text-muted-foreground">
              Critical deadlines
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deadline Radar</CardTitle>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Blockers</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-medium">
                        {caseItem.tenantName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {caseItem.propertyAddress}
                      </TableCell>
                      <TableCell>
                        <DeadlineChip
                          daysLeft={caseItem.daysLeft}
                          dueDate={caseItem.dueDate}
                        />
                      </TableCell>
                      <TableCell>
                        <CoverageBadge level={caseItem.coverageLevel} showLabel={false} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={caseItem.status} />
                      </TableCell>
                      <TableCell>
                        {caseItem.hasBlockers ? (
                          <span className="text-sm text-danger">
                            {caseItem.blockerCount} blocker{caseItem.blockerCount > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-sm text-success">Ready</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/cases/${caseItem.id}`}>
                            Open
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileDown className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No recent exports. Complete a case to generate your first proof packet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Briefcase className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">No active cases yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Create your first case to start generating compliant security deposit notices.
      </p>
      <Button asChild className="mt-6">
        <Link href="/cases/new">
          <Plus className="mr-2 h-4 w-4" />
          Create First Case
        </Link>
      </Button>
    </div>
  );
}
