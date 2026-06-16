import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "../components/ThemeToggle";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: vi.fn(),
    resolvedTheme: "dark",
  }),
}));

describe("ThemeToggle", () => {
  it("renders the toggle button", () => {
    render(<ThemeToggle />);
    const toggle = screen.getByTestId("theme-toggle");
    expect(toggle).toBeDefined();
  });

  it("has aria-label for accessibility", () => {
    render(<ThemeToggle />);
    const toggle = screen.getByTestId("theme-toggle");
    expect(toggle.getAttribute("aria-label")).toBeTruthy();
  });
});
