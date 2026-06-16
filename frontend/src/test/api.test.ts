import { describe, it, expect } from "vitest";
import type {
  ScrapeRequest,
  ScrapeResponse,
  SearchRequest,
  SearchResult,
  SearchResponse,
  SwarmRequest,
  SwarmResponse,
  SwarmLog,
  SwarmResult,
} from "../lib/api";

describe("API Types", () => {
  it("should define valid ScrapeRequest type", () => {
    const request: ScrapeRequest = {
      url: "https://example.com",
      scraper: "requests",
      timeout: 30,
    };
    expect(request.url).toBe("https://example.com");
    expect(request.scraper).toBe("requests");
    expect(request.timeout).toBe(30);
  });

  it("should define valid ScrapeResponse (success)", () => {
    const response: ScrapeResponse = {
      success: true,
      data: {
        url: "https://example.com",
        title: "Example",
        content: "<html></html>",
        html: "<html></html>",
        links: ["https://example.com/page1"],
        images: ["https://example.com/img.png"],
        metadata: { charset: "utf-8" },
        status_code: 200,
        timestamp: new Date().toISOString(),
      },
    };
    expect(response.success).toBe(true);
    expect(response.data?.title).toBe("Example");
    expect(response.data?.status_code).toBe(200);
  });

  it("should define valid ScrapeResponse (error)", () => {
    const response: ScrapeResponse = {
      success: false,
      error: "Failed to fetch URL",
    };
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.data).toBeUndefined();
  });

  it("should define valid SearchRequest", () => {
    const request: SearchRequest = {
      query: "test query",
      engine: "google",
      num_results: 10,
    };
    expect(request.query).toBe("test query");
    expect(request.engine).toBe("google");
  });

  it("should define valid SearchResult", () => {
    const result: SearchResult = {
      title: "Test Page",
      url: "https://example.com",
      snippet: "This is a test snippet",
      engine: "google",
    };
    expect(result.title).toBe("Test Page");
    expect(result.url).toContain("example.com");
  });

  it("should define valid SearchResponse", () => {
    const response: SearchResponse = {
      success: true,
      results: [
        { title: "Result 1", url: "https://ex.com/1", snippet: "Snip 1", engine: "google" },
        { title: "Result 2", url: "https://ex.com/2", snippet: "Snip 2", engine: "bing" },
      ],
    };
    expect(response.success).toBe(true);
    expect(response.results).toHaveLength(2);
  });

  it("should handle empty search results", () => {
    const response: SearchResponse = {
      success: true,
      results: [],
    };
    expect(response.success).toBe(true);
    expect(response.results).toHaveLength(0);
  });

  it("should define valid SwarmRequest", () => {
    const request: SwarmRequest = {
      industry: "Technology",
      location: "United States",
      amount: 25,
    };
    expect(request.industry).toBe("Technology");
    expect(request.amount).toBeGreaterThan(0);
  });

  it("should define valid SwarmLog", () => {
    const log: SwarmLog = {
      agent: "Architect",
      status: "completed",
      message: "DOM mapping complete",
      icon: "Blueprint",
    };
    expect(log.agent).toBe("Architect");
    expect(log.status).toBe("completed");
  });

  it("should define valid SwarmResult", () => {
    const result: SwarmResult = {
      company: "Tech Corp",
      location: "San Francisco",
      industry: "Technology",
      confidence: "95.2%",
      url: "https://example.com/tech-corp",
    };
    expect(result.company).toBe("Tech Corp");
    expect(result.confidence).toMatch(/%$/);
  });

  it("should define valid SwarmResponse", () => {
    const response: SwarmResponse = {
      success: true,
      logs: [
        { agent: "Architect", status: "completed", message: "Done", icon: "Blueprint" },
      ],
      results: [
        { company: "A", location: "US", industry: "Tech", confidence: "90%", url: "https://a.com" },
      ],
    };
    expect(response.success).toBe(true);
    expect(response.logs).toHaveLength(1);
    expect(response.results).toHaveLength(1);
  });

  it("should define valid SwarmResponse (error)", () => {
    const response: SwarmResponse = {
      success: false,
      error: "Swarm processing failed",
      logs: [],
      results: [],
    };
    expect(response.success).toBe(false);
    expect(response.error).toBe("Swarm processing failed");
  });
});
