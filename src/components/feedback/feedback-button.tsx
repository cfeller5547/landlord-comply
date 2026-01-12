"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "./feedback-modal";
import { config } from "@/lib/config";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in beta mode
  if (!config.features.showFeedbackButton) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        className="fixed bottom-4 right-4 z-50 gap-2 bg-primary hover:bg-primary/90 shadow-lg"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="hidden sm:inline">Feedback</span>
      </Button>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
