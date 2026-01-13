"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Sparkles,
  Camera,
  Receipt,
  FileText,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Trash2,
  X,
  Upload,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

interface Attachment {
  id: string;
  name: string;
  type: string;
  fileUrl?: string;
  tags: string[];
}

interface DeductionDrawerProps {
  deduction: Deduction | null;
  attachments: Attachment[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Deduction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImproveWithAI: (deduction: Deduction) => void;
  onAttachEvidence: (deductionId: string) => void;
  isClosed: boolean;
}

// Compute risk based on deduction attributes
function computeRisk(deduction: Deduction): {
  level: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  suggestions: { action: string; impact: string }[];
} {
  const reasons: string[] = [];
  const suggestions: { action: string; impact: string }[] = [];
  let score = 0;

  // No evidence is a major risk factor
  if (!deduction.hasEvidence) {
    score += 3;
    reasons.push("No evidence attached");
    suggestions.push({
      action: "Add photos or invoice",
      impact: "Significantly reduces dispute risk",
    });
  }

  // Cleaning deductions are often disputed
  if (deduction.category === "CLEANING") {
    score += 1;
    reasons.push("Cleaning deductions are commonly disputed");
    if (!deduction.hasEvidence) {
      suggestions.push({
        action: "Add before/after photos",
        impact: "Proves condition beyond normal wear",
      });
    }
  }

  // High amounts attract more scrutiny
  const amount = Number(deduction.amount);
  if (amount > 500) {
    score += 2;
    reasons.push("Amount over $500 may attract scrutiny");
    if (!deduction.hasEvidence) {
      suggestions.push({
        action: "Attach invoice or receipt",
        impact: "Justifies the deduction amount",
      });
    }
  } else if (amount > 200) {
    score += 1;
    reasons.push("Moderate amount may need justification");
  }

  // Damage type considerations
  if (deduction.damageType === "NORMAL_WEAR") {
    score += 3;
    reasons.push("Marked as normal wear - typically not deductible");
    suggestions.push({
      action: "Review if this is truly beyond normal wear",
      impact: "Normal wear cannot be deducted",
    });
  }

  // Short description is risky
  if (deduction.description.length < 30 && !deduction.aiGenerated) {
    score += 1;
    reasons.push("Description may be too brief");
    suggestions.push({
      action: "Improve wording with AI",
      impact: "Creates court-defensible language",
    });
  }

  // Determine level
  let level: "LOW" | "MEDIUM" | "HIGH";
  if (score >= 4) {
    level = "HIGH";
  } else if (score >= 2) {
    level = "MEDIUM";
  } else {
    level = "LOW";
  }

  // If no issues found
  if (reasons.length === 0) {
    reasons.push("Well-documented deduction");
  }

  return { level, reasons, suggestions };
}

const categoryIcons: Record<string, React.ReactNode> = {
  CLEANING: <span className="text-blue-500">🧹</span>,
  REPAIRS: <span className="text-orange-500">🔧</span>,
  DAMAGES: <span className="text-red-500">💥</span>,
  UNPAID_RENT: <span className="text-purple-500">💰</span>,
  UTILITIES: <span className="text-green-500">⚡</span>,
  OTHER: <span className="text-gray-500">📋</span>,
};

const riskColors = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-red-100 text-red-800 border-red-200",
};

export function DeductionDrawer({
  deduction,
  attachments,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onImproveWithAI,
  onAttachEvidence,
  isClosed,
}: DeductionDrawerProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localDescription, setLocalDescription] = useState("");
  const [localAmount, setLocalAmount] = useState("");
  const [localNotes, setLocalNotes] = useState("");
  const [localCategory, setLocalCategory] = useState("");

  // Sync local state when deduction changes
  useState(() => {
    if (deduction) {
      setLocalDescription(deduction.description);
      setLocalAmount(String(deduction.amount));
      setLocalNotes(deduction.notes || "");
      setLocalCategory(deduction.category);
    }
  });

  if (!deduction) return null;

  const risk = computeRisk(deduction);
  const linkedAttachments = attachments.filter((a) =>
    deduction.attachmentIds.includes(a.id)
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(deduction.id, {
        description: localDescription,
        amount: parseFloat(localAmount),
        notes: localNotes || undefined,
        category: localCategory,
      });
      toast.success("Deduction updated");
    } catch (error) {
      toast.error("Failed to update deduction");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this deduction?")) return;
    setIsDeleting(true);
    try {
      await onDelete(deduction.id);
      onClose();
      toast.success("Deduction deleted");
    } catch (error) {
      toast.error("Failed to delete deduction");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {categoryIcons[deduction.category]}
              Edit Deduction
            </SheetTitle>
            <Badge variant="outline" className={cn("text-xs", riskColors[risk.level])}>
              {risk.level} Risk
            </Badge>
          </div>
          <SheetDescription>
            Update details, add evidence, or improve wording
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-8">
          {/* Section A: Basics */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Basics
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={localCategory}
                  onValueChange={setLocalCategory}
                  disabled={isClosed}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={localDescription}
                  onChange={(e) => setLocalDescription(e.target.value)}
                  placeholder="What are you charging for?"
                  rows={3}
                  disabled={isClosed}
                />
                {deduction.aiGenerated && (
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI-improved wording
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={localAmount}
                    onChange={(e) => setLocalAmount(e.target.value)}
                    className="pl-9"
                    disabled={isClosed}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  placeholder="Internal notes, not shown on documents"
                  rows={2}
                  disabled={isClosed}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Section B: Evidence */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Evidence
            </h3>

            {linkedAttachments.length > 0 ? (
              <div className="space-y-2">
                {linkedAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm"
                  >
                    {att.type === "PHOTO" ? (
                      <Camera className="h-4 w-4 text-blue-500" />
                    ) : att.type === "INVOICE" || att.type === "RECEIPT" ? (
                      <Receipt className="h-4 w-4 text-green-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="flex-1 truncate">{att.name}</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  No evidence attached
                </p>
                {!isClosed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAttachEvidence(deduction.id)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Attach Evidence
                  </Button>
                )}
              </div>
            )}

            {/* Evidence checklist hint */}
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Recommended evidence:</p>
              <div className="flex items-center gap-2">
                <span className={linkedAttachments.some(a => a.type === "PHOTO") ? "text-green-600" : ""}>
                  {linkedAttachments.some(a => a.type === "PHOTO") ? "✓" : "○"} Before/after photos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={linkedAttachments.some(a => a.type === "INVOICE" || a.type === "RECEIPT") ? "text-green-600" : ""}>
                  {linkedAttachments.some(a => a.type === "INVOICE" || a.type === "RECEIPT") ? "✓" : "○"} Invoice or receipt
                </span>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section C: AI Wording */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Court-Safe Wording
            </h3>

            {deduction.aiGenerated ? (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">AI-Improved</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This description has been improved for legal defensibility.
                </p>
                {deduction.originalDescription && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      View original
                    </summary>
                    <p className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                      {deduction.originalDescription}
                    </p>
                  </details>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Get AI to rewrite your description in clear, specific, court-defensible language.
                </p>
                {!isClosed && (
                  <Button
                    variant="outline"
                    className="w-full border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => onImproveWithAI(deduction)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Improve Wording with AI
                  </Button>
                )}
              </div>
            )}
          </section>

          <Separator />

          {/* Section D: Risk Assessment */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Dispute Risk
            </h3>

            <div className={cn(
              "rounded-lg p-4 border",
              risk.level === "HIGH" ? "bg-red-50 border-red-200" :
              risk.level === "MEDIUM" ? "bg-yellow-50 border-yellow-200" :
              "bg-green-50 border-green-200"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={riskColors[risk.level]}>
                  {risk.level} Risk
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {risk.level === "LOW" ? "Looking good" :
                   risk.level === "MEDIUM" ? "Some improvements possible" :
                   "Needs attention"}
                </span>
              </div>

              {risk.reasons.length > 0 && (
                <div className="space-y-1 mb-3">
                  {risk.reasons.map((reason, i) => (
                    <p key={i} className="text-sm flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      {reason}
                    </p>
                  ))}
                </div>
              )}

              {risk.suggestions.length > 0 && !isClosed && (
                <div className="space-y-2 pt-3 border-t border-current/10">
                  <p className="text-xs font-medium text-muted-foreground">
                    Suggested actions:
                  </p>
                  {risk.suggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>{suggestion.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Advanced Settings */}
          {!isClosed && (
            <>
              <Separator />

              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                  {isAdvancedOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Advanced Settings
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div>
                    <Label>Is this normal wear and tear?</Label>
                    <Select
                      value={deduction.damageType || "BEYOND_NORMAL"}
                      onValueChange={(value) =>
                        onUpdate(deduction.id, { damageType: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEYOND_NORMAL">Beyond normal use</SelectItem>
                        <SelectItem value="NORMAL_WEAR">Normal wear/tear (not deductible)</SelectItem>
                        <SelectItem value="INTENTIONAL">Intentional damage</SelectItem>
                        <SelectItem value="NEGLIGENCE">Negligence</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Normal wear and tear typically cannot be deducted
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="itemAge">Item age (years)</Label>
                    <Input
                      id="itemAge"
                      type="number"
                      step="0.5"
                      value={deduction.itemAge ? deduction.itemAge / 12 : ""}
                      onChange={(e) =>
                        onUpdate(deduction.id, {
                          itemAge: e.target.value ? Math.round(parseFloat(e.target.value) * 12) : null,
                        })
                      }
                      placeholder="e.g., 5"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for proration in some jurisdictions
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {/* Action Buttons */}
          {!isClosed && (
            <div className="flex gap-3 pt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Compact deduction row for list view
interface DeductionRowProps {
  deduction: Deduction;
  onClick: () => void;
  isClosed: boolean;
}

export function DeductionRow({ deduction, onClick, isClosed }: DeductionRowProps) {
  const risk = computeRisk(deduction);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
        "hover:shadow-sm hover:border-primary/30",
        risk.level === "HIGH" && "border-red-200 bg-red-50/50",
        risk.level === "MEDIUM" && "border-yellow-200 bg-yellow-50/50",
        isClosed && "opacity-75 cursor-default"
      )}
    >
      {/* Category icon */}
      <div className="text-xl flex-shrink-0">
        {categoryIcons[deduction.category]}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{deduction.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-[10px] h-5">
            {deduction.category}
          </Badge>
          {deduction.hasEvidence ? (
            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
              <CheckCircle className="h-3 w-3" />
              Evidence
            </span>
          ) : (
            <span className="text-[10px] text-yellow-600 flex items-center gap-0.5">
              <AlertTriangle className="h-3 w-3" />
              No evidence
            </span>
          )}
          {deduction.aiGenerated && (
            <span className="text-[10px] text-primary flex items-center gap-0.5">
              <Sparkles className="h-3 w-3" />
              AI
            </span>
          )}
        </div>
      </div>

      {/* Amount and risk */}
      <div className="flex-shrink-0 text-right">
        <p className="font-bold">${Number(deduction.amount).toFixed(2)}</p>
        <Badge className={cn("text-[10px] mt-0.5", riskColors[risk.level])}>
          {risk.level}
        </Badge>
      </div>

      {/* Arrow indicator */}
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

export { computeRisk };
