import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BookingCalendar from "../BookingCalendar";
import { bookingCalendar, selectedAppointmentSlot } from "../ApiService";

jest.mock("../ApiService", () => ({
  bookingCalendar: jest.fn(),
  selectedAppointmentSlot: jest.fn(),
}));

jest.mock("../BookingDetailsForm", () => {
  return function DummyBookingDetailsForm({ onConfirm, submitting }) {
    return (
      <div data-testid="booking-details-form">
        <button
          type="button"
          disabled={submitting}
          onClick={() =>
            onConfirm({
              service_id: 1,
              vehicle_reg: "AB12 CDE",
              notes: "Oil change",
              first_name: "John",
              surname: "Doe",
              phone: "07123456789",
            })
          }
        >
          Confirm Details
        </button>
      </div>
    );
  };
});

const getTodayISO = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

describe("BookingCalendar Component", () => {
  const dynamicToday = getTodayISO();
  const mockSlots = [
    {
      id: 101,
      date: dynamicToday,
      start_time: "09:00",
      end_time: "10:00",
      status: "available",
    },
    {
      id: 102,
      date: dynamicToday,
      start_time: "10:00",
      end_time: "11:00",
      status: "booked",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    bookingCalendar.mockResolvedValue({
      status: "success",
      slots: mockSlots,
    });
  });

  test("renders loading state initially and populates available slots", async () => {
    render(<BookingCalendar />);

    expect(screen.getByText(/loading schedule\.\.\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText(/loading schedule\.\.\./i),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText("Available Appointments")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "09:00 - 10:00" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Booked")).toBeInTheDocument();
  });

  test("handles empty slot schedules appropriately", async () => {
    bookingCalendar.mockResolvedValueOnce({
      status: "success",
      slots: [],
    });

    render(<BookingCalendar />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /no available working hours scheduled for this period\./i,
        ),
      ).toBeInTheDocument();
    });
  });

  test("handles API error message when fetching slots", async () => {
    bookingCalendar.mockResolvedValueOnce({
      status: "error",
      message: "Failed to load schedule from server.",
    });

    render(<BookingCalendar />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load schedule from server."),
      ).toBeInTheDocument();
    });
  });

  test("allows selecting and deselecting an available slot", async () => {
    render(<BookingCalendar />);

    const slotBtn = await screen.findByRole("button", {
      name: "09:00 - 10:00",
    });

    fireEvent.click(slotBtn);

    expect(screen.getByText(/selected \(1 slot\/s\):/i)).toBeInTheDocument();
    expect(screen.getByTestId("booking-details-form")).toBeInTheDocument();

    fireEvent.click(slotBtn);

    expect(
      screen.queryByText(/selected \(1 slot\/s\):/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("booking-details-form"),
    ).not.toBeInTheDocument();
  });

  test("submits booking details successfully and refreshes the calendar", async () => {
    selectedAppointmentSlot.mockResolvedValueOnce({ status: "success" });

    render(<BookingCalendar />);

    const slotBtn = await screen.findByRole("button", {
      name: "09:00 - 10:00",
    });

    fireEvent.click(slotBtn);

    const dummyForm = await screen.findByTestId("booking-details-form");
    expect(dummyForm).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Confirm Details" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(selectedAppointmentSlot).toHaveBeenCalledWith({
        slot_ids: [101],
        service_id: 1,
        vehicle_reg: "AB12 CDE",
        notes: "Oil change",
        first_name: "John",
        surname: "Doe",
        phone: "07123456789",
      });
    });
  });
});
