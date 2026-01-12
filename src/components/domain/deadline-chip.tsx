"use client";

import { cn } from "@/lib/utils";

interface DeadlineChipProps {
  daysLeft: number;
  dueDate: Date;
  className?: string;
}

export function DeadlineChip({ daysLeft, dueDate, className }: DeadlineChipProps) {
  const getVariant = () => {
    if (daysLeft < 0) return "overdue";
    if (daysLeft <= 3) return "danger";
    if (daysLeft <= 7) return "warning";
    return "normal";
  };

  const variant = getVariant();

  const variantStyles = {
    normal: "bg-muted text-foreground",
    warning: "bg-warning/15 text-warning border border-warning/30",
    danger: "bg-danger/15 text-danger border border-danger/30",
    overdue: "bg-danger text-white",
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysText = () => {
    if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
    if (daysLeft === 0) return "Due today";
    if (daysLeft === 1) return "1 day left";
    return `${daysLeft} days left`;
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium",
        variantStyles[variant],
        className
      )}
    >
      <span>{getDaysText()}</span>
      <span className="text-xs opacity-70">({formatDate(dueDate)})</span>
    </div>
  );
}
