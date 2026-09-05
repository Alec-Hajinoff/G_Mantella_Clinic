import React from "react";
import { render, screen } from "@testing-library/react";
import Main from "../Main";

jest.mock("../HeroSection", () => {
  return function DummyHeroSection() {
    return <div data-testid="dummy-hero-section">Hero Section</div>;
  };
});

jest.mock("../BookingCallToAction", () => {
  return function DummyBookingCallToAction({
    isAuthenticated,
    userRole,
    isLoading,
  }) {
    return (
      <div data-testid="dummy-booking-cta">
        CTA - Auth: {String(isAuthenticated)}, Role: {userRole}, Loading:{" "}
        {String(isLoading)}
      </div>
    );
  };
});

jest.mock("../ShopPage", () => {
  return function DummyShopPage() {
    return <div data-testid="dummy-shop-page">Shop Page</div>;
  };
});

describe("Main Component", () => {
  test("renders all child components and structural elements", () => {
    render(
      <Main isAuthenticated={false} userRole="customer" isLoading={false} />,
    );

    expect(screen.getByTestId("dummy-hero-section")).toBeInTheDocument();
    expect(screen.getByTestId("dummy-booking-cta")).toBeInTheDocument();
    expect(screen.getByTestId("dummy-shop-page")).toBeInTheDocument();

    const heading = screen.getByRole("heading", {
      level: 2,
      name: /our products/i,
    });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("hero-title");
  });

  test("passes isAuthenticated, userRole, and isLoading props correctly to BookingCallToAction", () => {
    render(<Main isAuthenticated={true} userRole="admin" isLoading={false} />);

    const ctaElement = screen.getByTestId("dummy-booking-cta");
    expect(ctaElement).toHaveTextContent(
      "CTA - Auth: true, Role: admin, Loading: false",
    );
  });
});
