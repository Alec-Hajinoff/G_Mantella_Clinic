import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminCancelBooking from "../AdminCancelBooking";
import { adminCancelBooking } from "../ApiService";

jest.mock("../ApiService", () => ({
  adminCancelBooking: jest.fn(),
}));

describe("AdminCancelBooking Component", () => {
  const mockAppointmentId = 101;
  const mockOnBookingCancelled = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    window.alert.mockRestore();
  });

  it("renders the initial 'Cancel Booking' button", () => {
    render(
      <AdminCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Cancel Booking" }),
    ).toBeInTheDocument();
  });

  it("shows confirmation prompt when 'Cancel Booking' is clicked", () => {
    render(
      <AdminCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Booking" }));

    expect(
      screen.getByText("Cancel this customer booking?"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yes, Cancel" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
  });

  it("resets to initial state when 'No' is clicked", () => {
    render(
      <AdminCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Booking" }));

    fireEvent.click(screen.getByRole("button", { name: "No" }));

    expect(
      screen.getByRole("button", { name: "Cancel Booking" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Cancel this customer booking?"),
    ).not.toBeInTheDocument();
  });

  it("calls API, fires custom window event, and triggers callback on successful cancellation", async () => {
    adminCancelBooking.mockResolvedValueOnce({ status: "success" });
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");

    render(
      <AdminCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Booking" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, Cancel" }));

    expect(
      screen.getByRole("button", { name: "Cancelling..." }),
    ).toBeDisabled();

    await waitFor(() => {
      expect(adminCancelBooking).toHaveBeenCalledWith(mockAppointmentId);
    });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "bookingUpdated" }),
    );
    expect(mockOnBookingCancelled).toHaveBeenCalledTimes(1);

    dispatchEventSpy.mockRestore();
  });

  it("displays alert message when API returns failure status", async () => {
    adminCancelBooking.mockResolvedValueOnce({
      status: "error",
      message: "Booking cannot be cancelled within 2 hours of slot.",
    });

    render(
      <AdminCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Booking" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, Cancel" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Booking cannot be cancelled within 2 hours of slot.",
      );
    });

    expect(mockOnBookingCancelled).not.toHaveBeenCalled();
  });

  it("displays alert message when API request throws an exception", async () => {
    adminCancelBooking.mockRejectedValueOnce(
      new Error("Network connection lost"),
    );

    render(
      <AdminCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Booking" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, Cancel" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Network connection lost");
    });

    expect(mockOnBookingCancelled).not.toHaveBeenCalled();
  });
});
