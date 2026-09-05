import React from "react";
import { render, screen } from "@testing-library/react";
import Footer from "../Footer";

describe("Footer Component", () => {
  let dateSpy;

  beforeEach(() => {
    const mockDate = new Date(2026, 0, 1);
    dateSpy = jest.spyOn(global, "Date").mockImplementation((...args) => {
      if (args.length) {
        return new (Function.prototype.bind.apply(Date, [null, ...args]))();
      }
      return mockDate;
    });

    global.Date.getFullYear = () => 2026;
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  test("renders business address, phone number, and dynamic copyright year", () => {
    render(<Footer />);

    expect(
      screen.getByText(/50A Southbury Rd, Enfield, EN1 1YB/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/020 8367 5888/i)).toBeInTheDocument();
    expect(screen.getByText(/Copyright 2025 - 2026/i)).toBeInTheDocument();
  });

  test("constructs and renders mailto link with obfuscated email", () => {
    render(<Footer />);

    const emailLink = screen.getByRole("link", {
      name: "info@lovedayauto.com",
    });

    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:info@lovedayauto.com");
  });
});
