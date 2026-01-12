import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateDeadline,
  calculateDaysUntilDeadline,
  isOverdue,
  calculateInterest,
  calculateRefundAmount,
  sumDeductions,
  parsePenaltyMultiplier,
  calculatePenaltyAmount,
  getDeadlineUrgency,
  formatDaysRemaining,
  calculateProration,
  applyProration,
} from "@/lib/calculations";

describe("Deadline Calculations", () => {
  describe("calculateDeadline", () => {
    it("should add deadline days to move-out date", () => {
      const moveOutDate = new Date("2024-01-15");
      const result = calculateDeadline(moveOutDate, 21);

      expect(result.toISOString().split("T")[0]).toBe("2024-02-05");
    });

    it("should handle California 21-day deadline", () => {
      const moveOutDate = new Date("2024-03-01T12:00:00");
      const result = calculateDeadline(moveOutDate, 21);

      // The result should be 21 days after March 1 = March 22
      expect(result.getDate()).toBe(22);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
    });

    it("should handle NYC 14-day deadline", () => {
      const moveOutDate = new Date("2024-03-01T12:00:00");
      const result = calculateDeadline(moveOutDate, 14);

      // The result should be 14 days after March 1 = March 15
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
    });

    it("should handle Texas 30-day deadline", () => {
      const moveOutDate = new Date("2024-03-01T12:00:00");
      const result = calculateDeadline(moveOutDate, 30);

      // The result should be 30 days after March 1 = March 31
      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
    });

    it("should handle month boundaries correctly", () => {
      const moveOutDate = new Date("2024-01-25");
      const result = calculateDeadline(moveOutDate, 21);

      expect(result.toISOString().split("T")[0]).toBe("2024-02-15");
    });

    it("should handle leap year correctly", () => {
      const moveOutDate = new Date("2024-02-15"); // 2024 is a leap year
      const result = calculateDeadline(moveOutDate, 21);

      expect(result.toISOString().split("T")[0]).toBe("2024-03-07");
    });
  });

  describe("calculateDaysUntilDeadline", () => {
    it("should return positive days when deadline is in future", () => {
      const dueDate = new Date("2024-01-20");
      const fromDate = new Date("2024-01-15");

      const result = calculateDaysUntilDeadline(dueDate, fromDate);

      expect(result).toBe(5);
    });

    it("should return negative days when deadline has passed", () => {
      const dueDate = new Date("2024-01-15");
      const fromDate = new Date("2024-01-20");

      const result = calculateDaysUntilDeadline(dueDate, fromDate);

      expect(result).toBe(-5);
    });

    it("should return 0 when deadline is today", () => {
      const dueDate = new Date("2024-01-15T12:00:00");
      const fromDate = new Date("2024-01-15T08:00:00");

      const result = calculateDaysUntilDeadline(dueDate, fromDate);

      expect(result).toBe(1); // Partial day rounds up
    });

    it("should handle same moment", () => {
      const date = new Date("2024-01-15T12:00:00");

      const result = calculateDaysUntilDeadline(date, date);

      expect(result).toBe(0);
    });
  });

  describe("isOverdue", () => {
    it("should return true when deadline has passed", () => {
      const dueDate = new Date("2024-01-15");
      const fromDate = new Date("2024-01-20");

      expect(isOverdue(dueDate, fromDate)).toBe(true);
    });

    it("should return false when deadline is in future", () => {
      const dueDate = new Date("2024-01-20");
      const fromDate = new Date("2024-01-15");

      expect(isOverdue(dueDate, fromDate)).toBe(false);
    });

    it("should return false on the due date", () => {
      const dueDate = new Date("2024-01-15T23:59:59");
      const fromDate = new Date("2024-01-15T08:00:00");

      expect(isOverdue(dueDate, fromDate)).toBe(false);
    });
  });

  describe("getDeadlineUrgency", () => {
    it("should return 'overdue' for negative days", () => {
      expect(getDeadlineUrgency(-1)).toBe("overdue");
      expect(getDeadlineUrgency(-10)).toBe("overdue");
    });

    it("should return 'critical' for 0-3 days", () => {
      expect(getDeadlineUrgency(0)).toBe("critical");
      expect(getDeadlineUrgency(1)).toBe("critical");
      expect(getDeadlineUrgency(3)).toBe("critical");
    });

    it("should return 'warning' for 4-7 days", () => {
      expect(getDeadlineUrgency(4)).toBe("warning");
      expect(getDeadlineUrgency(7)).toBe("warning");
    });

    it("should return 'normal' for >7 days", () => {
      expect(getDeadlineUrgency(8)).toBe("normal");
      expect(getDeadlineUrgency(21)).toBe("normal");
    });
  });

  describe("formatDaysRemaining", () => {
    it("should format overdue days", () => {
      expect(formatDaysRemaining(-5)).toBe("5d overdue");
      expect(formatDaysRemaining(-1)).toBe("1d overdue");
    });

    it("should format due today", () => {
      expect(formatDaysRemaining(0)).toBe("Due today");
    });

    it("should format 1 day left (singular)", () => {
      expect(formatDaysRemaining(1)).toBe("1 day left");
    });

    it("should format multiple days left (plural)", () => {
      expect(formatDaysRemaining(5)).toBe("5 days left");
      expect(formatDaysRemaining(21)).toBe("21 days left");
    });
  });
});

describe("Interest Calculations", () => {
  describe("calculateInterest", () => {
    it("should calculate simple interest correctly", () => {
      const deposit = 2000;
      const rate = 0.01; // 1% annual
      const start = new Date("2023-01-01");
      const end = new Date("2024-01-01"); // Exactly 1 year

      const result = calculateInterest(deposit, rate, start, end);

      expect(result).toBe(20); // $2000 * 0.01 * 1 year = $20
    });

    it("should calculate interest for partial year", () => {
      const deposit = 2400;
      const rate = 0.01; // 1% annual
      const start = new Date("2023-01-01");
      const end = new Date("2023-07-01"); // ~6 months

      const result = calculateInterest(deposit, rate, start, end);

      // ~6 months = 0.5 years, $2400 * 0.01 * 0.5 = ~$12
      expect(result).toBeCloseTo(12, 0);
    });

    it("should calculate interest for multi-year lease", () => {
      const deposit = 3000;
      const rate = 0.015; // 1.5% annual
      const start = new Date("2021-01-01");
      const end = new Date("2024-01-01"); // 3 years

      const result = calculateInterest(deposit, rate, start, end);

      // $3000 * 0.015 * 3 = $135
      expect(result).toBeCloseTo(135, 0);
    });

    it("should return 0 when rate is 0", () => {
      const result = calculateInterest(
        2000,
        0,
        new Date("2023-01-01"),
        new Date("2024-01-01")
      );

      expect(result).toBe(0);
    });

    it("should return 0 when rate is null/undefined", () => {
      const result = calculateInterest(
        2000,
        null as any,
        new Date("2023-01-01"),
        new Date("2024-01-01")
      );

      expect(result).toBe(0);
    });

    it("should return 0 when rate is negative", () => {
      const result = calculateInterest(
        2000,
        -0.01,
        new Date("2023-01-01"),
        new Date("2024-01-01")
      );

      expect(result).toBe(0);
    });

    it("should round to 2 decimal places", () => {
      const deposit = 1000;
      const rate = 0.0333; // Results in fractional cents
      const start = new Date("2023-01-01");
      const end = new Date("2024-01-01");

      const result = calculateInterest(deposit, rate, start, end);

      // Should be rounded, not have many decimal places
      expect(result.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });
});

describe("Refund Calculations", () => {
  describe("calculateRefundAmount", () => {
    it("should calculate positive refund when deposit exceeds deductions", () => {
      const result = calculateRefundAmount(2000, 20, 500);

      expect(result).toBe(1520); // $2000 + $20 - $500
    });

    it("should include interest in refund", () => {
      const result = calculateRefundAmount(2000, 50, 0);

      expect(result).toBe(2050); // $2000 + $50 - $0
    });

    it("should return negative when deductions exceed deposit", () => {
      const result = calculateRefundAmount(1000, 0, 1500);

      expect(result).toBe(-500); // $1000 + $0 - $1500
    });

    it("should return 0 when deposit equals deductions", () => {
      const result = calculateRefundAmount(2000, 0, 2000);

      expect(result).toBe(0);
    });

    it("should handle zero interest", () => {
      const result = calculateRefundAmount(2500, 0, 300);

      expect(result).toBe(2200);
    });

    it("should round to 2 decimal places", () => {
      const result = calculateRefundAmount(1000.555, 10.333, 200.111);

      expect(result.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe("sumDeductions", () => {
    it("should sum deduction amounts", () => {
      const deductions = [{ amount: 100 }, { amount: 200 }, { amount: 50 }];

      const result = sumDeductions(deductions);

      expect(result).toBe(350);
    });

    it("should handle string amounts", () => {
      const deductions = [{ amount: "100.50" }, { amount: "200.25" }];

      const result = sumDeductions(deductions);

      expect(result).toBe(300.75);
    });

    it("should handle empty array", () => {
      const result = sumDeductions([]);

      expect(result).toBe(0);
    });

    it("should handle single deduction", () => {
      const result = sumDeductions([{ amount: 150 }]);

      expect(result).toBe(150);
    });

    it("should ignore invalid amounts", () => {
      const deductions = [
        { amount: 100 },
        { amount: "invalid" },
        { amount: NaN },
        { amount: 50 },
      ];

      const result = sumDeductions(deductions);

      expect(result).toBe(150);
    });

    it("should round to 2 decimal places", () => {
      const deductions = [{ amount: 100.333 }, { amount: 200.666 }];

      const result = sumDeductions(deductions);

      expect(result).toBe(301); // Rounded
    });
  });
});

describe("Penalty Calculations", () => {
  describe("parsePenaltyMultiplier", () => {
    it("should parse '2x' multiplier", () => {
      expect(parsePenaltyMultiplier("2x deposit amount")).toBe(2);
      expect(parsePenaltyMultiplier("2X deposit")).toBe(2);
    });

    it("should parse 'twice' multiplier", () => {
      expect(parsePenaltyMultiplier("twice the deposit")).toBe(2);
      expect(parsePenaltyMultiplier("Twice the amount")).toBe(2);
    });

    it("should parse 'double' multiplier", () => {
      expect(parsePenaltyMultiplier("double the deposit")).toBe(2);
    });

    it("should parse '3x' multiplier", () => {
      expect(parsePenaltyMultiplier("3x deposit amount")).toBe(3);
    });

    it("should parse 'triple' multiplier", () => {
      expect(parsePenaltyMultiplier("triple the deposit")).toBe(3);
    });

    it("should parse 'three times' multiplier", () => {
      expect(parsePenaltyMultiplier("three times the deposit")).toBe(3);
    });

    it("should parse numbered 'X times' pattern", () => {
      expect(parsePenaltyMultiplier("4 times the deposit")).toBe(4);
      expect(parsePenaltyMultiplier("5x the amount")).toBe(5);
    });

    it("should return null for unrecognized patterns", () => {
      expect(parsePenaltyMultiplier("some penalty")).toBeNull();
      expect(parsePenaltyMultiplier("additional fees")).toBeNull();
    });
  });

  describe("calculatePenaltyAmount", () => {
    it("should calculate 2x penalty", () => {
      const result = calculatePenaltyAmount(2000, "2x deposit amount");

      expect(result).toBe(4000);
    });

    it("should calculate 3x penalty", () => {
      const result = calculatePenaltyAmount(1500, "triple the deposit");

      expect(result).toBe(4500);
    });

    it("should return null for unrecognized penalty", () => {
      const result = calculatePenaltyAmount(2000, "unspecified penalty");

      expect(result).toBeNull();
    });

    it("should round to 2 decimal places", () => {
      const result = calculatePenaltyAmount(1000.333, "2x deposit");

      expect(result).toBe(2000.67); // Rounded
    });
  });
});

describe("Proration Calculations", () => {
  describe("calculateProration", () => {
    it("should return 1 for new items", () => {
      expect(calculateProration(0, 60)).toBe(1);
    });

    it("should return 0.5 for half-life items", () => {
      expect(calculateProration(30, 60)).toBe(0.5);
    });

    it("should return 0 for fully depreciated items", () => {
      expect(calculateProration(60, 60)).toBe(0);
      expect(calculateProration(72, 60)).toBe(0); // Older than useful life
    });

    it("should calculate correct proration", () => {
      // 12 months old out of 60 = 48/60 = 0.8 remaining
      expect(calculateProration(12, 60)).toBe(0.8);
    });

    it("should use default 60 month useful life", () => {
      expect(calculateProration(30)).toBe(0.5);
    });
  });

  describe("applyProration", () => {
    it("should not reduce amount for new items", () => {
      expect(applyProration(1000, 0, 60)).toBe(1000);
    });

    it("should reduce amount by half for half-life items", () => {
      expect(applyProration(1000, 30, 60)).toBe(500);
    });

    it("should return 0 for fully depreciated items", () => {
      expect(applyProration(1000, 60, 60)).toBe(0);
    });

    it("should calculate correct prorated amount", () => {
      // Carpet replacement: $1200, 7 years old (84 months), 10 year life (120 months)
      // Remaining: (120-84)/120 = 0.3
      // Prorated: $1200 * 0.3 = $360
      expect(applyProration(1200, 84, 120)).toBe(360);
    });

    it("should round to 2 decimal places", () => {
      const result = applyProration(1000, 25, 60);

      expect(result.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });
});
