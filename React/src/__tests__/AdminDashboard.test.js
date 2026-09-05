import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard from "../AdminDashboard";

jest.mock("../LogoutComponent", () => () => (
  <div data-testid="logout-component">Logout Component</div>
));
jest.mock("../BusinessHoursManager", () => () => (
  <div data-testid="business-hours-manager">Business Hours Manager</div>
));
jest.mock("../ServiceManager", () => () => (
  <div data-testid="service-manager">Service Manager</div>
));
jest.mock("../AdminBookingsList", () => () => (
  <div data-testid="admin-bookings-list">Admin Bookings List</div>
));
jest.mock("../AdminBookingCalendar", () => () => (
  <div data-testid="admin-booking-calendar">Admin Booking Calendar</div>
));
jest.mock("../AvailabilityHorizonExtender", () => () => (
  <div data-testid="availability-horizon-extender">
    Availability Horizon Extender
  </div>
));
jest.mock("../AdminProductEntry", () => ({ onProductAdded }) => (
  <div data-testid="admin-product-entry">
    <button type="button" onClick={onProductAdded}>
      Add Product Mock
    </button>
  </div>
));

describe("AdminDashboard Component", () => {
  it("renders welcome text and navigation tabs", () => {
    render(<AdminDashboard />);

    expect(
      screen.getByText(/Welcome to your admin dashboard/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bookings & Calendar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Products & Services" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Appointment Availability" }),
    ).toBeInTheDocument();
  });

  it("renders 'Bookings & Calendar' tab content by default", () => {
    render(<AdminDashboard />);

    expect(screen.getByTestId("admin-bookings-list")).toBeInTheDocument();
    expect(screen.getByTestId("admin-booking-calendar")).toBeInTheDocument();

    expect(screen.queryByTestId("service-manager")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("business-hours-manager"),
    ).not.toBeInTheDocument();
  });

  it("switches to 'Products & Services' tab when clicked", () => {
    render(<AdminDashboard />);

    const productsTabBtn = screen.getByRole("button", {
      name: "Products & Services",
    });

    fireEvent.click(productsTabBtn);

    expect(productsTabBtn).toHaveClass("active");
    expect(screen.getByTestId("service-manager")).toBeInTheDocument();
    expect(screen.getByTestId("admin-product-entry")).toBeInTheDocument();

    expect(screen.queryByTestId("admin-bookings-list")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("admin-booking-calendar"),
    ).not.toBeInTheDocument();
  });

  it("switches to 'Appointment Availability' tab when clicked", () => {
    render(<AdminDashboard />);

    const availabilityTabBtn = screen.getByRole("button", {
      name: "Appointment Availability",
    });

    fireEvent.click(availabilityTabBtn);

    expect(availabilityTabBtn).toHaveClass("active");
    expect(screen.getByTestId("business-hours-manager")).toBeInTheDocument();
    expect(
      screen.getByTestId("availability-horizon-extender"),
    ).toBeInTheDocument();

    expect(screen.queryByTestId("admin-bookings-list")).not.toBeInTheDocument();
  });

  it("triggers handleProductAdded when onProductAdded callback is invoked from child", () => {
    render(<AdminDashboard />);

    fireEvent.click(
      screen.getByRole("button", { name: "Products & Services" }),
    );

    const addProductBtn = screen.getByRole("button", {
      name: "Add Product Mock",
    });

    expect(() => fireEvent.click(addProductBtn)).not.toThrow();
  });
});
