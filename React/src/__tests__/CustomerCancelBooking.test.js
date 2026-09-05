import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CustomerCancelBooking from "../CustomerCancelBooking";
import { customerCancelBooking } from "../ApiService";

jest.mock("../ApiService", () => ({
  customerCancelBooking: jest.fn(),
}));

describe("CustomerCancelBooking Component", () => {
  const mockAppointmentId = "123";
  const mockOnBookingCancelled = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders initial 'Cancel Booking' button", () => {
    render(
      <CustomerCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    expect(
      screen.getByRole("button", { name: /cancel booking/i }),
    ).toBeInTheDocument();
  });

  test("shows confirmation UI when initial cancel button is clicked", () => {
    render(
      <CustomerCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel booking/i }));

    expect(screen.getByText(/are you sure\?/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /yes, cancel/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^no$/i })).toBeInTheDocument();
  });

  test("hides confirmation prompt when 'No' is clicked", () => {
    render(
      <CustomerCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel booking/i }));
    fireEvent.click(screen.getByRole("button", { name: /^no$/i }));

    expect(
      screen.getByRole("button", { name: /cancel booking/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/are you sure\?/i)).not.toBeInTheDocument();
  });

  test("calls customerCancelBooking and triggers onBookingCancelled callback on successful cancellation", async () => {
    customerCancelBooking.mockResolvedValueOnce({ status: "success" });

    render(
      <CustomerCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel booking/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, cancel/i }));

    expect(customerCancelBooking).toHaveBeenCalledTimes(1);
    expect(customerCancelBooking).toHaveBeenCalledWith(mockAppointmentId);

    await waitFor(() => {
      expect(mockOnBookingCancelled).toHaveBeenCalledTimes(1);
    });
  });

  test("shows alert with custom message when API returns failure status", async () => {
    const errorMessage = "Appointment cannot be cancelled within 24 hours.";
    customerCancelBooking.mockResolvedValueOnce({
      status: "error",
      message: errorMessage,
    });

    render(
      <CustomerCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel booking/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, cancel/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(errorMessage);
    });
    expect(mockOnBookingCancelled).not.toHaveBeenCalled();
  });

  test("shows fallback alert message when API returns failure status without a message", async () => {
    customerCancelBooking.mockResolvedValueOnce({ status: "error" });

    render(
      <CustomerCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel booking/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, cancel/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to cancel booking.");
    });
  });

  test("shows alert when API promise rejects", async () => {
    const networkError = new Error("Network Error");
    customerCancelBooking.mockRejectedValueOnce(networkError);

    render(
      <CustomerCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel booking/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, cancel/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Network Error");
    });
    expect(mockOnBookingCancelled).not.toHaveBeenCalled();
  });

  test("disables buttons and displays loading text while cancellation is in flight", async () => {
    let resolveApi;
    customerCancelBooking.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveApi = resolve;
        }),
    );

    render(
      <CustomerCancelBooking
        appointmentId={mockAppointmentId}
        onBookingCancelled={mockOnBookingCancelled}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel booking/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes, cancel/i }));

    const confirmBtn = screen.getByRole("button", {
      name: /cancelling\.\.\./i,
    });
    const abortBtn = screen.getByRole("button", { name: /^no$/i });

    expect(confirmBtn).toBeDisabled();
    expect(abortBtn).toBeDisabled();

    resolveApi({ status: "success" });

    await waitFor(() => {
      expect(mockOnBookingCancelled).toHaveBeenCalled();
    });
  });
});
