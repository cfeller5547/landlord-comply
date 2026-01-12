"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { X, ThumbsUp, ThumbsDown, Loader2, CheckCircle2, Meh, Shield, DollarSign, Star, PartyPopper } from "lucide-react";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

interface MicroSurveyProps {
  surveyId: string;
  question: string;
  trigger: string;
  caseId?: string;
  onDismiss?: () => void;
  onComplete?: () => void;
  showAfterMs?: number;
}

export function MicroSurvey({
  surveyId,
  question,
  trigger,
  caseId,
  onDismiss,
  onComplete,
  showAfterMs = 500,
}: MicroSurveyProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Only show in beta mode
  useEffect(() => {
    if (!config.features.showMicroSurveys) return;

    // Check if already dismissed for this survey
    const dismissed = localStorage.getItem(`survey_dismissed_${surveyId}`);
    if (dismissed) return;

    // Show after delay
    const timer = setTimeout(() => setIsVisible(true), showAfterMs);
    return () => clearTimeout(timer);
  }, [surveyId, showAfterMs]);

  if (!config.features.showMicroSurveys || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    // Remember dismissal for 7 days
    localStorage.setItem(`survey_dismissed_${surveyId}`, Date.now().toString());
    setIsVisible(false);
    onDismiss?.();
  };

  const handleRating = (value: number) => {
    setRating(value);
    // Show feedback input for low ratings
    if (value <= 2) {
      setShowFeedback(true);
    } else {
      // Auto-submit positive ratings
      submitSurvey(value, "");
    }
  };

  const submitSurvey = async (ratingValue: number, feedbackText: string) => {
    setIsSubmitting(true);

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SURVEY",
          message: feedbackText || `Rating: ${ratingValue}/3`,
          rating: ratingValue,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
          trigger,
          caseId,
          metadata: {
            surveyId,
            question,
          },
        }),
      });

      setIsSubmitted(true);

      // Auto-dismiss after showing thank you
      setTimeout(() => {
        localStorage.setItem(`survey_dismissed_${surveyId}`, Date.now().toString());
        setIsVisible(false);
        onComplete?.();
      }, 1500);
    } catch (error) {
      console.error("Error submitting survey:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = () => {
    if (rating !== null) {
      submitSurvey(rating, feedback);
    }
  };

  return (
    <Card className="fixed bottom-20 right-4 z-50 w-80 shadow-xl border-primary/20 animate-in slide-in-from-bottom-4 duration-300">
      {isSubmitted ? (
        <CardContent className="py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="font-medium">Thanks for your feedback!</p>
        </CardContent>
      ) : (
        <>
          <CardHeader className="pb-2 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-sm pr-6">{question}</CardTitle>
            <CardDescription className="text-xs">Quick feedback helps us improve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!showFeedback ? (
              <div className="flex justify-center gap-2">
                <Button
                  variant={rating === 1 ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleRating(1)}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="text-xs">Not good</span>
                </Button>
                <Button
                  variant={rating === 2 ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleRating(2)}
                >
                  <Meh className="h-4 w-4" />
                  <span className="text-xs">Okay</span>
                </Button>
                <Button
                  variant={rating === 3 ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleRating(3)}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs">Great!</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  What could be better?
                </p>
                <Textarea
                  placeholder="Your feedback helps us improve..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="text-sm resize-none h-20"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleDismiss}
                  >
                    Skip
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleSubmitFeedback}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Send"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}

// Pre-configured surveys for common moments
export function DocumentGeneratedSurvey({ caseId }: { caseId?: string }) {
  return (
    <MicroSurvey
      surveyId="doc_generated"
      question="How was the document generation?"
      trigger="document_generated"
      caseId={caseId}
    />
  );
}

export function CaseCreatedSurvey({ caseId }: { caseId?: string }) {
  return (
    <MicroSurvey
      surveyId="case_created"
      question="How was creating this case?"
      trigger="case_created"
      caseId={caseId}
      showAfterMs={1000}
    />
  );
}

export function JurisdictionLookupSurvey() {
  return (
    <MicroSurvey
      surveyId="jurisdiction_lookup"
      question="Were the rules helpful?"
      trigger="jurisdiction_lookup"
      showAfterMs={3000}
    />
  );
}

// =============================================================================
// HIGH-SIGNAL MOMENT SURVEYS (Product & Pricing Signals)
// =============================================================================

interface ConfidenceSurveyProps {
  surveyId: string;
  caseId?: string;
  trigger: string;
  showAfterMs?: number;
}

/**
 * 5-point confidence scale survey
 * Used after document generation and delivery completion
 */
export function ConfidenceSurvey({
  surveyId,
  caseId,
  trigger,
  showAfterMs = 1000,
}: ConfidenceSurveyProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!config.features.showMicroSurveys) return;
    const dismissed = localStorage.getItem(`survey_dismissed_${surveyId}`);
    if (dismissed) return;
    const timer = setTimeout(() => setIsVisible(true), showAfterMs);
    return () => clearTimeout(timer);
  }, [surveyId, showAfterMs]);

  if (!config.features.showMicroSurveys || !isVisible) return null;

  const handleDismiss = () => {
    localStorage.setItem(`survey_dismissed_${surveyId}`, Date.now().toString());
    setIsVisible(false);
  };

  const handleConfidenceSelect = (value: number) => {
    setConfidence(value);
    if (value <= 2) {
      setShowFeedback(true);
    } else {
      submitSurvey(value, "");
    }
  };

  const submitSurvey = async (rating: number, feedbackText: string) => {
    setIsSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SURVEY",
          message: feedbackText || `Confidence: ${rating}/5`,
          rating,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
          trigger,
          caseId,
          metadata: { surveyId, question: "How confident would this hold up in a dispute?", scale: "1-5" },
        }),
      });
      setIsSubmitted(true);
      setTimeout(() => {
        localStorage.setItem(`survey_dismissed_${surveyId}`, Date.now().toString());
        setIsVisible(false);
      }, 1500);
    } catch (error) {
      console.error("Error submitting survey:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confidenceLabels = [
    { value: 1, label: "Not at all" },
    { value: 2, label: "Slightly" },
    { value: 3, label: "Somewhat" },
    { value: 4, label: "Very" },
    { value: 5, label: "Extremely" },
  ];

  return (
    <Card className="fixed bottom-20 right-4 z-50 w-96 shadow-xl border-primary/20 animate-in slide-in-from-bottom-4 duration-300">
      {isSubmitted ? (
        <CardContent className="py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="font-medium">Thanks! This helps us improve.</p>
        </CardContent>
      ) : (
        <>
          <CardHeader className="pb-2 relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm pr-6">How confident are you this would hold up in a dispute?</CardTitle>
            </div>
            <CardDescription className="text-xs">1 = Not confident, 5 = Very confident</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!showFeedback ? (
              <div className="flex justify-between gap-1">
                {confidenceLabels.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleConfidenceSelect(value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all flex-1",
                      confidence === value
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <span className="text-lg font-bold">{value}</span>
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">What would make you more confident?</p>
                <Textarea
                  placeholder="Missing info, unclear language, etc..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="text-sm resize-none h-20"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleDismiss}>Skip</Button>
                  <Button size="sm" className="flex-1" onClick={() => submitSurvey(confidence!, feedback)} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}

/**
 * Yes/No pricing signal survey
 * Used after proof packet export
 */
interface PricingSurveyProps {
  caseId?: string;
  showAfterMs?: number;
}

export function PricingSignalSurvey({ caseId, showAfterMs = 1500 }: PricingSurveyProps) {
  const surveyId = "pricing_signal_export";
  const [isVisible, setIsVisible] = useState(false);
  const [response, setResponse] = useState<"yes" | "no" | "maybe" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!config.features.showMicroSurveys) return;
    const dismissed = localStorage.getItem(`survey_dismissed_${surveyId}`);
    if (dismissed) return;
    const timer = setTimeout(() => setIsVisible(true), showAfterMs);
    return () => clearTimeout(timer);
  }, [showAfterMs]);

  if (!config.features.showMicroSurveys || !isVisible) return null;

  const handleDismiss = () => {
    localStorage.setItem(`survey_dismissed_${surveyId}`, Date.now().toString());
    setIsVisible(false);
  };

  const handleResponse = (value: "yes" | "no" | "maybe") => {
    setResponse(value);
    if (value === "no") {
      setShowFeedback(true);
    } else {
      submitSurvey(value, "");
    }
  };

  const submitSurvey = async (answer: string, feedbackText: string) => {
    setIsSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SURVEY",
          message: feedbackText || `Would pay $29: ${answer}`,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
          trigger: "proof_packet_export",
          caseId,
          metadata: {
            surveyId,
            question: "Would you pay $29 for this after beta?",
            response: answer,
            pricingSignal: true,
          },
        }),
      });
      setIsSubmitted(true);
      setTimeout(() => {
        localStorage.setItem(`survey_dismissed_${surveyId}`, Date.now().toString());
        setIsVisible(false);
      }, 1500);
    } catch (error) {
      console.error("Error submitting survey:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="fixed bottom-20 right-4 z-50 w-80 shadow-xl border-primary/20 animate-in slide-in-from-bottom-4 duration-300">
      {isSubmitted ? (
        <CardContent className="py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="font-medium">Thanks! Your input shapes our pricing.</p>
        </CardContent>
      ) : (
        <>
          <CardHeader className="pb-2 relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              <CardTitle className="text-sm pr-6">Would you pay $29 for this after beta?</CardTitle>
            </div>
            <CardDescription className="text-xs">Honest feedback helps us price fairly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!showFeedback ? (
              <div className="flex gap-2">
                <Button
                  variant={response === "yes" ? "default" : "outline"}
                  className={cn("flex-1", response === "yes" && "bg-success hover:bg-success/90")}
                  onClick={() => handleResponse("yes")}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" /> Yes
                </Button>
                <Button
                  variant={response === "maybe" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handleResponse("maybe")}
                >
                  <Meh className="h-4 w-4 mr-1" /> Maybe
                </Button>
                <Button
                  variant={response === "no" ? "default" : "outline"}
                  className={cn("flex-1", response === "no" && "bg-danger hover:bg-danger/90")}
                  onClick={() => handleResponse("no")}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" /> No
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">What would make it worth $29?</p>
                <Textarea
                  placeholder="More features, lower price, etc..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="text-sm resize-none h-20"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleDismiss}>Skip</Button>
                  <Button size="sm" className="flex-1" onClick={() => submitSurvey("no", feedback)} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}

/**
 * Survey after first document generation
 */
export function FirstPacketSurvey({ caseId }: { caseId?: string }) {
  return (
    <ConfidenceSurvey
      surveyId="first_packet_confidence"
      caseId={caseId}
      trigger="first_packet_generated"
      showAfterMs={1500}
    />
  );
}

/**
 * Survey after marking delivery complete
 */
export function DeliveryCompleteSurvey({ caseId }: { caseId?: string }) {
  return (
    <ConfidenceSurvey
      surveyId="delivery_complete_confidence"
      caseId={caseId}
      trigger="delivery_complete"
      showAfterMs={1000}
    />
  );
}

/**
 * Concierge follow-up for users who complete a full flow
 * Shows when: case has documents + delivery proof + closed
 */
interface FlowCompleteConciergeProps {
  caseId: string;
  userEmail?: string;
}

export function FlowCompleteConcierge({ caseId, userEmail }: FlowCompleteConciergeProps) {
  const surveyId = `flow_complete_${caseId}`;
  const [isVisible, setIsVisible] = useState(false);
  const [wantsCall, setWantsCall] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!config.features.showMicroSurveys) return;
    const dismissed = localStorage.getItem(`survey_dismissed_${surveyId}`);
    if (dismissed) return;
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [surveyId]);

  if (!config.features.showMicroSurveys || !isVisible) return null;

  const handleDismiss = () => {
    localStorage.setItem(`survey_dismissed_${surveyId}`, Date.now().toString());
    setIsVisible(false);
  };

  const handleResponse = async (response: boolean) => {
    setWantsCall(response);
    setIsSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CONCIERGE",
          message: response ? "User wants a follow-up call" : "User declined follow-up",
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
          trigger: "flow_complete",
          caseId,
          metadata: {
            surveyId,
            wantsCall: response,
            userEmail,
            milestone: "full_flow_complete",
          },
        }),
      });
      setIsSubmitted(true);
      setTimeout(() => {
        localStorage.setItem(`survey_dismissed_${surveyId}`, Date.now().toString());
        setIsVisible(false);
      }, 2500);
    } catch (error) {
      console.error("Error submitting:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="fixed bottom-20 right-4 z-50 w-96 shadow-xl border-success/30 bg-success/5 animate-in slide-in-from-bottom-4 duration-300">
      {isSubmitted ? (
        <CardContent className="py-6 text-center">
          <PartyPopper className="h-10 w-10 text-success mx-auto mb-2" />
          <p className="font-semibold text-lg">Congratulations!</p>
          <p className="text-sm text-muted-foreground mt-1">
            {wantsCall
              ? "We'll reach out within 24 hours."
              : "Thanks for being a beta tester!"}
          </p>
        </CardContent>
      ) : (
        <>
          <CardHeader className="pb-2 relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-warning fill-warning" />
              <CardTitle className="text-sm pr-6">You completed a full deposit return flow!</CardTitle>
            </div>
            <CardDescription className="text-xs">You&apos;re one of our most engaged beta testers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Would you be open to a <strong>quick 10-minute call</strong> to share your experience? We&apos;d love to hear what worked and what didn&apos;t.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleResponse(false)}
                disabled={isSubmitting}
              >
                No thanks
              </Button>
              <Button
                className="flex-1 bg-success hover:bg-success/90"
                onClick={() => handleResponse(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sure, reach out"}
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
