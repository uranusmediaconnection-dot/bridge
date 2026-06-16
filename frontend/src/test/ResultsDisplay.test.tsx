import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsDisplay } from "../components/ResultsDisplay";
import type { ScrapeResponse, SearchResult } from "../lib/api";

describe("ResultsDisplay", () => {
  const defaultProps = {
    scrapeResult: null,
    searchResults: [] as SearchResult[],
    loading: false,
  };

  it("shows empty state when no results", () => {
    render(<ResultsDisplay {...defaultProps} />);
    expect(screen.getByText("No results yet")).toBeDefined();
  });

  it("shows loading state when loading", () => {
    render(<ResultsDisplay {...defaultProps} loading={true} />);
    expect(screen.getByText("Processing...")).toBeDefined();
  });

  it("shows search results", () => {
    const results: SearchResult[] = [
      {
        title: "Test Result",
        url: "https://example.com",
        snippet: "This is a test snippet",
        engine: "google",
      },
    ];
    render(<ResultsDisplay {...defaultProps} searchResults={results} />);
    expect(screen.getByText("Test Result")).toBeDefined();
    expect(screen.getByText("1 results found")).toBeDefined();
  });

  it("shows multiple search results", () => {
    const results: SearchResult[] = [
      {
        title: "Result 1",
        url: "https://ex.com/1",
        snippet: "Snippet 1",
        engine: "google",
      },
      {
        title: "Result 2",
        url: "https://ex.com/2",
        snippet: "Snippet 2",
        engine: "bing",
      },
    ];
    render(<ResultsDisplay {...defaultProps} searchResults={results} />);
    expect(screen.getByText("2 results found")).toBeDefined();
  });

  it("shows scrape error state", () => {
    const scrapeResult: ScrapeResponse = {
      success: false,
      error: "Failed to connect",
    };
    render(
      <ResultsDisplay
        {...defaultProps}
        scrapeResult={scrapeResult}
        searchResults={[]}
      />
    );
    expect(screen.getByText("Scraping Failed")).toBeDefined();
    expect(screen.getAllByText("Failed to connect").length).toBeGreaterThanOrEqual(1);
  });

  it("shows scrape success data", () => {
    const scrapeResult: ScrapeResponse = {
      success: true,
      data: {
        url: "https://example.com",
        title: "Example Page",
        content: "Sample content here",
        html: "<html><body>Sample</body></html>",
        links: ["https://example.com/link1"],
        images: ["https://example.com/img1.png"],
        metadata: { charset: "utf-8" },
        status_code: 200,
        timestamp: new Date().toISOString(),
      },
    };
    render(
      <ResultsDisplay
        {...defaultProps}
        scrapeResult={scrapeResult}
        searchResults={[]}
      />
    );
    expect(screen.getByText("Example Page")).toBeDefined();
    expect(screen.getByText("200")).toBeDefined();
  });

  it("shows scrape with links", () => {
    const scrapeResult: ScrapeResponse = {
      success: true,
      data: {
        url: "https://example.com",
        title: "Page",
        content: "Content",
        html: "<html></html>",
        links: ["https://example.com/a", "https://example.com/b"],
        images: [],
        metadata: {},
        status_code: 200,
        timestamp: new Date().toISOString(),
      },
    };
    render(
      <ResultsDisplay
        {...defaultProps}
        scrapeResult={scrapeResult}
        searchResults={[]}
      />
    );
    expect(screen.getByText("Links (2)")).toBeDefined();
  });

  it("shows content preview for scrape data", () => {
    const scrapeResult: ScrapeResponse = {
      success: true,
      data: {
        url: "https://example.com",
        title: "Page",
        content: "This is the scraped content preview",
        html: "<html></html>",
        links: [],
        images: [],
        metadata: {},
        status_code: 200,
        timestamp: new Date().toISOString(),
      },
    };
    render(
      <ResultsDisplay
        {...defaultProps}
        scrapeResult={scrapeResult}
        searchResults={[]}
      />
    );
    expect(screen.getByText("Content Preview")).toBeDefined();
  });
});
