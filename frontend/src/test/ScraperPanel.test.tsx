import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScraperPanel } from "../components/ScraperPanel";

describe("ScraperPanel", () => {
  const defaultProps = {
    onComplete: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
  };

  it("renders the header", () => {
    render(<ScraperPanel {...defaultProps} />);
    expect(screen.getByText("Web Scraper")).toBeDefined();
    expect(screen.getByText("Extract content from any website")).toBeDefined();
  });

  it("renders URL input field", () => {
    render(<ScraperPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("https://example.com");
    expect(input).toBeDefined();
  });

  it("updates URL value on input change", () => {
    render(<ScraperPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("https://example.com") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "https://test.com" } });
    expect(input.value).toBe("https://test.com");
  });

  it("renders scraper engine options", () => {
    render(<ScraperPanel {...defaultProps} />);
    expect(screen.getByText("Requests")).toBeDefined();
    expect(screen.getByText("BeautifulSoup")).toBeDefined();
    expect(screen.getByText("Selenium")).toBeDefined();
  });

  it("renders the timeout slider", () => {
    render(<ScraperPanel {...defaultProps} />);
    expect(screen.getByText(/Timeout/)).toBeDefined();
  });

  it("renders the start scraping button", () => {
    render(<ScraperPanel {...defaultProps} />);
    expect(screen.getByText("Start Scraping")).toBeDefined();
  });

  it("disables button when URL is empty", () => {
    render(<ScraperPanel {...defaultProps} />);
    const button = screen.getByText("Start Scraping").closest("button");
    expect(button?.disabled).toBe(true);
  });

  it("enables button when URL is filled", () => {
    render(<ScraperPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("https://example.com");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    const button = screen.getByText("Start Scraping").closest("button");
    expect(button?.disabled).toBe(false);
  });

  it("shows loading state when loading prop is true", () => {
    render(<ScraperPanel {...defaultProps} loading={true} />);
    expect(screen.getByText(/Scraping with/)).toBeDefined();
  });

  it("disables inputs when loading", () => {
    const { container } = render(<ScraperPanel {...defaultProps} loading={true} />);
    const inputs = container.querySelectorAll("input");
    inputs.forEach((input) => { expect(input.disabled).toBe(true); });
  });

  it("shows info section about scraper types", () => {
    render(<ScraperPanel {...defaultProps} />);
    expect(screen.getByText("About Web Scraping")).toBeDefined();
  });
});
