import { describe, it, expect } from "vitest";
import { render, screen } from "../../../setup/test-utils";
import { CoverageBadge } from "@/components/domain/coverage-badge";

describe("CoverageBadge", () => {
  describe("full coverage", () => {
    it("should display 'Full coverage' label", () => {
      render(<CoverageBadge level="full" />);

      expect(screen.getByText("Full coverage")).toBeInTheDocument();
    });

    it("should apply success styles", () => {
      const { container } = render(<CoverageBadge level="full" />);

      expect(container.firstChild).toHaveClass("bg-success/10");
      expect(container.firstChild).toHaveClass("text-success");
    });

    it("should render CheckCircle icon", () => {
      const { container } = render(<CoverageBadge level="full" />);

      // The icon should be an SVG
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("partial coverage", () => {
    it("should display 'Partial coverage' label", () => {
      render(<CoverageBadge level="partial" />);

      expect(screen.getByText("Partial coverage")).toBeInTheDocument();
    });

    it("should apply warning styles", () => {
      const { container } = render(<CoverageBadge level="partial" />);

      expect(container.firstChild).toHaveClass("bg-warning/10");
      expect(container.firstChild).toHaveClass("text-warning");
    });
  });

  describe("state_only coverage", () => {
    it("should display 'State rules only' label", () => {
      render(<CoverageBadge level="state_only" />);

      expect(screen.getByText("State rules only")).toBeInTheDocument();
    });

    it("should apply muted styles", () => {
      const { container } = render(<CoverageBadge level="state_only" />);

      expect(container.firstChild).toHaveClass("bg-muted");
      expect(container.firstChild).toHaveClass("text-muted-foreground");
    });
  });

  describe("showLabel prop", () => {
    it("should show label by default", () => {
      render(<CoverageBadge level="full" />);

      expect(screen.getByText("Full coverage")).toBeInTheDocument();
    });

    it("should hide label when showLabel is false", () => {
      render(<CoverageBadge level="full" showLabel={false} />);

      expect(screen.queryByText("Full coverage")).not.toBeInTheDocument();
    });

    it("should still show icon when label is hidden", () => {
      const { container } = render(
        <CoverageBadge level="full" showLabel={false} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <CoverageBadge level="full" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
