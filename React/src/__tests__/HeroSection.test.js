import React from "react";
import { render, screen } from "@testing-library/react";
import HeroSection from "../HeroSection";

describe("HeroSection Component", () => {
  test("renders hero section container with correct class", () => {
    const { container } = render(<HeroSection />);
    const sectionElement = container.querySelector("section");

    expect(sectionElement).toBeInTheDocument();
    expect(sectionElement).toHaveClass("hero-section-wrapper");
  });

  test("renders main heading with exact text content", () => {
    render(<HeroSection />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: /professional vehicle servicing and repairs from a trusted local garage\./i,
    });

    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("hero-heading");
  });
});
