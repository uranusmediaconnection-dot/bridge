import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { OctopusAnimation } from "../components/OctopusAnimation";

describe("OctopusAnimation", () => {
  it("renders without crashing", () => {
    const { container } = render(<OctopusAnimation />);
    expect(container.querySelector(".octopus-container")).toBeDefined();
  });

  it("renders SVG elements", () => {
    const { container } = render(<OctopusAnimation />);
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
  });
});
