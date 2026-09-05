import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AvailabilityHorizonExtender from "../AvailabilityHorizonExtender";
import { availabilityHorizonExtender } from "../ApiService";

jest.mock("../ApiService");

describe("AvailabilityHorizonExtender Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders component correctly with initial state", () => {
    render(<AvailabilityHorizonExtender />);

    expect(
      screen.getByRole("heading", { name: /extend appointment horizon/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /generate 3 additional months of slots/i,
      }),
    ).toBeInTheDocument();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("handles successful slot generation and dispatches custom event", async () => {
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
    const mockSuccessResponse = {
      status: "success",
      message: "Extended availability slots by 3 additional months.",
    };

    availabilityHorizonExtender.mockResolvedValueOnce(mockSuccessResponse);

    render(<AvailabilityHorizonExtender />);

    const button = screen.getByRole("button", {
      name: /generate 3 additional months of slots/i,
    });

    fireEvent.click(button);

    expect(
      screen.getByRole("button", { name: /generating slots\.\.\./i }),
    ).toBeDisabled();

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass("alert-success");
      expect(alert).toHaveTextContent(mockSuccessResponse.message);
    });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "bookingUpdated" }),
    );

    expect(
      screen.getByRole("button", {
        name: /generate 3 additional months of slots/i,
      }),
    ).not.toBeDisabled();

    dispatchEventSpy.mockRestore();
  });

  test("handles fallback success message when API response message is missing", async () => {
    availabilityHorizonExtender.mockResolvedValueOnce({ status: "success" });

    render(<AvailabilityHorizonExtender />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /generate 3 additional months of slots/i,
      }),
    );

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("alert-success");
      expect(alert).toHaveTextContent(
        "Extended availability slots by 3 additional months.",
      );
    });
  });

  test("handles failure status response from API", async () => {
    const mockErrorResponse = {
      status: "error",
      message: "Unable to extend slots at this time.",
    };

    availabilityHorizonExtender.mockResolvedValueOnce(mockErrorResponse);

    render(<AvailabilityHorizonExtender />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /generate 3 additional months of slots/i,
      }),
    );

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass("alert-danger");
      expect(alert).toHaveTextContent(mockErrorResponse.message);
    });
  });

  test("handles rejected API promise", async () => {
    const errorMessage = "Network Error";
    availabilityHorizonExtender.mockRejectedValueOnce(new Error(errorMessage));

    render(<AvailabilityHorizonExtender />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /generate 3 additional months of slots/i,
      }),
    );

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass("alert-danger");
      expect(alert).toHaveTextContent(errorMessage);
    });
  });
});
