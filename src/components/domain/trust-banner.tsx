"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBannerProps {
  className?: string;
}

export function TrustBanner({ className }: TrustBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning",
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>
        <strong>Educational use only</strong> — not legal advice. Always verify with official sources and consult an attorney for specific situations.
      </span>
    </div>
  );
}
