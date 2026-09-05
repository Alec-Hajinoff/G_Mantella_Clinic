import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserRegistration from "../UserRegistration";
import { registerUser } from "../ApiService";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../ApiService", () => ({
  registerUser: jest.fn(),
}));

describe("UserRegistration Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders input fields and register button", () => {
    render(<UserRegistration />);

    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Choose a strong password/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register/i }),
    ).toBeInTheDocument();
  });

  test("shows validation error on invalid email submission", () => {
    render(<UserRegistration />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Choose a strong password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    expect(
      screen.getByText(/Please enter a valid email address/i),
    ).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  test("shows validation error on short password submission", () => {
    render(<UserRegistration />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Choose a strong password/i), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    expect(
      screen.getByText(/Please choose a password with at least 8 characters/i),
    ).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  test("displays success message and resets input fields on successful registration", async () => {
    registerUser.mockResolvedValueOnce({ success: true });

    render(<UserRegistration />);

    const emailInput = screen.getByPlaceholderText(/Email address/i);
    const passwordInput = screen.getByPlaceholderText(
      /Choose a strong password/i,
    );

    fireEvent.change(emailInput, {
      target: { value: "newuser@example.com" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
      });
      expect(
        screen.getByText(
          /You're almost there! Please check your email for a link to confirm your address/i,
        ),
      ).toBeInTheDocument();
      expect(emailInput.value).toBe("");
      expect(passwordInput.value).toBe("");
    });
  });

  test("displays API error message when registration fails", async () => {
    registerUser.mockResolvedValueOnce({
      success: false,
      message: "An account with this email already exists.",
    });

    render(<UserRegistration />);

    const emailInput = screen.getByPlaceholderText(/Email address/i);
    const passwordInput = screen.getByPlaceholderText(
      /Choose a strong password/i,
    );

    fireEvent.change(emailInput, {
      target: { value: "existinguser@example.com" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    await waitFor(() => {
      expect(
        screen.getByText("An account with this email already exists."),
      ).toBeInTheDocument();
      expect(emailInput.value).toBe("");
      expect(passwordInput.value).toBe("");
    });
  });

  test("displays fallback error message when API rejects network request", async () => {
    registerUser.mockRejectedValueOnce(new Error("Network connection error."));

    render(<UserRegistration />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Choose a strong password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Register/i }));

    await waitFor(() => {
      expect(screen.getByText("Network connection error.")).toBeInTheDocument();
    });
  });
});
