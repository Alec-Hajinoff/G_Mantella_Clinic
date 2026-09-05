import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BusinessHoursManager from "../BusinessHoursManager";
import { businessHoursManager } from "../ApiService";

jest.mock("../ApiService", () => ({
  businessHoursManager: jest.fn(),
}));

describe("BusinessHoursManager Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all 7 days of the week with unchecked inputs by default", () => {
    render(<BusinessHoursManager />);

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    days.forEach((day) => {
      const checkbox = screen.getByLabelText(day);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    const submitBtn = screen.getByRole("button", { name: /save hours/i });
    expect(submitBtn).toBeInTheDocument();
  });

  test("shows error message when submitting with no days selected", () => {
    render(<BusinessHoursManager />);

    fireEvent.click(screen.getByRole("button", { name: /save hours/i }));

    expect(
      screen.getByText("Please select at least one day."),
    ).toBeInTheDocument();
    expect(businessHoursManager).not.toHaveBeenCalled();
  });

  test("disables time inputs until a day is checked", () => {
    render(<BusinessHoursManager />);

    const mondayCheckbox = screen.getByLabelText("Monday");
    const mondayRow = mondayCheckbox.closest(".day-row");
    const timeInputs = mondayRow.querySelectorAll('input[type="time"]');

    expect(timeInputs[0]).toBeDisabled();
    expect(timeInputs[1]).toBeDisabled();

    fireEvent.click(mondayCheckbox);

    expect(timeInputs[0]).not.toBeDisabled();
    expect(timeInputs[1]).not.toBeDisabled();
  });

  test("shows error message when a selected day is missing open or close time", () => {
    render(<BusinessHoursManager />);

    const mondayCheckbox = screen.getByLabelText("Monday");
    fireEvent.click(mondayCheckbox);

    const mondayRow = mondayCheckbox.closest(".day-row");
    const [openInput] = mondayRow.querySelectorAll('input[type="time"]');

    fireEvent.change(openInput, { target: { value: "08:00" } });

    fireEvent.click(screen.getByRole("button", { name: /save hours/i }));

    expect(
      screen.getByText(
        "Please enter both opening and closing times for all selected days.",
      ),
    ).toBeInTheDocument();
    expect(businessHoursManager).not.toHaveBeenCalled();
  });

  test("submits selected days and dispatches 'bookingUpdated' event on success", async () => {
    businessHoursManager.mockResolvedValueOnce({ status: "success" });
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");

    render(<BusinessHoursManager />);

    const mondayCheckbox = screen.getByLabelText("Monday");
    fireEvent.click(mondayCheckbox);
    const mondayRow = mondayCheckbox.closest(".day-row");
    const [monOpen, monClose] =
      mondayRow.querySelectorAll('input[type="time"]');
    fireEvent.change(monOpen, { target: { value: "08:00" } });
    fireEvent.change(monClose, { target: { value: "17:00" } });

    fireEvent.click(screen.getByRole("button", { name: /save hours/i }));

    expect(businessHoursManager).toHaveBeenCalledWith([
      { day_of_week: 1, open_time: "08:00", close_time: "17:00" },
    ]);

    await waitFor(() => {
      expect(
        screen.getByText("Business hours saved successfully."),
      ).toBeInTheDocument();
    });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "bookingUpdated" }),
    );

    dispatchEventSpy.mockRestore();
  });

  test("handles API error responses and catch block errors gracefully", async () => {
    businessHoursManager.mockResolvedValueOnce({
      status: "error",
      message: "Server database failure",
    });

    const { rerender } = render(<BusinessHoursManager />);

    const mondayCheckbox = screen.getByLabelText("Monday");
    fireEvent.click(mondayCheckbox);
    const mondayRow = mondayCheckbox.closest(".day-row");
    const [monOpen, monClose] =
      mondayRow.querySelectorAll('input[type="time"]');
    fireEvent.change(monOpen, { target: { value: "09:00" } });
    fireEvent.change(monClose, { target: { value: "17:00" } });

    fireEvent.click(screen.getByRole("button", { name: /save hours/i }));

    await waitFor(() => {
      expect(screen.getByText("Server database failure")).toBeInTheDocument();
    });

    businessHoursManager.mockRejectedValueOnce(new Error("Network Error"));

    fireEvent.click(screen.getByRole("button", { name: /save hours/i }));

    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });
  });
});
