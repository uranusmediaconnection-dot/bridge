import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar } from "../components/Navbar";

// Mock the API (if Navbar imports it directly)
vi.mock("../lib/api", () => ({
  scraperAPI: {},
}));

describe("Navbar", () => {
  const defaultProps = {
    activeTab: "scraper" as const,
    onTabChange: vi.fn(),
    isProcessing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the brand title", () => {
    render(React.createElement(Navbar, defaultProps));
    expect(screen.getByText("Web Intelligence")).toBeDefined();
  });

  it("renders the subtitle", () => {
    render(React.createElement(Navbar, defaultProps));
    expect(screen.getByText("AI-Powered Suite")).toBeDefined();
  });

  it("renders the tab buttons", () => {
    render(React.createElement(Navbar, defaultProps));
    expect(screen.getByText("Swarm Agent")).toBeDefined();
    expect(screen.getByText("Web Search")).toBeDefined();
  });
});
