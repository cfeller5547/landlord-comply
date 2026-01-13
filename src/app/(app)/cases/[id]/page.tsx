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
  CaseProgress,
  calculateWorkflowSteps,
  calculateConfidence,
  DeductionDrawer,
  DeductionRow,
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
  Eye,
  SkipForward,
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

  // Add Deduction dialog state
  const [showAddDeductionDialog, setShowAddDeductionDialog] = useState(false);
  const [addingDeduction, setAddingDeduction] = useState(false);
  const [deductionForm, setDeductionForm] = useState({
    description: "",
    category: "REPAIRS" as "CLEANING" | "REPAIRS" | "UNPAID_RENT" | "UTILITIES" | "DAMAGES" | "OTHER",
    amount: "",
    notes: "",
  });

  // Deduction drawer state
  const [selectedDeductionForEdit, setSelectedDeductionForEdit] = useState<Deduction | null>(null);
  const [isDeductionDrawerOpen, setIsDeductionDrawerOpen] = useState(false);

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
        throw new Error((err.error && err.details ? `${err.error}: ${err.details}` : err.error) || "Failed to generate PDF");
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

  // Add deduction
  const handleAddDeduction = async () => {
    if (!deductionForm.description.trim() || !deductionForm.amount) {
      toast.error("Please fill in description and amount");
      return;
    }

    const amount = parseFloat(deductionForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setAddingDeduction(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/deductions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: deductionForm.description.trim(),
          category: deductionForm.category,
          amount: amount,
          notes: deductionForm.notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add deduction");
      }

      toast.success("Deduction added successfully");
      setShowAddDeductionDialog(false);
      setDeductionForm({
        description: "",
        category: "REPAIRS",
        amount: "",
        notes: "",
      });
      await fetchCase();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add deduction");
    } finally {
      setAddingDeduction(false);
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
          throw new Error((err.error && err.details ? `${err.error}: ${err.details}` : err.error) || "Failed to upload file");
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
      toast.success("Email template copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy template");
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

  // Delete deduction
  const handleDeleteDeduction = async (deductionId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/deductions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deductionId }),
      });

      if (!res.ok) throw new Error("Failed to delete deduction");
      await fetchCase();
      await fetchExposure();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete deduction");
    }
  };

  // Open deduction for editing in drawer
  const handleOpenDeductionDrawer = (deduction: Deduction) => {
    setSelectedDeductionForEdit(deduction);
    setIsDeductionDrawerOpen(true);
  };

  // Close deduction drawer
  const handleCloseDeductionDrawer = () => {
    setIsDeductionDrawerOpen(false);
    setSelectedDeductionForEdit(null);
  };

  // Attach evidence to deduction (opens file picker)
  const handleAttachEvidenceToDeduction = (deductionId: string) => {
    // Store the deduction ID for when file is uploaded
    // For now, just trigger file upload - evidence linking would need a backend enhancement
    fileInputRef.current?.click();
    toast.info("Upload evidence, then link it to this deduction in the drawer");
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

      {/* Guided Workflow Progress */}
      {!isClosed && (() => {
        const daysLeft = Math.ceil(
          (new Date(caseData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return (
          <CaseProgress
            steps={calculateWorkflowSteps(caseData)}
            confidenceLevel={calculateConfidence(qualityCheck, daysLeft).level}
            confidenceMessage={calculateConfidence(qualityCheck, daysLeft).message}
            daysLeft={daysLeft}
            dueDate={new Date(caseData.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          />
        );
      })()}

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
                {/* Notice Letter */}
                {(() => {
                  const noticeDoc = caseData.documents.find((d) => d.type === "NOTICE_LETTER");
                  const isSent = caseData.status === "SENT" || caseData.status === "CLOSED";
                  return (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Notice Letter</h4>
                        {noticeDoc && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Saved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Official notice to tenant with deposit disposition
                      </p>
                      {noticeDoc && (
                        <p className="text-xs text-muted-foreground mb-3">
                          Generated {new Date(noticeDoc.generatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })} • v{noticeDoc.version}
                        </p>
                      )}
                      {noticeDoc ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              className="flex-1"
                              onClick={() => {
                                window.open(`/api/cases/${caseId}/documents/${noticeDoc.id}/download`, "_blank");
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                window.open(`/api/cases/${caseId}/documents/${noticeDoc.id}/download`, "_blank");
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                          {!isSent ? (
                            <div className="space-y-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground"
                                onClick={() => handleGeneratePdf("notice_letter")}
                                disabled={generatingPdf !== null || isClosed}
                              >
                                {generatingPdf === "notice_letter" ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <FileDown className="h-3 w-3 mr-1" />
                                )}
                                Update
                              </Button>
                              <p className="text-[10px] text-center text-muted-foreground">
                                Previous versions kept for your records
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-center text-muted-foreground py-2">
                              <Shield className="h-3 w-3 inline mr-1" />
                              Version locked — case marked as sent
                            </p>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleGeneratePdf("notice_letter")}
                          disabled={generatingPdf !== null || isClosed}
                          className="w-full mt-2"
                        >
                          {generatingPdf === "notice_letter" ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4 mr-2" />
                          )}
                          Generate
                        </Button>
                      )}
                    </div>
                  );
                })()}

                {/* Itemized Statement */}
                {(() => {
                  const itemizedDoc = caseData.documents.find((d) => d.type === "ITEMIZED_STATEMENT");
                  const isSent = caseData.status === "SENT" || caseData.status === "CLOSED";
                  return (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Itemized Statement</h4>
                        {itemizedDoc && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Saved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Detailed breakdown of all deductions
                      </p>
                      {itemizedDoc && (
                        <p className="text-xs text-muted-foreground mb-3">
                          Generated {new Date(itemizedDoc.generatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })} • v{itemizedDoc.version}
                        </p>
                      )}
                      {itemizedDoc ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              className="flex-1"
                              onClick={() => {
                                window.open(`/api/cases/${caseId}/documents/${itemizedDoc.id}/download`, "_blank");
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                window.open(`/api/cases/${caseId}/documents/${itemizedDoc.id}/download`, "_blank");
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                          {!isSent ? (
                            <div className="space-y-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground"
                                onClick={() => handleGeneratePdf("itemized_statement")}
                                disabled={generatingPdf !== null || isClosed}
                              >
                                {generatingPdf === "itemized_statement" ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <FileDown className="h-3 w-3 mr-1" />
                                )}
                                Update
                              </Button>
                              <p className="text-[10px] text-center text-muted-foreground">
                                Previous versions kept for your records
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-center text-muted-foreground py-2">
                              <Shield className="h-3 w-3 inline mr-1" />
                              Version locked — case marked as sent
                            </p>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleGeneratePdf("itemized_statement")}
                          disabled={generatingPdf !== null || isClosed}
                          variant="outline"
                          className="w-full mt-2"
                        >
                          {generatingPdf === "itemized_statement" ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4 mr-2" />
                          )}
                          Generate
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Proof Packet - Workflow Climax */}
              {(() => {
                const hasNoticeLetter = caseData.documents.some((d) => d.type === "NOTICE_LETTER");
                const hasItemized = caseData.documents.some((d) => d.type === "ITEMIZED_STATEMENT");
                const isReady = hasNoticeLetter && hasItemized;
                const isSent = caseData.status === "SENT" || caseData.status === "CLOSED";

                return (
                  <div className={cn(
                    "p-4 border-2 rounded-lg mt-4",
                    isReady ? "border-primary bg-primary/5" : "border-dashed border-muted-foreground/30"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <h4 className="font-medium">Proof Packet</h4>
                      </div>
                      {isReady && (
                        <Badge className="bg-primary text-primary-foreground">
                          Ready to Export
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete ZIP archive with all documents, evidence, audit trail, and jurisdiction citations for your records.
                    </p>

                    {isReady ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Notice Letter
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Itemized Statement
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {caseData.attachments.length} Attachment{caseData.attachments.length !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Audit Log
                          </span>
                        </div>
                        <Button
                          className="w-full"
                          size="lg"
                          disabled={isClosed}
                          onClick={() => {
                            toast.info("Proof packet export coming soon!", {
                              description: "This feature will bundle all case documents into a court-ready ZIP archive."
                            });
                          }}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Download Proof Packet
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground">
                          Everything you need if a dispute arises
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {hasNoticeLetter ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            )}
                            Notice Letter
                          </span>
                          <span className="flex items-center gap-1">
                            {hasItemized ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            )}
                            Itemized Statement
                          </span>
                        </div>
                        <p className="text-xs text-center text-muted-foreground py-2">
                          Generate both documents above to unlock the Proof Packet
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
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
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No deductions added yet</p>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <SkipForward className="h-3.5 w-3.5" />
                      Returning the full deposit?
                    </span>{" "}
                    You can skip this section and proceed to generate documents.
                  </p>
                  {!isClosed && (
                    <Button variant="outline" onClick={() => setShowAddDeductionDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Deduction
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Compact deduction list */}
                  {caseData.deductions.map((deduction) => (
                    <DeductionRow
                      key={deduction.id}
                      deduction={deduction}
                      onClick={() => handleOpenDeductionDrawer(deduction)}
                      isClosed={isClosed}
                    />
                  ))}

                  {/* Add Deduction button */}
                  {!isClosed && (
                    <Button
                      variant="outline"
                      className="w-full border-dashed"
                      onClick={() => setShowAddDeductionDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Deduction
                    </Button>
                  )}
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

          {/* Delivery Proof Section - Dedicated Step */}
          {caseData.status !== "CLOSED" && (
            <Card className={cn(
              caseData.documents.some((d) => d.type === "NOTICE_LETTER") && !caseData.sentDate
                ? "border-primary/50 shadow-sm"
                : ""
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Record Delivery
                    </CardTitle>
                    <CardDescription>
                      Prove you sent it correctly — your strongest protection
                    </CardDescription>
                  </div>
                  {caseData.sentDate && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Sent
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {caseData.sentDate ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        Sent on {new Date(caseData.sentDate).toLocaleDateString()} via{" "}
                        <span className="font-medium capitalize">
                          {caseData.deliveryMethod?.replace("_", " ") || "mail"}
                        </span>
                      </p>
                      {caseData.trackingNumber && (
                        <p className="text-xs text-green-700 mt-1">
                          Tracking: {caseData.trackingNumber}
                        </p>
                      )}
                    </div>
                    {caseData.attachments.filter((a) => a.type === "DELIVERY_PROOF").length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Delivery Proof Files:</p>
                        <div className="flex flex-wrap gap-2">
                          {caseData.attachments
                            .filter((a) => a.type === "DELIVERY_PROOF")
                            .map((proof) => (
                              <a
                                key={proof.id}
                                href={proof.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80"
                              >
                                <FileText className="h-3 w-3" />
                                {proof.name}
                              </a>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Delivery Method *</Label>
                        <Select
                          value={sendForm.deliveryMethod}
                          onValueChange={(value) =>
                            setSendForm({ ...sendForm, deliveryMethod: value })
                          }
                        >
                          <SelectTrigger className="mt-1.5">
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
                        <Label>Date Sent *</Label>
                        <Input
                          type="date"
                          className="mt-1.5"
                          value={sendForm.sentDate}
                          onChange={(e) =>
                            setSendForm({ ...sendForm, sentDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Delivery Address</Label>
                      <Input
                        className="mt-1.5"
                        value={sendForm.deliveryAddress}
                        onChange={(e) =>
                          setSendForm({ ...sendForm, deliveryAddress: e.target.value })
                        }
                        placeholder={primaryTenant?.forwardingAddress || "Enter delivery address"}
                      />
                    </div>

                    <div>
                      <Label>Tracking Number (optional)</Label>
                      <Input
                        className="mt-1.5"
                        value={sendForm.trackingNumber}
                        onChange={(e) =>
                          setSendForm({ ...sendForm, trackingNumber: e.target.value })
                        }
                        placeholder="USPS, FedEx, UPS tracking"
                      />
                    </div>

                    <div>
                      <Label>Upload Delivery Proof</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        USPS receipt, certified mail slip, email confirmation, etc.
                      </p>
                      <div
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                        onClick={() => deliveryProofInputRef.current?.click()}
                      >
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-1">
                          Click to upload proof
                        </p>
                      </div>
                      {caseData.attachments.filter((a) => a.type === "DELIVERY_PROOF").length > 0 && (
                        <p className="text-xs text-green-600 mt-2">
                          {caseData.attachments.filter((a) => a.type === "DELIVERY_PROOF").length} file(s) uploaded
                        </p>
                      )}
                    </div>

                    {/* Show warning if case isn't ready */}
                    {(() => {
                      const hasNoticeLetter = caseData.documents.some((d) => d.type === "NOTICE_LETTER");
                      const hasBlockers = qualityCheck?.blockers && qualityCheck.blockers.length > 0;
                      const isReady = hasNoticeLetter && !hasBlockers;

                      if (!isReady) {
                        return (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="font-medium text-yellow-800">Not ready to send yet</p>
                                <ul className="mt-1 text-yellow-700 space-y-0.5">
                                  {!hasNoticeLetter && <li>• Generate Notice Letter first</li>}
                                  {hasBlockers && qualityCheck?.blockers.map((b) => (
                                    <li key={b.id}>• {b.label}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleMarkAsSent}
                      disabled={
                        !sendForm.deliveryMethod ||
                        !sendForm.sentDate ||
                        !caseData.documents.some((d) => d.type === "NOTICE_LETTER") ||
                        (qualityCheck?.blockers && qualityCheck.blockers.length > 0)
                      }
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirm Sent
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
                            onClick={() => {
                              handleForwardingAddressUpdate(primaryTenant.id, "REQUESTED");
                              toast.success("Marked as requested");
                            }}
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
                      className="flex items-center gap-2 group"
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
                          "text-sm flex-1",
                          item.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.blocksExport && !item.completed ? (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      ) : !item.blocksExport && !isClosed ? (
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`/api/cases/${caseId}/checklist`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ itemId: item.id }),
                              });
                              await fetchCase();
                            } catch (err) {
                              toast.error("Failed to remove item");
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                  ))}
              </div>

              {/* Add custom checklist item */}
              {!isClosed && (
                <div className="mt-3 pt-3 border-t">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const input = form.elements.namedItem("newItem") as HTMLInputElement;
                      const label = input.value.trim();
                      if (!label) return;

                      try {
                        await fetch(`/api/cases/${caseId}/checklist`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ label }),
                        });
                        input.value = "";
                        await fetchCase();
                        toast.success("Item added");
                      } catch (err) {
                        toast.error("Failed to add item");
                      }
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      name="newItem"
                      placeholder="Add custom item..."
                      className="h-8 text-sm"
                    />
                    <Button type="submit" size="sm" variant="outline" className="h-8">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </form>
                </div>
              )}
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
      <Dialog open={showAiDialog} onOpenChange={(open) => !open && handleCloseAiDialog()}>
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

      {/* Add Deduction Dialog */}
      <Dialog open={showAddDeductionDialog} onOpenChange={setShowAddDeductionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Add Deduction
            </DialogTitle>
            <DialogDescription>
              Add an itemized deduction from the security deposit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="deduction-description">Description *</Label>
              <Input
                id="deduction-description"
                value={deductionForm.description}
                onChange={(e) =>
                  setDeductionForm({ ...deductionForm, description: e.target.value })
                }
                placeholder="e.g., Carpet cleaning due to pet stains"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deduction-category">Category *</Label>
                <Select
                  value={deductionForm.category}
                  onValueChange={(value) =>
                    setDeductionForm({
                      ...deductionForm,
                      category: value as typeof deductionForm.category,
                    })
                  }
                >
                  <SelectTrigger id="deduction-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLEANING">Cleaning</SelectItem>
                    <SelectItem value="REPAIRS">Repairs</SelectItem>
                    <SelectItem value="DAMAGES">Damages</SelectItem>
                    <SelectItem value="UNPAID_RENT">Unpaid Rent</SelectItem>
                    <SelectItem value="UTILITIES">Utilities</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deduction-amount">Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="deduction-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={deductionForm.amount}
                    onChange={(e) =>
                      setDeductionForm({ ...deductionForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="deduction-notes">Notes (optional)</Label>
              <Textarea
                id="deduction-notes"
                value={deductionForm.notes}
                onChange={(e) =>
                  setDeductionForm({ ...deductionForm, notes: e.target.value })
                }
                placeholder="Additional details, invoice numbers, etc."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDeductionDialog(false);
                setDeductionForm({
                  description: "",
                  category: "REPAIRS",
                  amount: "",
                  notes: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDeduction} disabled={addingDeduction}>
              {addingDeduction ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Deduction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deduction Drawer */}
      <DeductionDrawer
        deduction={selectedDeductionForEdit}
        attachments={caseData.attachments.map((a) => ({
          ...a,
          tags: a.type === "DELIVERY_PROOF" ? ["delivery_proof"] : [],
        }))}
        isOpen={isDeductionDrawerOpen}
        onClose={handleCloseDeductionDrawer}
        onUpdate={async (id, updates) => {
          await handleUpdateDeductionRisk(id, updates);
        }}
        onDelete={handleDeleteDeduction}
        onImproveWithAI={(deduction) => {
          setSelectedDeduction(deduction);
          setShowAiDialog(true);
          handleCloseDeductionDrawer();
        }}
        onAttachEvidence={handleAttachEvidenceToDeduction}
        isClosed={isClosed}
      />

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
