import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GeometricFlowAnimation } from "../components/GeometricFlowAnimation";

describe("GeometricFlowAnimation", () => {
  it("renders without crashing", () => {
    const { container } = render(<GeometricFlowAnimation />);
    const wrapper = container.querySelector(".relative.w-full");
    expect(wrapper).toBeDefined();
  });

  it("renders canvas element", () => {
    const { container } = render(<GeometricFlowAnimation />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeDefined();
  });

  it("renders control buttons", () => {
    const { container } = render(<GeometricFlowAnimation />);
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(3);
  });

  it("displays title text", () => {
    const { getByText } = render(<GeometricFlowAnimation />);
    expect(getByText("Geometric Flow")).toBeDefined();
  });
});
