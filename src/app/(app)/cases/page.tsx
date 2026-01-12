// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeadlineChip, CoverageBadge, StatusBadge, TrustBanner } from "@/components/domain";
import { requireDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Plus, Search, Filter } from "lucide-react";

async function getCases(userId: string) {
  console.log("[CASES PAGE] getCases() called with userId:", userId);
  const db = requireDb();
  if (!db) {
    console.log("[CASES PAGE] No database connection");
    return [];
  }

  const now = new Date();

  const cases = await db.case.findMany({
    where: { userId },
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
  });

  console.log("[CASES PAGE] Found", cases.length, "cases for user");

  return cases.map((c) => {
    const daysLeft = Math.ceil(
      (c.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      id: c.id,
      tenantName: c.tenants[0]?.name || "Unknown",
      propertyAddress: `${c.property.address}, ${c.property.city}, ${c.property.state}`,
      dueDate: c.dueDate,
      daysLeft,
      coverageLevel: c.property.jurisdiction.coverageLevel.toLowerCase() as "full" | "partial" | "state_only",
      status: c.status.toLowerCase() as "active" | "pending_send" | "sent" | "closed",
      hasBlockers: c.checklistItems.length > 0,
      blockerCount: c.checklistItems.length,
    };
  });
}

export default async function CasesPage() {
  console.log("[CASES PAGE] CasesPage() rendering...");
  const user = await getCurrentUser();
  console.log("[CASES PAGE] getCurrentUser() returned:", user?.id || "NO USER", "email:", user?.email || "N/A");
  const cases = user ? await getCases(user.id).catch((err) => {
    console.error("[CASES PAGE] getCases() error:", err);
    return [];
  }) : [];
  console.log("[CASES PAGE] Final cases count:", cases.length);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cases</h1>
          <p className="text-sm text-muted-foreground">
            Manage your security deposit disposition cases
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by tenant or property..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_send">Ready to Send</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Due Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="3days">Due in 3 days</SelectItem>
                  <SelectItem value="7days">Due in 7 days</SelectItem>
                  <SelectItem value="30days">Due in 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coverage</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="state_only">State Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardContent className="pt-6">
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/cases/${caseItem.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {caseItem.tenantName}
                        </Link>
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
                        <CoverageBadge level={caseItem.coverageLevel} />
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
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/cases/${caseItem.id}`}>
                              Open
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <Filter className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">No cases found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Create your first case to start generating compliant notices.
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
