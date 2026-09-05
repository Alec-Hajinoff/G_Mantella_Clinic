import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BookingDetailsForm from "../BookingDetailsForm";
import { bookingDetailsForm } from "../ApiService";

jest.mock("../ApiService", () => ({
  bookingDetailsForm: jest.fn(),
}));

const mockServices = [
  { id: 1, name: "Full Service", duration_minutes: 120 },
  { id: 2, name: "MOT Inspection", duration_minutes: 45 },
];

const mockUser = {
  first_name: "Jane",
  surname: "Smith",
  phone: "07987654321",
};

describe("BookingDetailsForm Component", () => {
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    bookingDetailsForm.mockResolvedValue({
      status: "success",
      services: mockServices,
      user: mockUser,
    });
  });

  test("fetches initial form data and pre-populates user details", async () => {
    render(<BookingDetailsForm onConfirm={mockOnConfirm} submitting={false} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("John")).toHaveValue("Jane");
    });

    expect(screen.getByPlaceholderText("Doe")).toHaveValue("Smith");
    expect(screen.getByPlaceholderText("e.g. 07123456789")).toHaveValue(
      "07987654321",
    );

    expect(
      screen.getByRole("option", { name: "Full Service (120 mins)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "MOT Inspection (45 mins)" }),
    ).toBeInTheDocument();
  });

  test("shows estimated duration when a service is selected", async () => {
    render(<BookingDetailsForm onConfirm={mockOnConfirm} submitting={false} />);

    await screen.findByRole("option", { name: "Full Service (120 mins)" });

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });

    expect(
      screen.getByText("Estimated duration: 120 minutes"),
    ).toBeInTheDocument();
  });

  test("shows error when both service and notes are omitted", async () => {
    bookingDetailsForm.mockResolvedValueOnce({
      status: "success",
      services: mockServices,
      user: null,
    });

    render(<BookingDetailsForm onConfirm={mockOnConfirm} submitting={false} />);

    await waitFor(() => expect(bookingDetailsForm).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("e.g. AB12 CDE"), {
      target: { value: "AB12 CDE" },
    });
    fireEvent.change(screen.getByPlaceholderText("John"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText("Doe"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. 07123456789"), {
      target: { value: "07123456789" },
    });

    fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));

    expect(
      screen.getByText(
        "Please either select a garage service or provide details in the notes section.",
      ),
    ).toBeInTheDocument();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  test("submits successfully with selected service", async () => {
    render(<BookingDetailsForm onConfirm={mockOnConfirm} submitting={false} />);

    await screen.findByRole("option", { name: "Full Service (120 mins)" });

    fireEvent.change(screen.getByPlaceholderText("e.g. AB12 CDE"), {
      target: { value: " XY55 ZZZ " },
    });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });

    fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));

    expect(mockOnConfirm).toHaveBeenCalledWith({
      service_id: 2,
      vehicle_reg: "XY55 ZZZ",
      notes: null,
      first_name: "Jane",
      surname: "Smith",
      phone: "07987654321",
    });
  });

  test("submits successfully without service if notes are provided", async () => {
    render(<BookingDetailsForm onConfirm={mockOnConfirm} submitting={false} />);

    await waitFor(() => expect(bookingDetailsForm).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("e.g. AB12 CDE"), {
      target: { value: "AB12 CDE" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Describe your issue or custom request..."),
      { target: { value: "Brake noise check" } },
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));

    expect(mockOnConfirm).toHaveBeenCalledWith({
      service_id: null,
      vehicle_reg: "AB12 CDE",
      notes: "Brake noise check",
      first_name: "Jane",
      surname: "Smith",
      phone: "07987654321",
    });
  });

  test("disables submit button and updates text when submitting prop is true", async () => {
    render(<BookingDetailsForm onConfirm={mockOnConfirm} submitting={true} />);

    const submitBtn = screen.getByRole("button", { name: /booking\.\.\./i });
    expect(submitBtn).toBeDisabled();
  });
});
