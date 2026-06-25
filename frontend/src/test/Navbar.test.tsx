import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Navbar } from "../components/Navbar";

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: vi.fn(),
    resolvedTheme: "dark",
  }),
}));

describe("Navbar", () => {
  const defaultProps = {
    activeTab: "scraper" as const,
    onTabChange: vi.fn(),
    isProcessing: false,
    onProvidersClick: vi.fn(),
  };

  it("renders the brand title", () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText("Web Intelligence")).toBeDefined();
  });

  it("renders the subtitle", () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText("AI-Powered Suite")).toBeDefined();
  });

  it("renders both navigation tabs", () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText("Swarm Agent")).toBeDefined();
    expect(screen.getByText("Web Search")).toBeDefined();
  });

  it("calls onTabChange when Swarm Agent tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<Navbar {...defaultProps} onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText("Swarm Agent"));
    expect(onTabChange).toHaveBeenCalledWith("scraper");
  });

  it("calls onTabChange when Web Search tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<Navbar {...defaultProps} onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText("Web Search"));
    expect(onTabChange).toHaveBeenCalledWith("search");
  });

  it("highlights the active scraper tab", () => {
    render(<Navbar {...defaultProps} activeTab="scraper" />);
    const scraperTab = screen.getByText("Swarm Agent").closest("button");
    expect(scraperTab?.className).toContain("text-white");
  });

  it("highlights the active search tab", () => {
    render(<Navbar {...defaultProps} activeTab="search" />);
    const searchTab = screen.getByText("Web Search").closest("button");
    expect(searchTab?.className).toContain("text-white");
  });

  it("disables tab interaction when processing", () => {
    const onTabChange = vi.fn();
    render(
      <Navbar {...defaultProps} onTabChange={onTabChange} isProcessing={true} />
    );
    const scraperTab = screen.getByText("Swarm Agent").closest("button");
    const searchTab = screen.getByText("Web Search").closest("button");
    expect(scraperTab).toBeDisabled();
    expect(searchTab).toBeDisabled();
  });

  it("renders the Providers button", () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText("Providers")).toBeDefined();
  });

  it("renders the API Docs link", () => {
    render(<Navbar {...defaultProps} />);
    const apiLink = screen.getByText("API Docs").closest("a");
    expect(apiLink).toBeDefined();
    expect(apiLink?.getAttribute("href")).toBe("http://127.0.0.1:8000/docs");
  });

  it("renders the theme toggle button", async () => {
    render(<Navbar {...defaultProps} />);
    const toggles = await waitFor(() => screen.getAllByTestId("theme-toggle"));
    // Navbar renders 2 toggles (mobile and desktop)
    expect(toggles.length).toBeGreaterThan(0);
  });
});
