import { describe, it, expect } from "vitest";
import { render, screen } from "../../../setup/test-utils";
import { DeadlineChip } from "@/components/domain/deadline-chip";

describe("DeadlineChip", () => {
  describe("days text formatting", () => {
    it("should display 'Due today' when daysLeft is 0", () => {
      render(<DeadlineChip daysLeft={0} dueDate={new Date()} />);

      expect(screen.getByText("Due today")).toBeInTheDocument();
    });

    it("should display '1 day left' singular form", () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      render(<DeadlineChip daysLeft={1} dueDate={dueDate} />);

      expect(screen.getByText("1 day left")).toBeInTheDocument();
    });

    it("should display plural form for multiple days", () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10);

      render(<DeadlineChip daysLeft={10} dueDate={dueDate} />);

      expect(screen.getByText("10 days left")).toBeInTheDocument();
    });

    it("should display overdue text with absolute value", () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5);

      render(<DeadlineChip daysLeft={-5} dueDate={dueDate} />);

      expect(screen.getByText("5d overdue")).toBeInTheDocument();
    });

    it("should display '1d overdue' for 1 day overdue", () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 1);

      render(<DeadlineChip daysLeft={-1} dueDate={dueDate} />);

      expect(screen.getByText("1d overdue")).toBeInTheDocument();
    });
  });

  describe("variant styles", () => {
    it("should apply normal variant styles for >7 days", () => {
      const { container } = render(
        <DeadlineChip daysLeft={10} dueDate={new Date()} />
      );

      expect(container.firstChild).toHaveClass("bg-muted");
    });

    it("should apply warning variant styles for 4-7 days", () => {
      const { container } = render(
        <DeadlineChip daysLeft={5} dueDate={new Date()} />
      );

      expect(container.firstChild).toHaveClass("bg-warning/15");
    });

    it("should apply warning styles at exactly 7 days", () => {
      const { container } = render(
        <DeadlineChip daysLeft={7} dueDate={new Date()} />
      );

      expect(container.firstChild).toHaveClass("bg-warning/15");
    });

    it("should apply danger variant styles for 1-3 days", () => {
      const { container } = render(
        <DeadlineChip daysLeft={2} dueDate={new Date()} />
      );

      expect(container.firstChild).toHaveClass("bg-danger/15");
    });

    it("should apply danger styles at exactly 3 days", () => {
      const { container } = render(
        <DeadlineChip daysLeft={3} dueDate={new Date()} />
      );

      expect(container.firstChild).toHaveClass("bg-danger/15");
    });

    it("should apply overdue variant styles for negative days", () => {
      const { container } = render(
        <DeadlineChip daysLeft={-1} dueDate={new Date()} />
      );

      expect(container.firstChild).toHaveClass("bg-danger");
      expect(container.firstChild).toHaveClass("text-white");
    });
  });

  describe("date formatting", () => {
    it("should display formatted date with month and day", () => {
      // Use a fixed date with time to avoid timezone issues
      const dueDate = new Date("2024-02-15T12:00:00");

      render(<DeadlineChip daysLeft={10} dueDate={dueDate} />);

      // Should show month and day - the exact format may vary by locale
      // Check that the date part of the component is rendered
      const dateText = screen.getByText(/Feb/);
      expect(dateText).toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <DeadlineChip
          daysLeft={10}
          dueDate={new Date()}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
