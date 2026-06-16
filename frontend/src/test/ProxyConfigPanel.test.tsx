import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProxyConfigPanel } from "../components/ProxyConfigPanel";

describe("ProxyConfigPanel", () => {
  it("renders the panel header", () => {
    render(<ProxyConfigPanel />);
    expect(screen.getByText("Proxy & Scraping Rules")).toBeDefined();
  });

  it("toggles expanded state on click", () => {
    render(<ProxyConfigPanel />);
    const header = screen.getByText("Proxy & Scraping Rules");
    fireEvent.click(header);
    expect(screen.getByText("Rotation Strategy")).toBeDefined();
  });

  it("shows proxy status text", () => {
    render(<ProxyConfigPanel />);
    expect(screen.getByText(/Proxy rotation active/)).toBeDefined();
  });

  it("has a save button when expanded", () => {
    render(<ProxyConfigPanel />);
    fireEvent.click(screen.getByText("Proxy & Scraping Rules"));
    expect(screen.getByText("Save Configuration")).toBeDefined();
  });
});
