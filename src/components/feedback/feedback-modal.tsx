"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Calculator,
  Download,
  Send,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Camera,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    caseId?: string;
    pageUrl?: string;
    trigger?: string;
  };
}

// What were you trying to do? - Quick select options
const taskOptions = [
  { value: "create_case", label: "Create a case", icon: FileText },
  { value: "generate_docs", label: "Generate documents", icon: FileText },
  { value: "calculate_deadline", label: "Calculate deadline", icon: Calculator },
  { value: "export_packet", label: "Export proof packet", icon: Download },
  { value: "send_notice", label: "Send notice", icon: Send },
  { value: "other", label: "Something else", icon: HelpCircle },
];

export function FeedbackModal({
  isOpen,
  onClose,
  context,
}: FeedbackModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [task, setTask] = useState<string>("");
  const [succeeded, setSucceeded] = useState<boolean | null>(null);
  const [confusion, setConfusion] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTaskSelect = (value: string) => {
    setTask(value);
    setStep(2);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Screenshot must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FEEDBACK",
          message: confusion || `Task: ${task}, Succeeded: ${succeeded}`,
          pageUrl: context?.pageUrl || (typeof window !== "undefined" ? window.location.href : undefined),
          trigger: context?.trigger || "feedback_button",
          caseId: context?.caseId,
          metadata: {
            task,
            succeeded,
            confusion,
            hasScreenshot: !!screenshot,
          },
          screenshot,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setIsSubmitted(true);

      setTimeout(() => {
        onClose();
        // Reset state after modal closes
        setTimeout(() => {
          setIsSubmitted(false);
          setStep(1);
          setTask("");
          setSucceeded(null);
          setConfusion("");
          setScreenshot(null);
        }, 300);
      }, 1500);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setTask("");
      setSucceeded(null);
      setConfusion("");
      setScreenshot(null);
      setIsSubmitted(false);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {isSubmitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <DialogTitle className="text-xl">Thanks for your feedback!</DialogTitle>
            <DialogDescription className="mt-2">
              Your input directly shapes what we build next.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {step === 1 ? "What were you trying to do?" : "How did it go?"}
              </DialogTitle>
              <DialogDescription>
                {step === 1
                  ? "Quick 2-tap feedback helps us improve"
                  : "Your experience helps us build better tools"}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {step === 1 ? (
                /* Step 1: What were you trying to do? */
                <div className="grid grid-cols-2 gap-2">
                  {taskOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleTaskSelect(option.value)}
                        className="flex items-center gap-3 rounded-lg border-2 border-muted p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Step 2: Did you succeed? + What was confusing? */
                <div className="space-y-4">
                  {/* Success question */}
                  <div className="space-y-2">
                    <Label>Did you succeed?</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={succeeded === true ? "default" : "outline"}
                        className={cn(
                          "flex-1 gap-2",
                          succeeded === true && "bg-success hover:bg-success/90"
                        )}
                        onClick={() => setSucceeded(true)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={succeeded === false ? "default" : "outline"}
                        className={cn(
                          "flex-1 gap-2",
                          succeeded === false && "bg-danger hover:bg-danger/90"
                        )}
                        onClick={() => setSucceeded(false)}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        No
                      </Button>
                    </div>
                  </div>

                  {/* Confusion/feedback text */}
                  <div className="space-y-2">
                    <Label htmlFor="confusion">
                      {succeeded === false
                        ? "What went wrong?"
                        : "What was confusing or missing?"}
                    </Label>
                    <Textarea
                      id="confusion"
                      placeholder={
                        succeeded === false
                          ? "Tell us what happened..."
                          : "Optional: anything that could be better?"
                      }
                      value={confusion}
                      onChange={(e) => setConfusion(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Screenshot upload */}
                  <div className="space-y-2">
                    <Label>Screenshot (optional)</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                    />
                    {screenshot ? (
                      <div className="relative">
                        <img
                          src={screenshot}
                          alt="Screenshot"
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => setScreenshot(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                        Add Screenshot
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {step === 2 && (
              <div className="flex justify-between gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || succeeded === null}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Feedback"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
