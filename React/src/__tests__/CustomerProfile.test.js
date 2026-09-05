import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CustomerProfile from "../CustomerProfile";
import { customerProfileGet, customerProfilePost } from "../ApiService";

jest.mock("../ApiService", () => ({
  customerProfileGet: jest.fn(),
  customerProfilePost: jest.fn(),
}));

describe("CustomerProfile Component", () => {
  const mockUserData = {
    first_name: "Jane",
    surname: "Doe",
    phone: "07123456789",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("displays loading indicator initially", () => {
    customerProfileGet.mockImplementationOnce(() => new Promise(() => {}));

    render(<CustomerProfile />);

    expect(screen.getByText(/loading profile\.\.\./i)).toBeInTheDocument();
  });

  test("fetches and displays profile data in view mode (disabled inputs)", async () => {
    customerProfileGet.mockResolvedValueOnce({
      status: "success",
      user: mockUserData,
    });

    render(<CustomerProfile />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 4, name: /personal details/i }),
      ).toBeInTheDocument();
    });

    const firstNameInput = screen.getByLabelText(/first name/i);
    const surnameInput = screen.getByLabelText(/surname/i);
    const phoneInput = screen.getByLabelText(/phone number/i);

    expect(firstNameInput).toHaveValue("Jane");
    expect(surnameInput).toHaveValue("Doe");
    expect(phoneInput).toHaveValue("07123456789");

    expect(firstNameInput).toBeDisabled();
    expect(surnameInput).toBeDisabled();
    expect(phoneInput).toBeDisabled();

    expect(
      screen.getByRole("button", { name: /edit details/i }),
    ).toBeInTheDocument();
  });

  test("displays error message if initial profile fetch fails", async () => {
    customerProfileGet.mockResolvedValueOnce({
      status: "error",
      message: "Session expired",
    });

    render(<CustomerProfile />);

    await waitFor(() => {
      expect(screen.getByText("Session expired")).toBeInTheDocument();
    });
  });

  test("displays fallback error message if initial profile fetch fails without message", async () => {
    customerProfileGet.mockResolvedValueOnce({ status: "error" });

    render(<CustomerProfile />);

    await waitFor(() => {
      expect(screen.getByText("Could not load profile.")).toBeInTheDocument();
    });
  });

  test("displays error message if fetch promise rejects", async () => {
    customerProfileGet.mockRejectedValueOnce(new Error("Network Error"));

    render(<CustomerProfile />);

    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });
  });

  test("enables inputs when 'Edit Details' is clicked", async () => {
    customerProfileGet.mockResolvedValueOnce({
      status: "success",
      user: mockUserData,
    });

    render(<CustomerProfile />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /edit details/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /edit details/i }));

    expect(screen.getByLabelText(/first name/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/surname/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/phone number/i)).not.toBeDisabled();

    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  test("resets changes when 'Cancel' is clicked", async () => {
    customerProfileGet.mockResolvedValueOnce({
      status: "success",
      user: mockUserData,
    });

    render(<CustomerProfile />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /edit details/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /edit details/i }));

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: "Johnny" } });
    expect(firstNameInput).toHaveValue("Johnny");

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByLabelText(/first name/i)).toHaveValue("Jane");
    expect(screen.getByLabelText(/first name/i)).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /edit details/i }),
    ).toBeInTheDocument();
  });

  test("submits updated profile data successfully", async () => {
    customerProfileGet.mockResolvedValueOnce({
      status: "success",
      user: mockUserData,
    });

    const updatedUser = {
      first_name: "John",
      surname: "Smith",
      phone: "07987654321",
    };

    customerProfilePost.mockResolvedValueOnce({
      status: "success",
      user: updatedUser,
    });

    render(<CustomerProfile />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /edit details/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /edit details/i }));

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/surname/i), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "07987654321" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(customerProfilePost).toHaveBeenCalledWith({
      first_name: "John",
      surname: "Smith",
      phone: "07987654321",
    });

    await waitFor(() => {
      expect(
        screen.getByText("Profile updated successfully!"),
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/first name/i)).toHaveValue("John");
    expect(screen.getByLabelText(/first name/i)).toBeDisabled();
  });

  test("shows error message when post request fails with custom error", async () => {
    customerProfileGet.mockResolvedValueOnce({
      status: "success",
      user: mockUserData,
    });

    customerProfilePost.mockResolvedValueOnce({
      status: "error",
      message: "Invalid phone number.",
    });

    render(<CustomerProfile />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /edit details/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /edit details/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid phone number.")).toBeInTheDocument();
    });
  });

  test("disables action buttons and displays loading text while submitting", async () => {
    customerProfileGet.mockResolvedValueOnce({
      status: "success",
      user: mockUserData,
    });

    let resolvePost;
    customerProfilePost.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );

    render(<CustomerProfile />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /edit details/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /edit details/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    const saveBtn = screen.getByRole("button", { name: /saving\.\.\./i });
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });

    expect(saveBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();

    resolvePost({ status: "success", user: mockUserData });

    await waitFor(() => {
      expect(
        screen.getByText("Profile updated successfully!"),
      ).toBeInTheDocument();
    });
  });
});
