import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminBookingsList from "../AdminBookingsList";
import { adminBookingsList } from "../ApiService";

jest.mock("../ApiService", () => ({
  adminBookingsList: jest.fn(),
}));

jest.mock("../AdminCancelBooking", () => {
  return function MockAdminCancelBooking({
    appointmentId,
    onBookingCancelled,
  }) {
    return (
      <div data-testid={`cancel-container-${appointmentId}`}>
        <button
          type="button"
          data-testid={`cancel-btn-${appointmentId}`}
          onClick={onBookingCancelled}
        >
          Cancel Appointment
        </button>
      </div>
    );
  };
});

describe("AdminBookingsList Component", () => {
  const mockUpcomingBookings = [
    {
      appointment_id: 101,
      date: "2026-09-01",
      start_time: "09:00:00",
      end_time: "10:00:00",
      first_name: "John",
      surname: "Doe",
      customer_phone: "07123456789",
      customer_email: "john@example.com",
      service_name: "Full Service & MOT",
      vehicle_reg: "AB12CDE",
      notes: "Check brakes",
    },
  ];

  const mockPastBookings = [
    {
      appointment_id: 99,
      date: "2026-08-01",
      start_time: "14:00:00",
      end_time: "15:00:00",
      first_name: "Jane",
      surname: "Smith",
      customer_phone: "07987654321",
      customer_email: "jane@example.com",
      service_name: "Oil Change",
      vehicle_reg: "XY56ZHT",
      notes: "",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    adminBookingsList.mockImplementation(() => new Promise(() => {}));

    render(<AdminBookingsList />);

    expect(screen.getByText("Loading garage bookings...")).toBeInTheDocument();
  });

  it("fetches and renders upcoming and past bookings successfully", async () => {
    adminBookingsList.mockResolvedValueOnce({
      status: "success",
      upcoming: mockUpcomingBookings,
      past: mockPastBookings,
    });

    render(<AdminBookingsList />);

    await waitFor(() => {
      expect(screen.getByText("Future Appointments")).toBeInTheDocument();
      expect(screen.getByText("Past Appointments")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/2026-09-01 \(09:00 - 10:00\)/),
    ).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText("Full Service & MOT")).toBeInTheDocument();
    expect(screen.getByText("AB12CDE")).toBeInTheDocument();
    expect(screen.getByText("Check brakes")).toBeInTheDocument();

    expect(
      screen.getByText(/2026-08-01 \(14:00 - 15:00\)/),
    ).toBeInTheDocument();
    expect(screen.getByText("Past")).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
  });

  it("renders empty state messages when no bookings are available", async () => {
    adminBookingsList.mockResolvedValueOnce({
      status: "success",
      upcoming: [],
      past: [],
    });

    render(<AdminBookingsList />);

    await waitFor(() => {
      expect(
        screen.getByText("No upcoming appointments scheduled."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("No past appointments found."),
      ).toBeInTheDocument();
    });
  });

  it("displays an error alert when API request fails", async () => {
    adminBookingsList.mockRejectedValueOnce(
      new Error("Failed to connect to database"),
    );

    render(<AdminBookingsList />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to connect to database"),
      ).toBeInTheDocument();
    });
  });

  it("triggers fetchBookings and dispatches window event when a booking is cancelled", async () => {
    adminBookingsList.mockResolvedValue({
      status: "success",
      upcoming: mockUpcomingBookings,
      past: [],
    });

    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");

    render(<AdminBookingsList />);

    const cancelBtn = await screen.findByTestId("cancel-btn-101");
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(adminBookingsList).toHaveBeenCalledTimes(3);
    });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "bookingUpdated" }),
    );

    dispatchEventSpy.mockRestore();
  });

  it("refreshes bookings when window custom event 'bookingUpdated' is fired", async () => {
    adminBookingsList.mockResolvedValue({
      status: "success",
      upcoming: mockUpcomingBookings,
      past: [],
    });

    render(<AdminBookingsList />);

    await screen.findByText("Future Appointments");
    expect(adminBookingsList).toHaveBeenCalledTimes(1);

    fireEvent(window, new CustomEvent("bookingUpdated"));

    await waitFor(() => {
      expect(adminBookingsList).toHaveBeenCalledTimes(2);
    });
  });
});
