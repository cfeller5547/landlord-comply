"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  DollarSign,
  Camera,
  FileText,
  Send,
  Package,
  ArrowRight,
  Shield,
} from "lucide-react";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: "completed" | "current" | "upcoming" | "optional" | "warning";
  action?: () => void;
  actionLabel?: string;
}

interface CaseProgressProps {
  steps: WorkflowStep[];
  confidenceLevel: "high" | "medium" | "low";
  confidenceMessage: string;
  daysLeft: number;
  dueDate: string;
  onNextStep?: () => void;
  className?: string;
}

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  details: Calendar,
  deductions: DollarSign,
  evidence: Camera,
  documents: FileText,
  delivery: Send,
  export: Package,
};

const confidenceConfig = {
  high: {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: Shield,
    label: "High Confidence",
  },
  medium: {
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: AlertCircle,
    label: "Medium Confidence",
  },
  low: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertCircle,
    label: "Needs Attention",
  },
};

export function CaseProgress({
  steps,
  confidenceLevel,
  confidenceMessage,
  daysLeft,
  dueDate,
  onNextStep,
  className,
}: CaseProgressProps) {
  const currentStep = steps.find((s) => s.status === "current");
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const config = confidenceConfig[confidenceLevel];
  const ConfidenceIcon = config.icon;

  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="pt-6">
        {/* Confidence Summary */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-lg mb-6",
          config.bg,
          config.border,
          "border"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", config.bg)}>
              <ConfidenceIcon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <p className={cn("font-semibold", config.color)}>
                {config.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {confidenceMessage}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              "font-semibold",
              daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-yellow-600" : "text-foreground"
            )}>
              {daysLeft} days left
            </p>
            <p className="text-sm text-muted-foreground">Due {dueDate}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-muted" />

          {/* Completed Progress Line */}
          <div
            className="absolute left-[19px] top-8 w-0.5 bg-primary transition-all duration-500"
            style={{
              height: `${(completedCount / (steps.length - 1)) * 100}%`,
              maxHeight: 'calc(100% - 64px)'
            }}
          />

          <div className="space-y-4">
            {steps.map((step, index) => {
              const StepIcon = stepIcons[step.id] || Circle;
              const isLast = index === steps.length - 1;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "relative flex items-start gap-4 p-3 rounded-lg transition-colors",
                    step.status === "current" && "bg-primary/5",
                    step.status === "warning" && "bg-yellow-50"
                  )}
                >
                  {/* Step Icon */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    step.status === "completed" && "bg-primary border-primary text-primary-foreground",
                    step.status === "current" && "bg-background border-primary text-primary",
                    step.status === "upcoming" && "bg-background border-muted text-muted-foreground",
                    step.status === "optional" && "bg-background border-dashed border-muted text-muted-foreground",
                    step.status === "warning" && "bg-yellow-100 border-yellow-500 text-yellow-700"
                  )}>
                    {step.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : step.status === "warning" ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        "font-medium",
                        step.status === "completed" && "text-muted-foreground",
                        step.status === "current" && "text-foreground",
                        step.status === "upcoming" && "text-muted-foreground",
                        step.status === "optional" && "text-muted-foreground"
                      )}>
                        {step.label}
                      </h4>
                      {step.status === "optional" && (
                        <span className="text-xs text-muted-foreground">(optional)</span>
                      )}
                      {step.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>

                  {/* Step Action */}
                  {step.status === "current" && step.action && (
                    <Button
                      size="sm"
                      onClick={step.action}
                      className="shrink-0"
                    >
                      {step.actionLabel || "Continue"}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Step CTA */}
        {currentStep && onNextStep && (
          <div className="mt-6 pt-4 border-t">
            <Button onClick={onNextStep} className="w-full" size="lg">
              {currentStep.actionLabel || `Continue to ${currentStep.label}`}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to calculate workflow steps from case data
export function calculateWorkflowSteps(caseData: {
  depositAmount: number;
  depositInterest: number;
  deductions: Array<{ id: string }>;
  attachments: Array<{ id: string }>;
  documents: Array<{ type: string }>;
  status: string;
  deliveryMethod?: string;
  sentDate?: string;
}): WorkflowStep[] {
  const hasDeductions = caseData.deductions.length > 0;
  const hasEvidence = caseData.attachments.length > 0;
  const hasNoticeLetter = caseData.documents.some((d) => d.type === "NOTICE_LETTER");
  const hasItemizedStatement = caseData.documents.some((d) => d.type === "ITEMIZED_STATEMENT");
  const hasDocuments = hasNoticeLetter || hasItemizedStatement;
  const isSent = caseData.status === "SENT" || !!caseData.sentDate;
  const isClosed = caseData.status === "CLOSED";

  // Determine current step
  let currentStepId = "details";
  if (caseData.depositAmount > 0) currentStepId = "deductions";
  if (hasDeductions || caseData.deductions.length === 0) currentStepId = "evidence";
  if (hasEvidence || !hasDeductions) currentStepId = "documents";
  if (hasDocuments) currentStepId = "delivery";
  if (isSent) currentStepId = "export";
  if (isClosed) currentStepId = "completed";

  const getStatus = (stepId: string, requiredStepId: string, isOptional = false): WorkflowStep["status"] => {
    const stepOrder = ["details", "deductions", "evidence", "documents", "delivery", "export"];
    const currentIndex = stepOrder.indexOf(currentStepId);
    const stepIndex = stepOrder.indexOf(stepId);

    if (isClosed) return "completed";
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    if (isOptional) return "optional";
    return "upcoming";
  };

  return [
    {
      id: "details",
      label: "Confirm Details",
      description: "Move-out date, deposit amount, and tenant info verified",
      status: getStatus("details", "details"),
    },
    {
      id: "deductions",
      label: "Add Deductions",
      description: hasDeductions
        ? `${caseData.deductions.length} deduction(s) added`
        : "No deductions? You can skip this step",
      status: getStatus("deductions", "details", !hasDeductions),
    },
    {
      id: "evidence",
      label: "Upload Evidence",
      description: hasEvidence
        ? `${caseData.attachments.length} file(s) uploaded`
        : "Photos, receipts, and invoices (recommended)",
      status: getStatus("evidence", "deductions", true),
    },
    {
      id: "documents",
      label: "Generate Documents",
      description: hasDocuments
        ? "Notice letter and statement ready"
        : "Create compliant notice letter and itemized statement",
      status: getStatus("documents", "evidence"),
    },
    {
      id: "delivery",
      label: "Send & Record Delivery",
      description: isSent
        ? `Sent via ${caseData.deliveryMethod || "mail"}`
        : "Choose delivery method and record proof",
      status: getStatus("delivery", "documents"),
    },
    {
      id: "export",
      label: "Export & Close",
      description: isClosed
        ? "Case completed"
        : "Download proof packet and close case",
      status: getStatus("export", "delivery"),
    },
  ];
}

// Helper to calculate confidence level
export function calculateConfidence(
  qualityCheck: { score: number; blockers: Array<{ id: string }> } | null,
  daysLeft: number
): { level: "high" | "medium" | "low"; message: string } {
  if (!qualityCheck) {
    return { level: "medium", message: "Checking compliance status..." };
  }

  const hasBlockers = qualityCheck.blockers.length > 0;
  const isUrgent = daysLeft <= 3;
  const isApproaching = daysLeft <= 7;

  if (hasBlockers && isUrgent) {
    return {
      level: "low",
      message: `${qualityCheck.blockers.length} issue(s) need attention before deadline`
    };
  }

  if (hasBlockers) {
    return {
      level: "medium",
      message: `Almost ready — ${qualityCheck.blockers.length} quick fix(es) remaining`
    };
  }

  if (isUrgent) {
    return {
      level: "medium",
      message: "On track, but deadline is approaching soon"
    };
  }

  if (qualityCheck.score >= 80) {
    return {
      level: "high",
      message: "Everything looks good — ready to proceed"
    };
  }

  return {
    level: "medium",
    message: "Good progress — a few optional improvements available"
  };
}
