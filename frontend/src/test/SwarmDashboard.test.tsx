import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SwarmDashboard } from "../components/SwarmDashboard";

// Mock the API
vi.mock("../lib/api", () => ({
  scraperAPI: {
    swarm: vi.fn().mockResolvedValue({
      success: true,
      logs: [
        { agent: "architect", status: "completed", message: "DOM mapping complete", icon: "Blueprint" },
      ],
      results: [
        { company: "Software Corp 1", location: "Chicago", industry: "Software", confidence: "95.2%", url: "https://example.com/1" },
      ],
    }),
  },
}));

describe("SwarmDashboard", () => {
  const defaultProps = { onComplete: vi.fn() };

  beforeEach(() => { vi.clearAllMocks(); });

  it("renders the dashboard header", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByText("Swarm Intelligence")).toBeDefined();
  });

  it("renders the AI chat panel", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByText("AI Assistant")).toBeDefined();
  });

  it("renders initial chat messages", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByText(/prepare a script for Software industry/)).toBeDefined();
    expect(screen.getByText(/Understood. Got requirements/)).toBeDefined();
  });

  it("renders quick prompt buttons", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByText(/Prepare a script for Software industry/)).toBeDefined();
    expect(screen.getByText(/Find healthcare companies/)).toBeDefined();
  });

  it("renders chat input", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByPlaceholderText("Type your message...")).toBeDefined();
  });

  it("renders the execute button", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByText("Execute Swarm Operation")).toBeDefined();
  });

  it("renders scraper types info", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByText("Scraper Types")).toBeDefined();
  });

  it("renders agent console", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByText("agent-console")).toBeDefined();
    expect(screen.getByText("Waiting for activation...")).toBeDefined();
  });

  it("renders status bar", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByText(/Ready for/)).toBeDefined();
  });

  it("renders agent names", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getAllByText("Architect").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Coder").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Debugger").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Supervisor").length).toBeGreaterThanOrEqual(1);
  });

  it("renders Swarm Online indicator", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByText("Swarm Online")).toBeDefined();
  });

  it("renders progress percentage", () => {
    render(<SwarmDashboard {...defaultProps} />);
    expect(screen.getByText("0%")).toBeDefined();
  });

  it("updates chat message on input change", () => {
    render(<SwarmDashboard {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type your message...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test message" } });
    expect(input.value).toBe("test message");
  });

  it("populates chat input when quick prompt is clicked", () => {
    render(<SwarmDashboard {...defaultProps} />);
    const quickPrompt = screen.getByText(/Find healthcare companies/);
    fireEvent.click(quickPrompt);
    const input = screen.getByPlaceholderText("Type your message...") as HTMLInputElement;
    expect(input.value).toContain("healthcare");
  });

  it("enables execute button by default", () => {
    render(<SwarmDashboard {...defaultProps} />);
    const executeBtn = screen.getByText("Execute Swarm Operation").closest("button");
    expect(executeBtn?.disabled).toBe(false);
  });
});
