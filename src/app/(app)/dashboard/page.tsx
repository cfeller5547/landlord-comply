// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeadlineChip, TrustBanner } from "@/components/domain";
import { requireDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  Briefcase,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  Send,
  Package,
  ArrowRight,
  CheckCircle,
  Upload,
  DollarSign,
  Activity,
  Shield,
  ChevronRight,
} from "lucide-react";

interface ActionCase {
  id: string;
  tenantName: string;
  propertyAddress: string;
  dueDate: Date;
  daysLeft: number;
  depositAmount: number;
  maxExposure: number;
  blockerCount: number;
  hasNoticeLetter: boolean;
  hasItemizedStatement: boolean;
  hasSent: boolean;
  primaryAction: "generate_docs" | "record_delivery" | "export_packet" | "review";
  primaryActionLabel: string;
}

interface DeadlineCase {
  id: string;
  tenantName: string;
  propertyAddress: string;
  dueDate: Date;
  daysLeft: number;
}

interface ActivityItem {
  id: string;
  caseId: string;
  tenantName: string;
  action: string;
  description: string;
  timestamp: Date;
  icon: "document" | "delivery" | "upload" | "export" | "case";
}

async function getDashboardData(userId: string) {
  const db = requireDb();
  if (!db) return null;

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const fourteenDaysFromNow = new Date();
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  // Get all active cases with full data
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
      documents: true,
      checklistItems: {
        where: { blocksExport: true, completed: false },
      },
      ruleSet: {
        include: {
          penalties: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Get recent audit events across all user's cases
  const recentActivity = await db.auditEvent.findMany({
    where: {
      case: { userId },
    },
    include: {
      case: {
        include: {
          tenants: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { timestamp: "desc" },
    take: 8,
  });

  // Calculate stats
  const activeCases = cases.length;
  const overdueCases = cases.filter((c) => c.dueDate < now).length;
  const dueIn7Days = cases.filter(
    (c) => c.dueDate <= sevenDaysFromNow && c.dueDate >= now
  ).length;

  // Calculate cases requiring action (has blockers or missing docs)
  const casesRequiringAction = cases.filter((c) => {
    const hasNoticeLetter = c.documents.some((d) => d.type === "NOTICE_LETTER");
    const hasItemizedStatement = c.documents.some((d) => d.type === "ITEMIZED_STATEMENT");
    const hasBlockers = c.checklistItems.length > 0;
    const daysLeft = Math.ceil((c.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return !hasNoticeLetter || !hasItemizedStatement || hasBlockers || daysLeft <= 7;
  }).length;

  // Calculate total exposure for top cases
  let totalExposure = 0;
  const actionCases: ActionCase[] = [];

  for (const c of cases.slice(0, 10)) {
    const daysLeft = Math.ceil((c.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const hasNoticeLetter = c.documents.some((d) => d.type === "NOTICE_LETTER");
    const hasItemizedStatement = c.documents.some((d) => d.type === "ITEMIZED_STATEMENT");
    const depositAmount = Number(c.depositAmount);

    // Calculate max exposure from penalties
    let maxExposure = 0;
    for (const penalty of c.ruleSet.penalties) {
      const penaltyText = penalty.penalty.toLowerCase();
      if (penaltyText.includes("2x") || penaltyText.includes("double")) {
        maxExposure = Math.max(maxExposure, depositAmount * 2);
      } else if (penaltyText.includes("3x") || penaltyText.includes("triple")) {
        maxExposure = Math.max(maxExposure, depositAmount * 3);
      } else if (penaltyText.includes("full deposit")) {
        maxExposure = Math.max(maxExposure, depositAmount);
      }
    }

    // Determine primary action
    let primaryAction: ActionCase["primaryAction"] = "review";
    let primaryActionLabel = "Review Case";

    if (!hasNoticeLetter || !hasItemizedStatement) {
      primaryAction = "generate_docs";
      primaryActionLabel = "Generate Docs";
    } else if (c.status === "PENDING_SEND" || (hasNoticeLetter && hasItemizedStatement && !c.deliveryMethod)) {
      primaryAction = "record_delivery";
      primaryActionLabel = "Record Delivery";
    } else if (hasNoticeLetter && hasItemizedStatement) {
      primaryAction = "export_packet";
      primaryActionLabel = "Export Packet";
    }

    // Only add to action list if it needs attention
    const needsAttention = !hasNoticeLetter || !hasItemizedStatement ||
      c.checklistItems.length > 0 || daysLeft <= 14 || c.status === "PENDING_SEND";

    if (needsAttention && actionCases.length < 5) {
      actionCases.push({
        id: c.id,
        tenantName: c.tenants[0]?.name || "Unknown",
        propertyAddress: `${c.property.city}, ${c.property.state}`,
        dueDate: c.dueDate,
        daysLeft,
        depositAmount,
        maxExposure,
        blockerCount: c.checklistItems.length,
        hasNoticeLetter,
        hasItemizedStatement,
        hasSent: c.status === "SENT",
        primaryAction,
        primaryActionLabel,
      });
    }

    if (daysLeft <= 14 && maxExposure > 0) {
      totalExposure += maxExposure;
    }
  }

  // Sort action cases by urgency (overdue first, then by days left)
  actionCases.sort((a, b) => {
    if (a.daysLeft < 0 && b.daysLeft >= 0) return -1;
    if (b.daysLeft < 0 && a.daysLeft >= 0) return 1;
    return a.daysLeft - b.daysLeft;
  });

  // Deadline radar - next 7 and 14 days
  const deadlineCases: DeadlineCase[] = cases
    .filter((c) => c.dueDate >= now && c.dueDate <= fourteenDaysFromNow)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      tenantName: c.tenants[0]?.name || "Unknown",
      propertyAddress: `${c.property.city}, ${c.property.state}`,
      dueDate: c.dueDate,
      daysLeft: Math.ceil((c.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

  // Transform activity
  const activityItems: ActivityItem[] = recentActivity.map((event) => {
    let icon: ActivityItem["icon"] = "case";
    if (event.action.includes("document")) icon = "document";
    else if (event.action.includes("delivery") || event.action.includes("sent")) icon = "delivery";
    else if (event.action.includes("attachment") || event.action.includes("upload")) icon = "upload";
    else if (event.action.includes("export") || event.action.includes("packet")) icon = "export";

    return {
      id: event.id,
      caseId: event.caseId,
      tenantName: event.case.tenants[0]?.name || "Unknown",
      action: event.action,
      description: event.description,
      timestamp: event.timestamp,
      icon,
    };
  });

  return {
    stats: {
      activeCases,
      casesRequiringAction,
      dueIn7Days,
      overdueCases,
      totalExposure,
    },
    actionCases,
    deadlineCases,
    activityItems,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const data = user ? await getDashboardData(user.id).catch(() => null) : null;

  const stats = data?.stats || {
    activeCases: 0,
    casesRequiringAction: 0,
    dueIn7Days: 0,
    overdueCases: 0,
    totalExposure: 0,
  };
  const actionCases = data?.actionCases || [];
  const deadlineCases = data?.deadlineCases || [];
  const activityItems = data?.activityItems || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Action Center</h1>
          <p className="text-sm text-muted-foreground">
            What needs your attention today
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

      {/* Upgraded KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requiring Action
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.casesRequiringAction}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.activeCases} active case{stats.activeCases !== 1 ? "s" : ""}
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
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{stats.overdueCases}</div>
            <p className="text-xs text-muted-foreground">
              Past deadline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Potential Exposure
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalExposure.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              If deadlines missed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Action Required (Star of the page) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Action Required
              </CardTitle>
              <CardDescription>
                Cases that need your attention now, sorted by urgency
              </CardDescription>
            </CardHeader>
            <CardContent>
              {actionCases.length === 0 ? (
                <EmptyActionState activeCases={stats.activeCases} />
              ) : (
                <div className="space-y-3">
                  {actionCases.map((caseItem) => (
                    <ActionCaseRow key={caseItem.id} caseItem={caseItem} />
                  ))}
                  {stats.activeCases > 5 && (
                    <div className="pt-2 border-t">
                      <Link
                        href="/cases"
                        className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        View all {stats.activeCases} cases
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deadline Radar Mini */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Deadline Radar
                  </CardTitle>
                  <CardDescription>
                    Next 14 days
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/cases">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deadlineCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle className="h-8 w-8 text-success mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No deadlines in the next 14 days
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deadlineCases.map((deadline) => (
                    <Link
                      key={deadline.id}
                      href={`/cases/${deadline.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{deadline.tenantName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {deadline.propertyAddress}
                        </p>
                      </div>
                      <DeadlineChip daysLeft={deadline.daysLeft} dueDate={deadline.dueDate} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recent Activity */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your compliance trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Activity will appear here as you work on cases
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityItems.map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActionCaseRow({ caseItem }: { caseItem: ActionCase }) {
  const getActionButton = () => {
    const baseProps = {
      size: "sm" as const,
      asChild: true,
    };

    switch (caseItem.primaryAction) {
      case "generate_docs":
        return (
          <Button {...baseProps}>
            <Link href={`/cases/${caseItem.id}`}>
              <FileText className="mr-1 h-3 w-3" />
              Generate Docs
            </Link>
          </Button>
        );
      case "record_delivery":
        return (
          <Button {...baseProps} variant="default">
            <Link href={`/cases/${caseItem.id}`}>
              <Send className="mr-1 h-3 w-3" />
              Record Delivery
            </Link>
          </Button>
        );
      case "export_packet":
        return (
          <Button {...baseProps} variant="outline">
            <Link href={`/cases/${caseItem.id}`}>
              <Package className="mr-1 h-3 w-3" />
              Export Packet
            </Link>
          </Button>
        );
      default:
        return (
          <Button {...baseProps} variant="ghost">
            <Link href={`/cases/${caseItem.id}`}>
              Open Case
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        );
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">{caseItem.tenantName}</p>
          <DeadlineChip daysLeft={caseItem.daysLeft} dueDate={caseItem.dueDate} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground truncate">{caseItem.propertyAddress}</span>
          {caseItem.blockerCount > 0 && (
            <Badge variant="outline" className="text-danger border-danger text-xs">
              {caseItem.blockerCount} blocker{caseItem.blockerCount > 1 ? "s" : ""}
            </Badge>
          )}
          {!caseItem.hasNoticeLetter && (
            <Badge variant="outline" className="text-xs">No notice</Badge>
          )}
          {!caseItem.hasItemizedStatement && (
            <Badge variant="outline" className="text-xs">No statement</Badge>
          )}
        </div>
        {caseItem.maxExposure > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            <DollarSign className="h-3 w-3 inline" />
            Up to ${caseItem.maxExposure.toLocaleString()} exposure
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {getActionButton()}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/cases/${caseItem.id}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const getIcon = () => {
    switch (item.icon) {
      case "document":
        return <FileText className="h-4 w-4 text-primary" />;
      case "delivery":
        return <Send className="h-4 w-4 text-success" />;
      case "upload":
        return <Upload className="h-4 w-4 text-blue-500" />;
      case "export":
        return <Package className="h-4 w-4 text-purple-500" />;
      default:
        return <Briefcase className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Link
      href={`/cases/${item.caseId}`}
      className="flex items-start gap-3 group"
    >
      <div className="p-2 rounded-full bg-muted group-hover:bg-muted/80 transition-colors">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate group-hover:text-primary transition-colors">
          {item.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.tenantName} • {formatTime(item.timestamp)}
        </p>
      </div>
    </Link>
  );
}

function EmptyActionState({ activeCases }: { activeCases: number }) {
  if (activeCases === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-success mb-4" />
        <h3 className="text-lg font-medium">All caught up!</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          No active cases requiring attention. Create a new case when a tenant moves out.
        </p>
        <Button asChild className="mt-6">
          <Link href="/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Case
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <CheckCircle className="h-10 w-10 text-success mb-3" />
      <h3 className="font-medium">Looking good!</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        All {activeCases} case{activeCases !== 1 ? "s are" : " is"} on track. Keep it up!
      </p>
      <Button variant="outline" asChild className="mt-4">
        <Link href="/cases">
          View all cases
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
