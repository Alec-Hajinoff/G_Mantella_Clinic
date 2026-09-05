import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserDashboard from "../UserDashboard";

jest.mock("../BookingCalendar", () => () => (
  <div data-testid="booking-calendar">Booking Calendar Component</div>
));
jest.mock("../CustomerBookingsList", () => () => (
  <div data-testid="customer-bookings-list">
    Customer Bookings List Component
  </div>
));
jest.mock("../CustomerProfile", () => () => (
  <div data-testid="customer-profile">Customer Profile Component</div>
));
jest.mock("../CustomerDeleteAccount", () => () => (
  <div data-testid="customer-delete-account">
    Customer Delete Account Component
  </div>
));

describe("UserDashboard Component", () => {
  test("renders the dashboard header and tab navigation", () => {
    render(<UserDashboard />);

    expect(
      screen.getByText(
        /Welcome to your dashboard. Here you can book and track your appointments and manage your account./i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Book a Service/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /My Bookings/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Account/i }),
    ).toBeInTheDocument();
  });

  test("renders 'Book a Service' tab as active by default", () => {
    render(<UserDashboard />);

    const bookServiceTab = screen.getByRole("button", {
      name: /Book a Service/i,
    });
    expect(bookServiceTab).toHaveClass("active");
    expect(screen.getByTestId("booking-calendar")).toBeInTheDocument();

    expect(
      screen.queryByTestId("customer-bookings-list"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("customer-profile")).not.toBeInTheDocument();
  });

  test("switches to 'My Bookings' tab when clicked", () => {
    render(<UserDashboard />);

    const myBookingsTab = screen.getByRole("button", { name: /My Bookings/i });
    fireEvent.click(myBookingsTab);

    expect(myBookingsTab).toHaveClass("active");
    expect(screen.getByTestId("customer-bookings-list")).toBeInTheDocument();

    expect(screen.queryByTestId("booking-calendar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("customer-profile")).not.toBeInTheDocument();
  });

  test("switches to 'Account' tab when clicked and displays profile and delete components", () => {
    render(<UserDashboard />);

    const accountTab = screen.getByRole("button", { name: /Account/i });
    fireEvent.click(accountTab);

    expect(accountTab).toHaveClass("active");
    expect(screen.getByTestId("customer-profile")).toBeInTheDocument();
    expect(screen.getByTestId("customer-delete-account")).toBeInTheDocument();

    expect(screen.queryByTestId("booking-calendar")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("customer-bookings-list"),
    ).not.toBeInTheDocument();
  });
});
