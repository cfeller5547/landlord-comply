import { describe, it, expect } from "vitest";
import { render, screen } from "../../../setup/test-utils";
import { StatusBadge } from "@/components/domain/status-badge";

describe("StatusBadge", () => {
  describe("active status", () => {
    it("should display 'Active' label", () => {
      render(<StatusBadge status="active" />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should apply info styles", () => {
      const { container } = render(<StatusBadge status="active" />);

      expect(container.firstChild).toHaveClass("bg-info/10");
      expect(container.firstChild).toHaveClass("text-info");
    });
  });

  describe("pending_send status", () => {
    it("should display 'Ready to Send' label", () => {
      render(<StatusBadge status="pending_send" />);

      expect(screen.getByText("Ready to Send")).toBeInTheDocument();
    });

    it("should apply warning styles", () => {
      const { container } = render(<StatusBadge status="pending_send" />);

      expect(container.firstChild).toHaveClass("bg-warning/10");
      expect(container.firstChild).toHaveClass("text-warning");
    });
  });

  describe("sent status", () => {
    it("should display 'Sent' label", () => {
      render(<StatusBadge status="sent" />);

      expect(screen.getByText("Sent")).toBeInTheDocument();
    });

    it("should apply success styles", () => {
      const { container } = render(<StatusBadge status="sent" />);

      expect(container.firstChild).toHaveClass("bg-success/10");
      expect(container.firstChild).toHaveClass("text-success");
    });
  });

  describe("closed status", () => {
    it("should display 'Closed' label", () => {
      render(<StatusBadge status="closed" />);

      expect(screen.getByText("Closed")).toBeInTheDocument();
    });

    it("should apply muted styles", () => {
      const { container } = render(<StatusBadge status="closed" />);

      expect(container.firstChild).toHaveClass("bg-muted");
      expect(container.firstChild).toHaveClass("text-muted-foreground");
    });
  });

  describe("custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <StatusBadge status="active" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should merge with variant styles", () => {
      const { container } = render(
        <StatusBadge status="active" className="mt-4" />
      );

      expect(container.firstChild).toHaveClass("bg-info/10");
      expect(container.firstChild).toHaveClass("mt-4");
    });
  });

  describe("common styles", () => {
    it("should have border and rounded corners", () => {
      const { container } = render(<StatusBadge status="active" />);

      expect(container.firstChild).toHaveClass("border");
      expect(container.firstChild).toHaveClass("rounded-md");
    });

    it("should have consistent text styling", () => {
      const { container } = render(<StatusBadge status="active" />);

      expect(container.firstChild).toHaveClass("text-xs");
      expect(container.firstChild).toHaveClass("font-medium");
    });
  });
});
