"use client";

import { useState } from "react";
import { FlaskConical, X, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/feedback";

export function BetaBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          <span>
            <span className="font-medium">Beta Access:</span>{" "}
            <span className="hidden sm:inline">You have free Pro features. </span>
            <button
              onClick={() => setShowFeedback(true)}
              className="underline hover:no-underline font-medium inline-flex items-center gap-1"
            >
              <MessageSquarePlus className="h-3 w-3" />
              Share feedback
            </button>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        context={{ trigger: "beta_banner" }}
      />
    </>
  );
}
