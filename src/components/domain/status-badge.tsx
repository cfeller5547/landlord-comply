"use client";

import { cn } from "@/lib/utils";
import { CaseStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config: Record<CaseStatus, { label: string; className: string }> = {
    active: {
      label: "Active",
      className: "bg-info/10 text-info border-info/20",
    },
    pending_send: {
      label: "Ready to Send",
      className: "bg-warning/10 text-warning border-warning/20",
    },
    sent: {
      label: "Sent",
      className: "bg-success/10 text-success border-success/20",
    },
    closed: {
      label: "Closed",
      className: "bg-muted text-muted-foreground border-border",
    },
  };

  const { label, className: variantClass } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantClass,
        className
      )}
    >
      {label}
    </span>
  );
}
