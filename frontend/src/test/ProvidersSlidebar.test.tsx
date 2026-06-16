import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProvidersSlidebar } from "../components/ProvidersSlidebar";

describe("ProvidersSlidebar", () => {
  const defaultProps = { isOpen: true, onClose: vi.fn() };

  it("renders when open", () => {
    render(<ProvidersSlidebar {...defaultProps} />);
    expect(screen.getByText("AI Providers")).toBeDefined();
    expect(screen.getByText("Free tier models")).toBeDefined();
  });

  it("renders all provider names", () => {
    render(<ProvidersSlidebar {...defaultProps} />);
    expect(screen.getByText("OpenRouter")).toBeDefined();
    expect(screen.getByText("Opencode ZEN")).toBeDefined();
    expect(screen.getByText("OpenProvider AI")).toBeDefined();
  });

  it("renders close button", () => {
    render(<ProvidersSlidebar {...defaultProps} />);
    const closeBtn = screen.getByRole("button", { name: "" });
    expect(closeBtn).toBeDefined();
  });

  it("does not render content when closed", () => {
    render(<ProvidersSlidebar isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("AI Providers")).toBeNull();
  });
});
