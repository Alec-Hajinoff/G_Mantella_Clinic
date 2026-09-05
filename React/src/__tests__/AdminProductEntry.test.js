import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminProductEntry from "../AdminProductEntry";
import { adminProductEntry } from "../ApiService";

jest.mock("../ApiService", () => ({
  adminProductEntry: jest.fn(),
}));

describe("AdminProductEntry Component", () => {
  const mockOnProductAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form elements correctly", () => {
    render(<AdminProductEntry onProductAdded={mockOnProductAdded} />);

    expect(
      screen.getByRole("heading", { name: "Add New Products" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price \(£ GBP\) \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Image/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Product" }),
    ).toBeInTheDocument();
  });

  it("updates form inputs on user typing", () => {
    render(<AdminProductEntry onProductAdded={mockOnProductAdded} />);

    const nameInput = screen.getByLabelText(/Product Name \*/i);
    const descInput = screen.getByLabelText(/Description/i);
    const priceInput = screen.getByLabelText(/Price \(£ GBP\) \*/i);

    fireEvent.change(nameInput, { target: { value: "Engine Oil 5W-30" } });
    fireEvent.change(descInput, {
      target: { value: "Fully synthetic motor oil 5L" },
    });
    fireEvent.change(priceInput, { target: { value: "34.99" } });

    expect(nameInput.value).toBe("Engine Oil 5W-30");
    expect(descInput.value).toBe("Fully synthetic motor oil 5L");
    expect(priceInput.value).toBe("34.99");
  });

  it("submits form data with image file and triggers success flow", async () => {
    adminProductEntry.mockResolvedValueOnce({
      status: "success",
      message: "Product created successfully!",
    });

    render(<AdminProductEntry onProductAdded={mockOnProductAdded} />);

    fireEvent.change(screen.getByLabelText(/Product Name \*/i), {
      target: { value: "Brake Pads" },
    });
    fireEvent.change(screen.getByLabelText(/Price \(£ GBP\) \*/i), {
      target: { value: "45.00" },
    });

    const file = new File(["dummy content"], "brakepads.png", {
      type: "image/png",
    });
    const fileInput = screen.getByLabelText(/Product Image/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getByRole("button", { name: "Create Product" });
    fireEvent.click(submitBtn);

    expect(
      screen.getByRole("button", { name: "Processing..." }),
    ).toBeDisabled();

    await waitFor(() => {
      expect(adminProductEntry).toHaveBeenCalledTimes(1);
    });

    const sentFormData = adminProductEntry.mock.calls[0][0];
    expect(sentFormData.get("name")).toBe("Brake Pads");
    expect(sentFormData.get("price_gbp")).toBe("45.00");
    expect(sentFormData.get("image")).toBe(file);

    expect(
      await screen.findByText("Product created successfully!"),
    ).toBeInTheDocument();

    expect(mockOnProductAdded).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/Product Name \*/i).value).toBe("");
  });

  it("displays an error message when API call returns error status", async () => {
    adminProductEntry.mockResolvedValueOnce({
      status: "danger",
      message: "Invalid image file type.",
    });

    render(<AdminProductEntry onProductAdded={mockOnProductAdded} />);

    fireEvent.change(screen.getByLabelText(/Product Name \*/i), {
      target: { value: "Spark Plugs" },
    });
    fireEvent.change(screen.getByLabelText(/Price \(£ GBP\) \*/i), {
      target: { value: "12.50" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid image file type.")).toBeInTheDocument();
    });

    expect(mockOnProductAdded).not.toHaveBeenCalled();
  });

  it("displays fallback error when connection fails or throws exception", async () => {
    adminProductEntry.mockRejectedValueOnce(new Error("Server timeout"));

    render(<AdminProductEntry onProductAdded={mockOnProductAdded} />);

    fireEvent.change(screen.getByLabelText(/Product Name \*/i), {
      target: { value: "Air Filter" },
    });
    fireEvent.change(screen.getByLabelText(/Price \(£ GBP\) \*/i), {
      target: { value: "15.00" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    await waitFor(() => {
      expect(
        screen.getByText("An error occurred while connecting to the server."),
      ).toBeInTheDocument();
    });
  });
});
