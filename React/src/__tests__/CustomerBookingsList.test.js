import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CustomerBookingsList from "../CustomerBookingsList";
import { customerBookingsList } from "../ApiService";

jest.mock("../ApiService", () => ({
  customerBookingsList: jest.fn(),
}));

jest.mock("../CustomerCancelBooking", () => {
  return function DummyCancelBooking({ appointmentId, onBookingCancelled }) {
    return (
      <button
        data-testid={`cancel-btn-${appointmentId}`}
        onClick={onBookingCancelled}
      >
        Cancel Appointment
      </button>
    );
  };
});

describe("CustomerBookingsList Component", () => {
  const mockUpcomingBookings = [
    {
      appointment_id: 101,
      date: "2026-09-01",
      start_time: "09:00:00",
      end_time: "10:00:00",
      service_name: "Full Service",
      vehicle_reg: "AB12 CDE",
      notes: "Check oil filter",
    },
  ];

  const mockPastBookings = [
    {
      appointment_id: 102,
      date: "2026-01-15",
      start_time: "14:00:00",
      end_time: "15:00:00",
      service_name: "MOT Test",
      vehicle_reg: "XY55 ZZZ",
      notes: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("displays loading text initially", () => {
    customerBookingsList.mockImplementation(() => new Promise(() => {}));
    render(<CustomerBookingsList />);

    expect(screen.getByText("Loading your bookings...")).toBeInTheDocument();
  });

  test("renders empty states when no upcoming or past bookings exist", async () => {
    customerBookingsList.mockResolvedValueOnce({
      status: "success",
      upcoming: [],
      past: [],
    });

    render(<CustomerBookingsList />);

    await waitFor(() => {
      expect(
        screen.queryByText("Loading your bookings..."),
      ).not.toBeInTheDocument();
    });

    expect(
      screen.getByText("No upcoming appointments scheduled."),
    ).toBeInTheDocument();
    expect(screen.getByText("No past appointments found.")).toBeInTheDocument();
  });

  test("renders upcoming and past booking cards correctly", async () => {
    customerBookingsList.mockResolvedValueOnce({
      status: "success",
      upcoming: mockUpcomingBookings,
      past: mockPastBookings,
    });

    render(<CustomerBookingsList />);

    await waitFor(() => {
      expect(
        screen.getByText("2026-09-01 (09:00 - 10:00)"),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Full Service")).toBeInTheDocument();
    expect(screen.getByText("AB12 CDE")).toBeInTheDocument();
    expect(screen.getByText("Check oil filter")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-btn-101")).toBeInTheDocument();

    expect(screen.getByText("2026-01-15 (14:00 - 15:00)")).toBeInTheDocument();
    expect(screen.getByText("Past")).toBeInTheDocument();
    expect(screen.getByText("MOT Test")).toBeInTheDocument();
    expect(screen.getByText("XY55 ZZZ")).toBeInTheDocument();
    expect(screen.queryByTestId("cancel-btn-102")).not.toBeInTheDocument();
  });

  test("renders error message on API failure", async () => {
    customerBookingsList.mockResolvedValueOnce({
      status: "error",
      message: "Failed to fetch customer data.",
    });

    render(<CustomerBookingsList />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to fetch customer data."),
      ).toBeInTheDocument();
    });
  });

  test("renders error message on promise rejection", async () => {
    customerBookingsList.mockRejectedValueOnce(new Error("Network Error"));

    render(<CustomerBookingsList />);

    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });
  });

  test("re-fetches bookings and dispatches event when cancellation occurs", async () => {
    customerBookingsList.mockResolvedValue({
      status: "success",
      upcoming: mockUpcomingBookings,
      past: [],
    });

    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");

    render(<CustomerBookingsList />);

    await waitFor(() => {
      expect(screen.getByTestId("cancel-btn-101")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cancel-btn-101"));

    await waitFor(() => {
      expect(customerBookingsList).toHaveBeenCalledTimes(3);
    });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "bookingUpdated" }),
    );

    dispatchEventSpy.mockRestore();
  });

  test("re-fetches bookings when 'bookingUpdated' window event is triggered", async () => {
    customerBookingsList.mockResolvedValue({
      status: "success",
      upcoming: [],
      past: [],
    });

    render(<CustomerBookingsList />);

    await waitFor(() => {
      expect(customerBookingsList).toHaveBeenCalledTimes(1);
    });

    fireEvent(window, new CustomEvent("bookingUpdated"));

    await waitFor(() => {
      expect(customerBookingsList).toHaveBeenCalledTimes(2);
    });
  });
});
