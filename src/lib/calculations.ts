/**
 * Pure calculation functions for security deposit compliance
 * These functions are extracted from API routes for testability
 */

/**
 * Calculate the deadline date based on move-out date and jurisdiction rules
 * @param moveOutDate - The date the tenant moved out
 * @param deadlineDays - Number of days allowed by jurisdiction (e.g., 21 for CA, 14 for NYC)
 * @returns The due date for returning the deposit
 */
export function calculateDeadline(
  moveOutDate: Date,
  deadlineDays: number
): Date {
  const dueDate = new Date(moveOutDate);
  dueDate.setDate(dueDate.getDate() + deadlineDays);
  return dueDate;
}

/**
 * Calculate the number of days until a deadline
 * @param dueDate - The deadline date
 * @param fromDate - The date to calculate from (defaults to now)
 * @returns Number of days until deadline (negative if overdue)
 */
export function calculateDaysUntilDeadline(
  dueDate: Date,
  fromDate: Date = new Date()
): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = dueDate.getTime() - fromDate.getTime();
  return Math.ceil(diffMs / msPerDay);
}

/**
 * Check if a deadline has passed
 * @param dueDate - The deadline date
 * @param fromDate - The date to check against (defaults to now)
 * @returns True if the deadline has passed
 */
export function isOverdue(dueDate: Date, fromDate: Date = new Date()): boolean {
  return calculateDaysUntilDeadline(dueDate, fromDate) < 0;
}

/**
 * Calculate deposit interest based on lease duration
 * Uses simple interest formula: Interest = Principal × Rate × Time
 * @param depositAmount - The security deposit amount
 * @param annualRate - Annual interest rate (e.g., 0.01 for 1%)
 * @param leaseStartDate - Start of the lease
 * @param leaseEndDate - End of the lease
 * @returns Interest amount rounded to 2 decimal places
 */
export function calculateInterest(
  depositAmount: number,
  annualRate: number,
  leaseStartDate: Date,
  leaseEndDate: Date
): number {
  if (!annualRate || annualRate <= 0) {
    return 0;
  }

  const msPerYear = 1000 * 60 * 60 * 24 * 365;
  const leaseDurationMs = leaseEndDate.getTime() - leaseStartDate.getTime();
  const leaseDurationYears = leaseDurationMs / msPerYear;

  const interest = depositAmount * annualRate * leaseDurationYears;

  // Round to 2 decimal places
  return Math.round(interest * 100) / 100;
}

/**
 * Calculate the refund amount (what the landlord owes the tenant)
 * @param depositAmount - Original deposit amount
 * @param depositInterest - Accrued interest (0 if not required)
 * @param totalDeductions - Sum of all deductions
 * @returns Refund amount (can be negative if deductions exceed deposit)
 */
export function calculateRefundAmount(
  depositAmount: number,
  depositInterest: number,
  totalDeductions: number
): number {
  const refund = depositAmount + depositInterest - totalDeductions;
  // Round to 2 decimal places
  return Math.round(refund * 100) / 100;
}

/**
 * Sum up deduction amounts
 * @param deductions - Array of deduction objects with amount property
 * @returns Total deductions rounded to 2 decimal places
 */
export function sumDeductions(
  deductions: Array<{ amount: number | string }>
): number {
  const total = deductions.reduce((sum, d) => {
    const amount = typeof d.amount === "string" ? parseFloat(d.amount) : d.amount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}

/**
 * Parse penalty multiplier from penalty text
 * Extracts multipliers like "2x", "3x", "twice", "triple" from penalty descriptions
 * @param penaltyText - The penalty description text
 * @returns The multiplier (2, 3, etc.) or null if not recognized
 */
export function parsePenaltyMultiplier(penaltyText: string): number | null {
  const text = penaltyText.toLowerCase();

  if (text.includes("2x") || text.includes("twice") || text.includes("double")) {
    return 2;
  }

  if (text.includes("3x") || text.includes("triple") || text.includes("three times")) {
    return 3;
  }

  // Try to extract a number followed by "x" or "times"
  const match = text.match(/(\d+)\s*(?:x|times)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}

/**
 * Calculate penalty amount based on deposit and penalty text
 * @param depositAmount - The security deposit amount
 * @param penaltyText - The penalty description (e.g., "2x deposit amount")
 * @returns The penalty amount or null if not calculable
 */
export function calculatePenaltyAmount(
  depositAmount: number,
  penaltyText: string
): number | null {
  const multiplier = parsePenaltyMultiplier(penaltyText);

  if (multiplier === null) {
    return null;
  }

  return Math.round(depositAmount * multiplier * 100) / 100;
}

/**
 * Determine deadline urgency level based on days remaining
 * @param daysLeft - Number of days until deadline
 * @returns Urgency level for UI display
 */
export function getDeadlineUrgency(
  daysLeft: number
): "overdue" | "critical" | "warning" | "normal" {
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 3) return "critical";
  if (daysLeft <= 7) return "warning";
  return "normal";
}

/**
 * Format days remaining for display
 * @param daysLeft - Number of days until deadline
 * @returns Formatted string for display
 */
export function formatDaysRemaining(daysLeft: number): string {
  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    return `${overdueDays}d overdue`;
  }

  if (daysLeft === 0) {
    return "Due today";
  }

  if (daysLeft === 1) {
    return "1 day left";
  }

  return `${daysLeft} days left`;
}

/**
 * Calculate proration factor for item depreciation
 * @param itemAgeMonths - Age of the item in months
 * @param usefulLifeMonths - Expected useful life in months (default 60 for most items)
 * @returns Proration factor (0-1) representing remaining value
 */
export function calculateProration(
  itemAgeMonths: number,
  usefulLifeMonths: number = 60
): number {
  if (itemAgeMonths >= usefulLifeMonths) {
    return 0; // Fully depreciated
  }

  const remainingLife = usefulLifeMonths - itemAgeMonths;
  return Math.round((remainingLife / usefulLifeMonths) * 100) / 100;
}

/**
 * Apply proration to a deduction amount
 * @param amount - Original deduction amount
 * @param itemAgeMonths - Age of the item in months
 * @param usefulLifeMonths - Expected useful life in months
 * @returns Prorated amount (reduced based on depreciation)
 */
export function applyProration(
  amount: number,
  itemAgeMonths: number,
  usefulLifeMonths: number = 60
): number {
  const factor = calculateProration(itemAgeMonths, usefulLifeMonths);
  return Math.round(amount * factor * 100) / 100;
}
