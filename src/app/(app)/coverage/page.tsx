import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TrustBanner } from "@/components/domain";
import { requireDb } from "@/lib/db";
import { Search, CheckCircle2, AlertCircle, XCircle, MapPin } from "lucide-react";

interface JurisdictionWithRules {
  id: string;
  state: string;
  stateCode: string;
  city: string | null;
  coverageLevel: string;
  isActive: boolean;
  ruleSets: Array<{
    verifiedAt: Date | null;
  }>;
}

async function getJurisdictions(): Promise<JurisdictionWithRules[]> {
  try {
    const db = requireDb();
    const jurisdictions = await db.jurisdiction.findMany({
      where: { isActive: true },
      include: {
        ruleSets: {
          where: { effectiveDate: { lte: new Date() } },
          orderBy: { effectiveDate: "desc" },
          take: 1,
          select: { verifiedAt: true },
        },
      },
      orderBy: [{ state: "asc" }, { city: "asc" }],
    });
    return jurisdictions;
  } catch {
    return [];
  }
}

export default async function CoveragePage() {
  const jurisdictions = await getJurisdictions();

  // Group jurisdictions by state
  const byState = jurisdictions.reduce((acc, j) => {
    if (!acc[j.state]) {
      acc[j.state] = [];
    }
    acc[j.state].push(j);
    return acc;
  }, {} as Record<string, JurisdictionWithRules[]>);

  const states = Object.keys(byState).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Coverage</h1>
        <p className="text-sm text-muted-foreground">
          View supported jurisdictions and coverage levels
        </p>
      </div>

      {/* Trust Banner */}
      <TrustBanner />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by state or city..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coverage Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span>Full coverage - State and city rules included</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          <span>Partial - Some rules may need verification</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-muted-foreground" />
          <span>State only - City ordinances not included</span>
        </div>
      </div>

      {/* Empty State */}
      {states.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-medium">No jurisdictions found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Jurisdiction data is being loaded. Check back shortly.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Coverage Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {states.map((state) => {
            const stateJurisdictions = byState[state];
            const stateLevel = stateJurisdictions.find((j) => !j.city);
            const cities = stateJurisdictions.filter((j) => j.city);

            return (
              <Card key={state}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{state}</CardTitle>
                    {stateLevel && (
                      <CoverageLevelBadge level={stateLevel.coverageLevel.toLowerCase() as any} />
                    )}
                  </div>
                  {stateLevel?.ruleSets[0]?.verifiedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last verified: {new Date(stateLevel.ruleSets[0].verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {cities.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Cities with Enhanced Coverage
                      </p>
                      {cities.map((city) => (
                        <div
                          key={city.id}
                          className="flex items-center justify-between rounded-lg border p-2"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{city.city}</span>
                          </div>
                          <CoverageLevelBadge level={city.coverageLevel.toLowerCase() as any} compact />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      State-level rules only. No city-specific coverage yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Jurisdiction */}
      <Card>
        <CardHeader>
          <CardTitle>Request a Jurisdiction</CardTitle>
          <CardDescription>
            Need coverage for a specific city or state? Let us know and we will prioritize it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="request-state">State</Label>
              <Input id="request-state" placeholder="e.g., Nevada" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-city">City (optional)</Label>
              <Input id="request-city" placeholder="e.g., Las Vegas" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="request-notes">What do you need?</Label>
              <Textarea
                id="request-notes"
                placeholder="Describe what rules or coverage you need..."
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <Button>Submit Request</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CoverageLevelBadge({
  level,
  compact = false,
}: {
  level: "full" | "partial" | "state_only";
  compact?: boolean;
}) {
  const config = {
    full: {
      icon: CheckCircle2,
      label: compact ? "" : "Full",
      className: "bg-success/10 text-success border-success/20",
    },
    partial: {
      icon: AlertCircle,
      label: compact ? "" : "Partial",
      className: "bg-warning/10 text-warning border-warning/20",
    },
    state_only: {
      icon: XCircle,
      label: compact ? "" : "State only",
      className: "bg-muted text-muted-foreground border-border",
    },
  };

  const { icon: Icon, label, className } = config[level] || config.state_only;

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3.5 w-3.5" />
      {label && <span className="ml-1">{label}</span>}
    </Badge>
  );
}
