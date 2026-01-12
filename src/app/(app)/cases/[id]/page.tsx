"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DeadlineChip,
  CoverageBadge,
  StatusBadge,
  TrustBanner,
} from "@/components/domain";
import {
  CaseCreatedSurvey,
  FirstPacketSurvey,
  DeliveryCompleteSurvey,
  PricingSignalSurvey,
  FlowCompleteConcierge,
} from "@/components/feedback";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Send,
  CheckCircle,
  BookOpen,
  Plus,
  Trash2,
  Upload,
  Download,
  ExternalLink,
  AlertTriangle,
  Clock,
  X,
  FileDown,
  Package,
  Loader2,
  Sparkles,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Mail,
  MapPin,
  Copy,
  Check,
  Info,
  Calculator,
  ArrowRight,
} from "lucide-react";

// Types
interface Deduction {
  id: string;
  description: string;
  category: string;
  amount: number;
  notes?: string;
  attachmentIds: string[];
  riskLevel?: string | null;
  itemAge?: number | null;
  damageType?: string | null;
  hasEvidence: boolean;
  aiGenerated: boolean;
  originalDescription?: string;
}

interface CaseData {
  id: string;
  status: string;
  leaseStartDate: string;
  leaseEndDate: string;
  moveOutDate: string;
  depositAmount: number;
  depositInterest: number;
  dueDate: string;
  deliveryMethod?: string;
  trackingNumber?: string;
  sentDate?: string;
  deliveryAddress?: string;
  deliveryProofIds?: string[];
  closedAt?: string;
  closedReason?: string;
  property: {
    id: string;
    address: string;
    unit?: string;
    city: string;
    state: string;
    zipCode: string;
    jurisdiction: {
      id: string;
      state: string;
      stateCode: string;
      city: string | null;
      coverageLevel: string;
    };
  };
  tenants: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    forwardingAddress?: string;
    forwardingAddressStatus?: string;
    forwardingAddressRequestedAt?: string;
    forwardingAddressRequestMethod?: string;
    isPrimary: boolean;
  }>;
  ruleSet: {
    id: string;
    version: string;
    effectiveDate: string;
    verifiedAt?: string;
    returnDeadlineDays: number;
    returnDeadlineDescription?: string;
    interestRequired: boolean;
    interestRate?: number;
    interestRateSource?: string;
    itemizationRequired: boolean;
    itemizationRequirements?: string;
    maxDepositMonths?: number;
    allowedDeliveryMethods: string[];
    citations: Array<{
      id: string;
      code: string;
      title: string;
      url?: string;
      excerpt?: string;
    }>;
    penalties: Array<{
      id: string;
      condition: string;
      penalty: string;
      description?: string;
    }>;
  };
  deductions: Deduction[];
  documents: Array<{
    id: string;
    type: string;
    version: number;
    fileUrl?: string;
    generatedAt: string;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
  checklistItems: Array<{
    id: string;
    label: string;
    description?: string;
    completed: boolean;
    blocksExport: boolean;
    sortOrder: number;
  }>;
}

interface ExposureData {
  depositAmount: number;
  totalDeductions: number;
  refundAmount: number;
  daysUntilDeadline: number;
  isOverdue: boolean;
  penalties: Array<{
    condition: string;
    potentialPenalty: string;
    calculatedAmount: number | null;
    likelihood: string;
  }>;
  riskFactors: Array<{
    category: string;
    issue: string;
    severity: string;
  }>;
  minExposure: number;
  maxExposure: number;
  citations: Array<{ code: string; title: string | null; url: string | null }>;
}

interface QualityCheck {
  ready: boolean;
  score: number;
  checks: Array<{
    id: string;
    label: string;
    description: string;
    passed: boolean;
    severity: string;
    details?: string;
  }>;
  blockers: Array<{ id: string; label: string }>;
  warnings: Array<{ id: string; label: string }>;
}

// Risk badge colors
const riskColors = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-red-100 text-red-800 border-red-200",
};

// Forwarding address status labels
const forwardingStatusLabels: Record<string, { label: string; color: string }> =
  {
    NOT_REQUESTED: { label: "Not Requested", color: "bg-gray-100 text-gray-800" },
    REQUESTED: { label: "Requested", color: "bg-yellow-100 text-yellow-800" },
    PROVIDED: { label: "Provided", color: "bg-green-100 text-green-800" },
    REFUSED: { label: "Refused", color: "bg-red-100 text-red-800" },
    NOT_APPLICABLE: { label: "N/A", color: "bg-gray-100 text-gray-500" },
  };

export default function CaseWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  // State
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exposure, setExposure] = useState<ExposureData | null>(null);
  const [qualityCheck, setQualityCheck] = useState<QualityCheck | null>(null);

  // UI state
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [showForwardingDialog, setShowForwardingDialog] = useState(false);
  const [showExposureCard, setShowExposureCard] = useState(true);
  const [selectedDeduction, setSelectedDeduction] = useState<Deduction | null>(null);
  const [aiImproving, setAiImproving] = useState(false);
  const [aiResult, setAiResult] = useState<{ description: string; reasoning: string } | null>(null);
  const [showDocGeneratedSurvey, setShowDocGeneratedSurvey] = useState(false);
  const [showDeliverySurvey, setShowDeliverySurvey] = useState(false);

  // Form state for Mark as Sent
  const [sendForm, setSendForm] = useState({
    deliveryMethod: "",
    trackingNumber: "",
    sentDate: new Date().toISOString().split("T")[0],
    deliveryAddress: "",
  });

  // Form state for AI improvement
  const [aiForm, setAiForm] = useState({
    whatHappened: "",
    whereLocated: "",
    whyBeyondWear: "",
    invoiceInfo: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const deliveryProofInputRef = useRef<HTMLInputElement>(null);

  // Fetch case data with retry for race conditions
  const fetchCase = useCallback(async (retryCount = 0) => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const data = await res.json();

      if (!res.ok) {
        // If case not found and this is first attempt, retry after a short delay
        // This handles race conditions where the case was just created
        if (res.status === 404 && retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchCase(retryCount + 1);
        }
        throw new Error((data.error && data.details ? `${data.error}: ${data.details}` : data.error) || data.details || `Failed to fetch case (${res.status})`);
      }
      setCaseData(data);
    } catch (err) {
      console.error("Failed to load case:", err);
      setError(err instanceof Error ? err.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  // Fetch exposure data
  const fetchExposure = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/exposure`);
      if (res.ok) {
        const data = await res.json();
        setExposure(data);
      }
    } catch (err) {
      console.error("Failed to fetch exposure:", err);
    }
  }, [caseId]);

  // Fetch quality check
  const fetchQualityCheck = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/quality-check`);
      if (res.ok) {
        const data = await res.json();
        setQualityCheck(data);
      }
    } catch (err) {
      console.error("Failed to fetch quality check:", err);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
    fetchExposure();
    fetchQualityCheck();
  }, [fetchCase, fetchExposure, fetchQualityCheck]);

  // Generate PDF
  const handleGeneratePdf = async (type: "notice_letter" | "itemized_statement") => {
    setGeneratingPdf(type);
    try {
      const res = await fetch(`/api/cases/${caseId}/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type.replace("_", "-")}-${caseId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      await fetchCase();
      await fetchQualityCheck();

      // Trigger document generated survey
      setShowDocGeneratedSurvey(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setGeneratingPdf(null);
    }
  };

  // File upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isDeliveryProof = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        if (isDeliveryProof) {
          formData.append("tags", "delivery_proof");
        }

        const res = await fetch(`/api/cases/${caseId}/attachments`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to upload file");
        }
      }
      await fetchCase();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (deliveryProofInputRef.current) deliveryProofInputRef.current.value = "";
    }
  };

  // Toggle checklist item
  const handleToggleChecklist = async (itemId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, completed }),
      });
      if (!res.ok) throw new Error("Failed to update checklist");
      await fetchCase();
      await fetchQualityCheck();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update checklist");
    }
  };

  // Mark as sent
  const handleMarkAsSent = async () => {
    if (!sendForm.deliveryMethod) {
      alert("Please select a delivery method");
      return;
    }

    try {
      const deliveryProofIds = caseData?.attachments
        .filter((a) => a.type === "DELIVERY_PROOF")
        .map((a) => a.id) || [];

      const res = await fetch(`/api/cases/${caseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SENT",
          ...sendForm,
          deliveryProofIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }

      setShowSendDialog(false);
      await fetchCase();
      await fetchQualityCheck();

      // Trigger delivery complete survey
      setShowDeliverySurvey(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark as sent");
    }
  };

  // Close case
  const handleCloseCase = async (reason: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CLOSED",
          closedReason: reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to close case");
      }

      setShowCloseDialog(false);
      await fetchCase();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to close case");
    }
  };

  // AI improve deduction - generate suggestion
  const handleAiImprove = async () => {
    if (!selectedDeduction) return;

    setAiImproving(true);
    try {
      const res = await fetch(`/api/deductions/${selectedDeduction.id}/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to improve description");
      }

      const result = await res.json();
      // Store result for review instead of auto-applying
      setAiResult(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to improve description");
    } finally {
      setAiImproving(false);
    }
  };

  // Accept AI suggestion and update deduction
  const handleAcceptAiSuggestion = async () => {
    if (!selectedDeduction || !aiResult) return;

    try {
      const res = await fetch(`/api/cases/${caseId}/deductions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDeduction.id,
          description: aiResult.description,
          aiGenerated: true,
          originalDescription: selectedDeduction.originalDescription || selectedDeduction.description,
        }),
      });

      if (!res.ok) throw new Error("Failed to update deduction");

      toast.success("Description updated successfully");
      setShowAiDialog(false);
      setAiResult(null);
      setAiForm({ whatHappened: "", whereLocated: "", whyBeyondWear: "", invoiceInfo: "" });
      await fetchCase();
    } catch (err) {
      toast.error("Failed to apply improved description");
    }
  };

  // Reject AI suggestion and go back to input form
  const handleRejectAiSuggestion = () => {
    setAiResult(null);
  };

  // Close AI dialog and reset state
  const handleCloseAiDialog = () => {
    setShowAiDialog(false);
    setAiResult(null);
    setAiForm({ whatHappened: "", whereLocated: "", whyBeyondWear: "", invoiceInfo: "" });
  };

  // Update forwarding address status
  const handleForwardingAddressUpdate = async (tenantId: string, status: string, address?: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/tenants/${tenantId}/forwarding-address`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          forwardingAddress: address,
          requestMethod: status === "REQUESTED" ? "email" : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update forwarding address");
      await fetchCase();
      await fetchQualityCheck();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    }
  };

  // Copy forwarding address template
  const copyForwardingTemplate = async (tenantId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/tenants/${tenantId}/forwarding-address?format=email`);
      if (!res.ok) throw new Error("Failed to get template");
      const template = await res.json();
      await navigator.clipboard.writeText(`Subject: ${template.subject}\n\n${template.body}`);
      alert("Email template copied to clipboard!");
    } catch (err) {
      alert("Failed to copy template");
    }
  };

  // Update deduction risk info
  const handleUpdateDeductionRisk = async (deductionId: string, updates: Partial<Deduction>) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/deductions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deductionId, ...updates }),
      });

      if (!res.ok) throw new Error("Failed to update deduction");
      await fetchCase();
      await fetchExposure();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update deduction");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground mt-2">{error || "Case not found"}</p>
          <Button asChild className="mt-4">
            <Link href="/cases">Back to Cases</Link>
          </Button>
        </div>
      </div>
    );
  }

  const primaryTenant = caseData.tenants.find((t) => t.isPrimary) || caseData.tenants[0];
  const totalDeductions = caseData.deductions.reduce((sum, d) => sum + Number(d.amount), 0);
  const refundAmount = Number(caseData.depositAmount) + Number(caseData.depositInterest) - totalDeductions;
  const isClosed = caseData.status === "CLOSED";
  const isSent = caseData.status === "SENT";

  // Convert status to lowercase for StatusBadge component
  const displayStatus = caseData.status.toLowerCase() as "active" | "pending_send" | "sent" | "closed";

  // Calculate days left for DeadlineChip
  const dueDate = new Date(caseData.dueDate);
  const now = new Date();
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {caseData.property.address}
              {caseData.property.unit && `, Unit ${caseData.property.unit}`}
            </h1>
            <p className="text-muted-foreground">
              {primaryTenant?.name} | Move-out:{" "}
              {new Date(caseData.moveOutDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={displayStatus} />
          <DeadlineChip
            dueDate={dueDate}
            daysLeft={daysLeft}
          />
        </div>
      </div>

      {/* Exposure Calculator Banner */}
      {exposure && !isClosed && (
        <Collapsible open={showExposureCard} onOpenChange={setShowExposureCard}>
          <Card className={cn(
            "mb-6 border-2",
            exposure.isOverdue ? "border-red-300 bg-red-50" :
            exposure.maxExposure > 0 ? "border-yellow-300 bg-yellow-50" : "border-green-300 bg-green-50"
          )}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-black/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">Penalty Exposure Calculator</CardTitle>
                      <CardDescription>
                        {exposure.isOverdue
                          ? `OVERDUE by ${Math.abs(exposure.daysUntilDeadline)} days!`
                          : `${exposure.daysUntilDeadline} days until deadline`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Potential Exposure</p>
                      <p className="text-xl font-bold text-red-600">
                        ${exposure.maxExposure.toLocaleString()}
                      </p>
                    </div>
                    {showExposureCard ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Penalties */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Potential Penalties
                    </h4>
                    <div className="space-y-2">
                      {exposure.penalties.map((penalty, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-white rounded border"
                        >
                          <div>
                            <p className="text-sm font-medium">{penalty.condition}</p>
                            <p className="text-xs text-muted-foreground">
                              {penalty.potentialPenalty}
                            </p>
                          </div>
                          <div className="text-right">
                            {penalty.calculatedAmount && (
                              <p className="font-medium">
                                ${penalty.calculatedAmount.toLocaleString()}
                              </p>
                            )}
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                penalty.likelihood === "HIGH"
                                  ? "border-red-500 text-red-700"
                                  : penalty.likelihood === "MEDIUM"
                                  ? "border-yellow-500 text-yellow-700"
                                  : "border-green-500 text-green-700"
                              )}
                            >
                              {penalty.likelihood} risk
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Risk Factors
                    </h4>
                    <div className="space-y-2">
                      {exposure.riskFactors.map((factor, i) => (
                        <div
                          key={i}
                          className={cn(
                            "p-2 rounded border",
                            factor.severity === "HIGH"
                              ? "bg-red-50 border-red-200"
                              : factor.severity === "MEDIUM"
                              ? "bg-yellow-50 border-yellow-200"
                              : "bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {factor.category}
                            </Badge>
                            <span className="text-sm">{factor.issue}</span>
                          </div>
                        </div>
                      ))}
                      {exposure.riskFactors.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No significant risk factors identified
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Citations */}
                {exposure.citations.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Based on: {exposure.citations.map((c) => c.code).join(", ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Quality Check Banner */}
      {qualityCheck && !isClosed && (
        <Card className={cn(
          "mb-6",
          qualityCheck.ready
            ? "border-green-300 bg-green-50"
            : "border-yellow-300 bg-yellow-50"
        )}>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {qualityCheck.ready ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <CardTitle className="text-base">
                    {qualityCheck.ready
                      ? "Ready to Send"
                      : `Fix ${qualityCheck.blockers.length} issue(s) before sending`}
                  </CardTitle>
                  <CardDescription>
                    Quality score: {qualityCheck.score}% |{" "}
                    {qualityCheck.checks.filter((c) => c.passed).length}/{qualityCheck.checks.length} checks passed
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                {qualityCheck.blockers.map((blocker) => (
                  <Badge key={blocker.id} variant="destructive" className="text-xs">
                    {blocker.label}
                  </Badge>
                ))}
                {qualityCheck.warnings.slice(0, 2).map((warning) => (
                  <Badge key={warning.id} variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                    {warning.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              <CardDescription>
                Generate compliant notice letters and statements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Notice Letter</h4>
                    {caseData.documents.some((d) => d.type === "NOTICE_LETTER") && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Generated
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Official notice to tenant with deposit disposition
                  </p>
                  <Button
                    onClick={() => handleGeneratePdf("notice_letter")}
                    disabled={generatingPdf !== null || isClosed}
                    className="w-full"
                  >
                    {generatingPdf === "notice_letter" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4 mr-2" />
                    )}
                    {caseData.documents.some((d) => d.type === "NOTICE_LETTER")
                      ? "Regenerate"
                      : "Generate"}
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Itemized Statement</h4>
                    {caseData.documents.some((d) => d.type === "ITEMIZED_STATEMENT") && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Generated
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Detailed breakdown of all deductions
                  </p>
                  <Button
                    onClick={() => handleGeneratePdf("itemized_statement")}
                    disabled={generatingPdf !== null || isClosed}
                    variant="outline"
                    className="w-full"
                  >
                    {generatingPdf === "itemized_statement" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4 mr-2" />
                    )}
                    {caseData.documents.some((d) => d.type === "ITEMIZED_STATEMENT")
                      ? "Regenerate"
                      : "Generate"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deductions with Risk Assessment */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Deductions
                  </CardTitle>
                  <CardDescription>
                    Itemized deductions with risk assessment
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Deductions</p>
                  <p className="text-xl font-bold">${totalDeductions.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {caseData.deductions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No deductions added yet
                </p>
              ) : (
                <div className="space-y-4">
                  {caseData.deductions.map((deduction) => (
                    <div
                      key={deduction.id}
                      className={cn(
                        "p-4 border rounded-lg",
                        deduction.riskLevel === "HIGH"
                          ? "border-red-200 bg-red-50"
                          : deduction.riskLevel === "MEDIUM"
                          ? "border-yellow-200 bg-yellow-50"
                          : ""
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{deduction.category}</Badge>
                            {deduction.riskLevel && (
                              <Badge className={cn("text-xs", riskColors[deduction.riskLevel as keyof typeof riskColors])}>
                                {deduction.riskLevel} Risk
                              </Badge>
                            )}
                            {deduction.aiGenerated && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      AI
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Description improved with AI</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {!deduction.hasEvidence && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>No evidence attached</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <p className="font-medium">{deduction.description}</p>
                          {deduction.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {deduction.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            {deduction.itemAge && (
                              <span className="text-muted-foreground">
                                Item age: {deduction.itemAge} months
                              </span>
                            )}
                            {deduction.damageType && (
                              <span className="text-muted-foreground">
                                {deduction.damageType.replace("_", " ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-lg">
                            ${Number(deduction.amount).toFixed(2)}
                          </span>
                          {!isClosed && !deduction.aiGenerated && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                              onClick={() => {
                                setSelectedDeduction(deduction);
                                setShowAiDialog(true);
                              }}
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                              Improve with AI
                            </Button>
                          )}
                          {deduction.aiGenerated && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                              <Sparkles className="h-3 w-3" />
                              AI-improved
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Risk Assessment Controls */}
                      {!isClosed && (
                        <div className="mt-3 pt-3 border-t flex flex-wrap gap-3">
                          <Select
                            value={deduction.damageType || ""}
                            onValueChange={(value) =>
                              handleUpdateDeductionRisk(deduction.id, { damageType: value })
                            }
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue placeholder="Damage type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BEYOND_NORMAL">Beyond normal use</SelectItem>
                              <SelectItem value="NORMAL_WEAR">Normal wear/tear</SelectItem>
                              <SelectItem value="INTENTIONAL">Intentional damage</SelectItem>
                              <SelectItem value="NEGLIGENCE">Negligence</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Age (months)"
                              className="w-28 h-8 text-xs"
                              value={deduction.itemAge || ""}
                              onChange={(e) =>
                                handleUpdateDeductionRisk(deduction.id, {
                                  itemAge: e.target.value ? parseInt(e.target.value) : null,
                                })
                              }
                            />
                          </div>

                          <Select
                            value={deduction.riskLevel || ""}
                            onValueChange={(value) =>
                              handleUpdateDeductionRisk(deduction.id, { riskLevel: value })
                            }
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder="Risk level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low Risk</SelectItem>
                              <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                              <SelectItem value="HIGH">High Risk</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Refund Summary */}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Deposit + Interest</span>
                  <span>
                    ${(Number(caseData.depositAmount) + Number(caseData.depositInterest)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Less Deductions</span>
                  <span>-${totalDeductions.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>{refundAmount >= 0 ? "Refund Due" : "Amount Owed"}</span>
                  <span className={refundAmount >= 0 ? "text-green-600" : "text-red-600"}>
                    ${Math.abs(refundAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence & Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Evidence & Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  uploadingFile ? "border-primary bg-primary/5" : "hover:border-primary hover:bg-muted/50"
                )}
                onClick={() => !isClosed && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e)}
                  disabled={isClosed}
                />
                {uploadingFile ? (
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                ) : (
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {uploadingFile
                    ? "Uploading..."
                    : "Click to upload photos, receipts, or documents"}
                </p>
              </div>

              {caseData.attachments.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {caseData.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="p-3 border rounded-lg flex items-center gap-2"
                    >
                      {attachment.type === "PHOTO" ? (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm truncate flex-1">{attachment.name}</span>
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Forwarding Address Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Forwarding Address
              </CardTitle>
              <CardDescription>
                Never get burned by missing forwarding address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {primaryTenant && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{primaryTenant.name}</span>
                    <Badge
                      className={cn(
                        "text-xs",
                        forwardingStatusLabels[primaryTenant.forwardingAddressStatus || "NOT_REQUESTED"]?.color
                      )}
                    >
                      {forwardingStatusLabels[primaryTenant.forwardingAddressStatus || "NOT_REQUESTED"]?.label}
                    </Badge>
                  </div>

                  {primaryTenant.forwardingAddress ? (
                    <p className="text-sm p-2 bg-muted rounded">
                      {primaryTenant.forwardingAddress}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {primaryTenant.forwardingAddressStatus === "REQUESTED" && (
                        <p className="text-xs text-muted-foreground">
                          Requested on{" "}
                          {primaryTenant.forwardingAddressRequestedAt
                            ? new Date(primaryTenant.forwardingAddressRequestedAt).toLocaleDateString()
                            : "N/A"}{" "}
                          via {primaryTenant.forwardingAddressRequestMethod || "unknown"}
                        </p>
                      )}

                      {!isClosed && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => copyForwardingTemplate(primaryTenant.id)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Template
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleForwardingAddressUpdate(primaryTenant.id, "REQUESTED")
                            }
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Mark Requested
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Methods Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-4 w-4" />
                Allowed Delivery Methods
              </CardTitle>
              <CardDescription>
                {caseData.property.jurisdiction.city || caseData.property.jurisdiction.state} requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {caseData.ruleSet.allowedDeliveryMethods.map((method) => (
                  <div
                    key={method}
                    className="flex items-center gap-2 p-2 bg-muted rounded"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm capitalize">{method.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-4 w-4" />
                Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {caseData.checklistItems
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) =>
                          handleToggleChecklist(item.id, checked as boolean)
                        }
                        disabled={isClosed}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          item.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.blocksExport && !item.completed && (
                        <Badge variant="destructive" className="text-xs ml-auto">
                          Required
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Legal References */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Legal References
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {caseData.ruleSet.citations.map((citation) => (
                  <div key={citation.id} className="text-sm">
                    {citation.url ? (
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {citation.code}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span>{citation.code}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {!isClosed && (
            <div className="space-y-3">
              {caseData.status !== "SENT" && (
                <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <Send className="h-4 w-4 mr-2" />
                      Mark as Sent
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Record Delivery Details</DialogTitle>
                      <DialogDescription>
                        Not just a letter—proof you sent it correctly.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Delivery Method *</Label>
                        <Select
                          value={sendForm.deliveryMethod}
                          onValueChange={(value) =>
                            setSendForm({ ...sendForm, deliveryMethod: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            {caseData.ruleSet.allowedDeliveryMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Delivery Address</Label>
                        <Input
                          value={sendForm.deliveryAddress}
                          onChange={(e) =>
                            setSendForm({ ...sendForm, deliveryAddress: e.target.value })
                          }
                          placeholder="Address used for delivery"
                        />
                      </div>

                      <div>
                        <Label>Date Sent</Label>
                        <Input
                          type="date"
                          value={sendForm.sentDate}
                          onChange={(e) =>
                            setSendForm({ ...sendForm, sentDate: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label>Tracking Number (optional)</Label>
                        <Input
                          value={sendForm.trackingNumber}
                          onChange={(e) =>
                            setSendForm({ ...sendForm, trackingNumber: e.target.value })
                          }
                          placeholder="USPS, FedEx, etc."
                        />
                      </div>

                      <div>
                        <Label>Delivery Proof</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Upload USPS receipt, certified mail slip, or email screenshot
                        </p>
                        <input
                          ref={deliveryProofInputRef}
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, true)}
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => deliveryProofInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Proof
                        </Button>
                        {caseData.attachments.filter((a) => a.type === "DELIVERY_PROOF").length > 0 && (
                          <p className="text-xs text-green-600 mt-2">
                            {caseData.attachments.filter((a) => a.type === "DELIVERY_PROOF").length} delivery proof file(s) uploaded
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleMarkAsSent}>
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Sent
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Close Case
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Close Case</DialogTitle>
                    <DialogDescription>
                      Select a reason for closing this case.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 py-4">
                    {[
                      "Deposit returned to tenant",
                      "Tenant dispute resolved",
                      "Case withdrawn",
                      "Other",
                    ].map((reason) => (
                      <Button
                        key={reason}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleCloseCase(reason)}
                      >
                        {reason}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Closed Case Info */}
          {isClosed && (
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <h3 className="font-medium">Case Closed</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {caseData.closedAt
                      ? new Date(caseData.closedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                  {caseData.closedReason && (
                    <p className="text-sm mt-2">{caseData.closedReason}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* AI Improve Dialog */}
      <Dialog open={showAiDialog} onOpenChange={handleCloseAiDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {aiResult ? "Review AI Suggestion" : "Improve Description with AI"}
            </DialogTitle>
            <DialogDescription>
              {aiResult
                ? "Review the AI-generated description below. Accept to use it, or try again with different context."
                : "Write deductions that hold up in court. Provide context for better results."}
            </DialogDescription>
          </DialogHeader>

          {selectedDeduction && !aiResult && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Current Description:</p>
                <p className="text-sm mt-1">{selectedDeduction.description}</p>
              </div>

              <div>
                <Label>What happened?</Label>
                <Textarea
                  value={aiForm.whatHappened}
                  onChange={(e) => setAiForm({ ...aiForm, whatHappened: e.target.value })}
                  placeholder="Describe the damage or issue in detail..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Where is it located?</Label>
                <Input
                  value={aiForm.whereLocated}
                  onChange={(e) => setAiForm({ ...aiForm, whereLocated: e.target.value })}
                  placeholder="e.g., Master bedroom, north wall"
                />
              </div>

              <div>
                <Label>Why is this beyond normal wear and tear?</Label>
                <Textarea
                  value={aiForm.whyBeyondWear}
                  onChange={(e) => setAiForm({ ...aiForm, whyBeyondWear: e.target.value })}
                  placeholder="Explain what makes this damage unusual..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Invoice or repair details (optional)</Label>
                <Input
                  value={aiForm.invoiceInfo}
                  onChange={(e) => setAiForm({ ...aiForm, invoiceInfo: e.target.value })}
                  placeholder="e.g., ABC Plumbing, Invoice #1234, $250"
                />
              </div>
            </div>
          )}

          {/* AI Result Review Phase */}
          {selectedDeduction && aiResult && (
            <div className="space-y-4 py-4">
              {/* Original Description */}
              <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Original</p>
                <p className="text-sm">{selectedDeduction.description}</p>
              </div>

              {/* Arrow indicator */}
              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
              </div>

              {/* AI Improved Description */}
              <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">AI-Improved</p>
                </div>
                <p className="text-sm font-medium">{aiResult.description}</p>
              </div>

              {/* AI Reasoning */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-1">Why this is better</p>
                <p className="text-sm text-amber-900">{aiResult.reasoning}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {!aiResult ? (
              <>
                <Button variant="outline" onClick={handleCloseAiDialog}>
                  Cancel
                </Button>
                <Button onClick={handleAiImprove} disabled={aiImproving}>
                  {aiImproving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Suggestion
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleRejectAiSuggestion}>
                  Try Again
                </Button>
                <Button onClick={handleAcceptAiSuggestion} className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Use This Description
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Beta Feedback Micro-surveys */}
      {/* Show case created survey on first visit */}
      <CaseCreatedSurvey caseId={caseData.id} />

      {/* Show confidence survey after document generation */}
      {showDocGeneratedSurvey && <FirstPacketSurvey caseId={caseData.id} />}

      {/* Show confidence survey after marking delivery complete */}
      {showDeliverySurvey && <DeliveryCompleteSurvey caseId={caseData.id} />}

      {/* Show pricing signal survey when case has documents (for export) */}
      {caseData.documents.length > 0 && caseData.status === "SENT" && (
        <PricingSignalSurvey caseId={caseData.id} />
      )}

      {/* Show concierge follow-up when full flow is complete (closed + sent + has documents) */}
      {isClosed && caseData.deliveryMethod && caseData.documents.length > 0 && (
        <FlowCompleteConcierge caseId={caseData.id} />
      )}
    </div>
  );
}
