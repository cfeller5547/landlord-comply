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
  };
  ruleSet: {
    returnDeadlineDays: number;
    allowedDeliveryMethods: string[];
  };
  jurisdiction: {
    state: string;
    city: string | null;
    coverageLevel: string;
  };
  documents: Array<{
    id: string;
    type: string;
    version: number;
    generatedAt: string;
  }>;
  _count: {
    deductions: number;
  };
}

export default function PacketDownloadPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [generatingNotice, setGeneratingNotice] = useState(false);
  const [generatingItemized, setGeneratingItemized] = useState(false);
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

  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">LandlordComply</span>
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
            Download your compliant documents below
          </p>
        </div>

        {/* Deadline Card */}
        <Card className={cn("mb-6 border-2", getDeadlineColor())}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                {caseData.property.city}, {caseData.property.state}
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
              Deadline: {formatDate(caseData.dueDate)}
            </p>
            <p className="text-sm mt-1">
              {caseData.property.address}
            </p>
          </CardContent>
        </Card>

        {/* Download Buttons */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Download Your Documents
            </h2>

            <div className="space-y-3">
              {/* Notice Letter */}
              <Button
                onClick={() => handleDownload("notice_letter")}
                disabled={generatingNotice}
                className="w-full h-14 justify-between text-base"
                variant={hasNoticeLetter ? "outline" : "default"}
              >
                <span className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <span>
                    <span className="font-semibold">Notice Letter</span>
                    <span className="text-xs ml-2 opacity-75">
                      {hasNoticeLetter ? "(regenerate)" : ""}
                    </span>
                  </span>
                </span>
                {generatingNotice ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
              </Button>

              {/* Itemized Statement */}
              <Button
                onClick={() => handleDownload("itemized_statement")}
                disabled={generatingItemized}
                className="w-full h-14 justify-between text-base"
                variant={hasItemizedStatement ? "outline" : "default"}
              >
                <span className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <span>
                    <span className="font-semibold">Itemized Statement</span>
                    <span className="text-xs ml-2 opacity-75">
                      {hasItemizedStatement ? "(regenerate)" : ""}
                    </span>
                  </span>
                </span>
                {generatingItemized ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
              </Button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-muted-foreground">
                    or download everything
                  </span>
                </div>
              </div>

              {/* Full Proof Packet */}
              <Button
                onClick={handleDownloadPacket}
                disabled={downloadingPacket}
                variant="secondary"
                className="w-full h-14 justify-between text-base"
              >
                <span className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  <span>
                    <span className="font-semibold">Full Proof Packet</span>
                    <span className="text-xs ml-2 opacity-75">(ZIP with all docs + audit trail)</span>
                  </span>
                </span>
                {downloadingPacket ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* What's included */}
        <Card className="mb-6 bg-slate-50 border-slate-200">
          <CardContent className="p-5">
            <h3 className="font-medium text-sm text-slate-700 mb-3">
              Your documents include:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Compliant notice letter for {caseData.property.state}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Itemized deduction statement
                {caseData._count.deductions > 0 && ` (${caseData._count.deductions} deductions)`}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Legal citations and deadline calculations
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Delivery reminder */}
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="p-5">
            <h3 className="font-medium text-sm text-amber-800 mb-2">
              Remember to keep delivery proof:
            </h3>
            <p className="text-sm text-amber-700">
              Send via{" "}
              <strong>
                {caseData.ruleSet.allowedDeliveryMethods
                  .slice(0, 2)
                  .map(m => m.replace(/_/g, " "))
                  .join(" or ")}
              </strong>{" "}
              and save your receipt/tracking number.
            </p>
          </CardContent>
        </Card>

        {/* Open Full Case Link */}
        <div className="text-center space-y-4">
          <Button
            onClick={() => router.push(`/cases/${caseId}`)}
            variant="outline"
            className="gap-2"
          >
            Open Full Case
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-xs text-muted-foreground">
            Add deductions, upload receipts, track delivery, and more
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Questions?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us
            </Link>
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
