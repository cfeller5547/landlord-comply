"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface CoverageBadgeProps {
  level: "full" | "partial" | "state_only";
  showLabel?: boolean;
  className?: string;
}

export function CoverageBadge({ level, showLabel = true, className }: CoverageBadgeProps) {
  const config = {
    full: {
      icon: CheckCircle2,
      label: "Full coverage",
      className: "bg-success/10 text-success border-success/20",
    },
    partial: {
      icon: AlertCircle,
      label: "Partial coverage",
      className: "bg-warning/10 text-warning border-warning/20",
    },
    state_only: {
      icon: AlertCircle,
      label: "State rules only",
      className: "bg-muted text-muted-foreground border-border",
    },
  };

  const { icon: Icon, label, className: variantClass } = config[level];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
        variantClass,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span>{label}</span>}
    </div>
  );
}
