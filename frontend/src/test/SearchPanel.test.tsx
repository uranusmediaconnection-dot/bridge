import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchPanel } from "../components/SearchPanel";

describe("SearchPanel", () => {
  const defaultProps = {
    onComplete: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
  };

  it("renders the header", () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText("Web Search")).toBeDefined();
    expect(screen.getByText("Search across multiple engines")).toBeDefined();
  });

  it("renders search input", () => {
    render(<SearchPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your search query...");
    expect(input).toBeDefined();
  });

  it("updates query value on input change", () => {
    render(<SearchPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText(
      "Enter your search query..."
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test query" } });
    expect(input.value).toBe("test query");
  });

  it("renders engine selection options", () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText("Google")).toBeDefined();
    expect(screen.getByText("Bing")).toBeDefined();
    expect(screen.getByText("DuckDuckGo")).toBeDefined();
  });

  it("renders results count slider", () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText(/Results per engine/)).toBeDefined();
  });

  it("renders both search buttons", () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText("Search")).toBeDefined();
    expect(screen.getByText("Search All")).toBeDefined();
  });

  it("disables buttons when query is empty", () => {
    render(<SearchPanel {...defaultProps} />);
    const searchButton = screen.getByText("Search").closest("button");
    const searchAllButton = screen.getByText("Search All").closest("button");
    expect(searchButton?.disabled).toBe(true);
    expect(searchAllButton?.disabled).toBe(true);
  });

  it("enables buttons when query is entered", () => {
    render(<SearchPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your search query...");
    fireEvent.change(input, { target: { value: "test" } });
    const searchButton = screen.getByText("Search").closest("button");
    expect(searchButton?.disabled).toBe(false);
  });

  it("shows loading state when loading prop is true", () => {
    render(<SearchPanel {...defaultProps} loading={true} />);
    expect(screen.getByText(/Searching/)).toBeDefined();
  });

  it("shows info about engines", () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText("About Engines")).toBeDefined();
  });
});
