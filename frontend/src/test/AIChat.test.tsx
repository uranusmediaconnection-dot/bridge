import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AIChat } from "../components/AIChat";

describe("AIChat", () => {
  const mockOnClose = vi.fn();
  const baseProps = { isOpen: true, onClose: mockOnClose, apiKeys: {} };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for models
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, models: [] }),
      })
    ) as any;
  });

  it("renders when open", () => {
    render(<AIChat {...baseProps} />);
    expect(screen.getByText("AI Assistant")).toBeDefined();
  });

  it("does not render when closed", () => {
    render(<AIChat isOpen={false} onClose={mockOnClose} apiKeys={{}} />);
    expect(screen.queryByText("AI Assistant")).toBeNull();
  });

  it("renders message input", () => {
    render(<AIChat {...baseProps} />);
    const input = screen.getByPlaceholderText("Ask AI anything...");
    expect(input).toBeDefined();
  });

  it("renders send button", () => {
    render(<AIChat {...baseProps} />);
    const sendButton = screen.getByTitle("Send");
    expect(sendButton).toBeDefined();
  });

  it("shows empty state message", () => {
    render(<AIChat {...baseProps} />);
    expect(screen.getByText("Start a conversation with AI")).toBeDefined();
  });

  it("shows provider count when API keys are provided", () => {
    render(
      <AIChat
        isOpen={true}
        onClose={mockOnClose}
        apiKeys={{ openai: "sk-test", openrouter: "sk-test" }}
      />
    );
    expect(screen.getByText("2 provider(s) configured")).toBeDefined();
  });

  it("shows message to add API keys when none provided", () => {
    render(<AIChat {...baseProps} />);
    expect(screen.getByText("Add API keys in Providers panel to get started")).toBeDefined();
  });

  it("allows typing in input", () => {
    render(<AIChat {...baseProps} />);
    const input = screen.getByPlaceholderText("Ask AI anything...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Hello AI" } });
    expect(input.value).toBe("Hello AI");
  });

  it("has clear chat button", () => {
    render(<AIChat {...baseProps} />);
    // There are two X buttons - one for clear, one for close
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("disables send button when input is empty", () => {
    render(<AIChat {...baseProps} />);
    const sendButton = screen.getByTitle("Send");
    expect(sendButton).toBeDisabled();
  });
});
