import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminBookingCalendar from "../AdminBookingCalendar";
import { adminBookingCalendar } from "../ApiService";

jest.mock("../ApiService", () => ({
  adminBookingCalendar: jest.fn(),
}));

jest.mock("../BlockUnblockActionBar", () => {
  return function MockBlockUnblockActionBar({ selectedSlots }) {
    return (
      <div data-testid="action-bar">
        Selected Slots Count: {selectedSlots.length}
      </div>
    );
  };
});

describe("AdminBookingCalendar Component", () => {
  const mockSlots = [
    {
      id: 1,
      date: new Date().toISOString().split("T")[0],
      start_time: "09:00",
      end_time: "10:00",
      status: "available",
    },
    {
      id: 2,
      date: new Date().toISOString().split("T")[0],
      start_time: "10:00",
      end_time: "11:00",
      status: "booked",
    },
    {
      id: 3,
      date: new Date().toISOString().split("T")[0],
      start_time: "11:00",
      end_time: "12:00",
      status: "blocked",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders heading, navigation, and loading state initially", async () => {
    adminBookingCalendar.mockResolvedValueOnce({
      status: "success",
      slots: mockSlots,
    });

    render(<AdminBookingCalendar />);

    expect(
      screen.getByRole("heading", { name: /garage schedule overview/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/loading schedule.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText(/loading schedule.../i),
      ).not.toBeInTheDocument();
    });
  });

  it("fetches and renders calendar slots correctly", async () => {
    adminBookingCalendar.mockResolvedValueOnce({
      status: "success",
      slots: mockSlots,
    });

    render(<AdminBookingCalendar />);

    expect(await screen.findByText("09:00 - 10:00")).toBeInTheDocument();
    expect(screen.getByText("Booked")).toBeInTheDocument();
    expect(screen.getByText("11:00 - 12:00 (Blocked)")).toBeInTheDocument();
  });

  it("displays an error message when API call fails", async () => {
    adminBookingCalendar.mockRejectedValueOnce(
      new Error("Network connection error"),
    );

    render(<AdminBookingCalendar />);

    await waitFor(() => {
      expect(screen.getByText("Network connection error")).toBeInTheDocument();
    });
  });

  it("allows selecting and deselecting available and blocked slots", async () => {
    adminBookingCalendar.mockResolvedValueOnce({
      status: "success",
      slots: mockSlots,
    });

    render(<AdminBookingCalendar />);

    const availableBtn = await screen.findByText("09:00 - 10:00");
    const actionBar = screen.getByTestId("action-bar");

    expect(actionBar).toHaveTextContent("Selected Slots Count: 0");

    fireEvent.click(availableBtn);
    expect(actionBar).toHaveTextContent("Selected Slots Count: 1");

    fireEvent.click(availableBtn);
    expect(actionBar).toHaveTextContent("Selected Slots Count: 0");
  });

  it("does not allow selecting booked slots", async () => {
    adminBookingCalendar.mockResolvedValueOnce({
      status: "success",
      slots: mockSlots,
    });

    render(<AdminBookingCalendar />);

    const bookedSpan = await screen.findByText("Booked");
    fireEvent.click(bookedSpan);

    const actionBar = screen.getByTestId("action-bar");
    expect(actionBar).toHaveTextContent("Selected Slots Count: 0");
  });

  it("refreshes slots when custom window event 'bookingUpdated' is dispatched", async () => {
    adminBookingCalendar.mockResolvedValue({
      status: "success",
      slots: mockSlots,
    });

    render(<AdminBookingCalendar />);

    await waitFor(() => {
      expect(adminBookingCalendar).toHaveBeenCalledTimes(1);
    });

    fireEvent(window, new CustomEvent("bookingUpdated"));

    await waitFor(() => {
      expect(adminBookingCalendar).toHaveBeenCalledTimes(2);
    });
  });
});
