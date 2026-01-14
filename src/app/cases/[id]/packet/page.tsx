"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Loader2,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Package,
  ExternalLink,
  MapPin,
  Scale,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CaseData {
  id: string;
  status: string;
  moveOutDate: string;
  dueDate: string;
  depositAmount: number;
  property: {
    address: string;
    city: string;
    state: string;
    jurisdiction: {
      state: string;
      city: string | null;
      coverageLevel: string;
    };
  };
  ruleSet: {
    returnDeadlineDays: number;
    allowedDeliveryMethods: string[];
    version: string;
    lastVerified: string;
    citations: Array<{
      id: string;
      code: string;
      title: string | null;
      url: string | null;
    }>;
  };
  tenants: Array<{
    id: string;
    name: string;
    email: string | null;
  }>;
  documents: Array<{
    id: string;
    type: string;
    version: number;
    generatedAt: string;
  }>;
  deductions: Array<{
    id: string;
    description: string;
    amount: number;
  }>;
}

// State abbreviation to full name mapping
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

export default function PacketDownloadPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [generatingNotice, setGeneratingNotice] = useState(false);
  const [generatingItemized, setGeneratingItemized] = useState(false);
  const [generatingBoth, setGeneratingBoth] = useState(false);
  const [downloadingPacket, setDownloadingPacket] = useState(false);

  // Fetch case data on mount
  useEffect(() => {
    async function fetchCase() {
      try {
        const response = await fetch(`/api/cases/${caseId}`);
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch case");
        }
        const data = await response.json();
        setCaseData(data);
      } catch (err) {
        setError("Unable to load your case. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (caseId) {
      fetchCase();
    }
  }, [caseId, router]);

  // Calculate days remaining
  const daysRemaining = caseData
    ? Math.ceil(
        (new Date(caseData.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  // Check if documents are "drafts" (missing key info)
  const hasTenants = caseData && caseData.tenants.length > 0;
  const hasDeductions = caseData && caseData.deductions.length > 0;
  const isDraft = !hasTenants || !hasDeductions;

  // Format date safely (handles Invalid Date)
  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Format short date (for verified date)
  function formatShortDate(dateString: string | null | undefined) {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Get deadline color
  function getDeadlineColor() {
    if (daysRemaining < 0) return "text-red-600 bg-red-50 border-red-200";
    if (daysRemaining <= 3) return "text-red-600 bg-red-50 border-red-200";
    if (daysRemaining <= 7) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  }

  // Generate and download document
  async function handleDownload(type: "notice_letter" | "itemized_statement") {
    const setGenerating = type === "notice_letter" ? setGeneratingNotice : setGeneratingItemized;
    setGenerating(true);

    try {
      const response = await fetch(`/api/cases/${caseId}/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate document");
      }

      // Get the PDF blob and download it
      const blob = await response.blob();
      const fileName = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "")
        || `${type.replace("_", "-")}.pdf`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Refresh case data to get updated documents list
      const caseResponse = await fetch(`/api/cases/${caseId}`);
      if (caseResponse.ok) {
        setCaseData(await caseResponse.json());
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  // Download both PDFs
  async function handleDownloadBoth() {
    setGeneratingBoth(true);

    try {
      // Generate both documents sequentially
      for (const type of ["notice_letter", "itemized_statement"] as const) {
        const response = await fetch(`/api/cases/${caseId}/documents/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to generate ${type}`);
        }

        const blob = await response.blob();
        const fileName = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "")
          || `${type.replace("_", "-")}.pdf`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      // Refresh case data
      const caseResponse = await fetch(`/api/cases/${caseId}`);
      if (caseResponse.ok) {
        setCaseData(await caseResponse.json());
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download. Please try again.");
    } finally {
      setGeneratingBoth(false);
    }
  }

  // Download proof packet ZIP
  async function handleDownloadPacket() {
    setDownloadingPacket(true);

    try {
      const response = await fetch(`/api/cases/${caseId}/proof-packet`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate packet");
      }

      const blob = await response.blob();
      const fileName = `proof-packet-${caseId.slice(0, 8)}.zip`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download packet. Please try again.");
    } finally {
      setDownloadingPacket(false);
    }
  }

  // Check if documents exist
  const hasNoticeLetter = caseData?.documents.some(d => d.type === "NOTICE_LETTER");
  const hasItemizedStatement = caseData?.documents.some(d => d.type === "ITEMIZED_STATEMENT");

  // Get location display text (fixes ", CA" bug)
  function getLocationText() {
    if (!caseData) return "";
    const { city, state } = caseData.property;
    const stateName = STATE_NAMES[state] || state;

    if (city && city.trim()) {
      return `${city}, ${state}`;
    }
    return stateName;
  }

  // Coverage level text
  function getCoverageText() {
    const level = caseData?.property.jurisdiction.coverageLevel;
    if (level === "FULL") return "State + City rules";
    if (level === "PARTIAL") return "Partial coverage";
    return "State rules only";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your packet...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Unable to Load</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push("/start")} variant="outline">
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get verified date with fallback
  const verifiedDate = formatShortDate(caseData.ruleSet.lastVerified);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Minimal Header - just logo + help */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">LandlordComply</span>
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <HelpCircle className="h-4 w-4" />
            Need help?
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Your Packet is Ready
          </h1>
          <p className="text-muted-foreground">
            Download, print, and mail to your tenant
          </p>
        </div>

        {/* Deadline Card */}
        <Card className={cn("mb-4 border-2", getDeadlineColor())}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                {getLocationText()}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span className="font-bold">
                  {daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : daysRemaining === 0
                    ? "Due today!"
                    : `${daysRemaining} days left`}
                </span>
              </div>
            </div>
            <p className="text-lg font-bold">
              Deadline: {formatDate(caseData.dueDate) || "Not set"}
            </p>
            <p className="text-sm mt-1">
              {caseData.property.address}
            </p>
          </CardContent>
        </Card>

        {/* Trust/Citation Line */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-6 px-1">
          <span className="flex items-center gap-1">
            <Scale className="h-3 w-3" />
            {getCoverageText()}
          </span>
          {verifiedDate && (
            <>
              <span>•</span>
              <span>Verified {verifiedDate}</span>
            </>
          )}
          {caseData.ruleSet.citations.length > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                Source: {caseData.ruleSet.citations[0].code}
                {caseData.ruleSet.citations[0].url && (
                  <a
                    href={caseData.ruleSet.citations[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </span>
            </>
          )}
        </div>

        {/* Draft Warning - only show if truly incomplete */}
        {isDraft && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">
                    Complete your case for final documents
                  </p>
                  <p className="text-amber-700 text-xs mt-1">
                    {!hasTenants && "Add tenant name/address. "}
                    {!hasDeductions && "Add your deductions. "}
                    <Link
                      href={`/cases/${caseId}`}
                      className="underline font-medium"
                    >
                      Open full case →
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Download Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Primary: Download Both */}
            <Button
              onClick={handleDownloadBoth}
              disabled={generatingBoth || generatingNotice || generatingItemized}
              className="w-full h-14 text-base mb-4"
              size="lg"
            >
              {generatingBoth ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating PDFs...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Download Both PDFs
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-muted-foreground">
                  or download individually
                </span>
              </div>
            </div>

            <div className="space-y-3 mt-3">
              {/* Notice Letter */}
              <div>
                <Button
                  onClick={() => handleDownload("notice_letter")}
                  disabled={generatingNotice || generatingBoth}
                  variant="outline"
                  className="w-full h-auto py-3 justify-between text-left"
                >
                  <span className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-500" />
                    <span className="flex flex-col items-start">
                      <span className="font-semibold text-sm">
                        Security Deposit Disposition Letter
                        {hasNoticeLetter && <span className="text-xs font-normal text-muted-foreground ml-1">(update)</span>}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Print + mail (keep delivery proof)
                      </span>
                    </span>
                  </span>
                  {generatingNotice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Itemized Statement */}
              <div>
                <Button
                  onClick={() => handleDownload("itemized_statement")}
                  disabled={generatingItemized || generatingBoth}
                  variant="outline"
                  className="w-full h-auto py-3 justify-between text-left"
                >
                  <span className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-500" />
                    <span className="flex flex-col items-start">
                      <span className="font-semibold text-sm">
                        Itemized Deductions Statement
                        {hasItemizedStatement && <span className="text-xs font-normal text-muted-foreground ml-1">(update)</span>}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Attach receipts/invoices if required
                      </span>
                    </span>
                  </span>
                  {generatingItemized ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-muted-foreground">
                    for your records
                  </span>
                </div>
              </div>

              {/* Full Proof Packet */}
              <Button
                onClick={handleDownloadPacket}
                disabled={downloadingPacket}
                variant="secondary"
                className="w-full h-auto py-3 justify-between text-left"
              >
                <span className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  <span className="flex flex-col items-start">
                    <span className="font-semibold text-sm">Full Proof Packet (ZIP)</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      All docs + audit trail for disputes
                    </span>
                  </span>
                </span>
                {downloadingPacket ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delivery reminder */}
        <Card className="mb-6 bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-sm text-slate-800 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              After downloading:
            </h3>
            <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal">
              <li>Print both documents</li>
              <li>
                Mail via{" "}
                <strong className="text-slate-700">
                  {caseData.ruleSet.allowedDeliveryMethods
                    .slice(0, 2)
                    .map(m => m.replace(/_/g, " ").toLowerCase())
                    .join(" or ")}
                </strong>
              </li>
              <li>Save your receipt/tracking number as proof</li>
            </ol>
          </CardContent>
        </Card>

        {/* Open Full Case Link */}
        <div className="text-center space-y-3">
          <Button
            onClick={() => router.push(`/cases/${caseId}`)}
            variant="outline"
            className="gap-2"
          >
            Open Full Case
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-xs text-muted-foreground">
            Add deductions, upload receipts, track delivery status
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            <Scale className="h-3 w-3 inline mr-1" />
            Educational tool only. Not legal advice.
            {" · "}
            <Link href="/" className="text-primary hover:underline">
              landlordcomply.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
