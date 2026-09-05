import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserLogin from "../UserLogin";
import { loginUser, passwordResetLink } from "../ApiService";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../ApiService", () => ({
  loginUser: jest.fn(),
  passwordResetLink: jest.fn(),
}));

describe("UserLogin Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders form inputs, buttons, and links", () => {
    render(<UserLogin />);

    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Forgot your password\?/i }),
    ).toBeInTheDocument();
  });

  test("shows error message on client-side invalid email submission", async () => {
    render(<UserLogin />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    expect(
      screen.getByText(/Please enter a valid email address/i),
    ).toBeInTheDocument();
    expect(loginUser).not.toHaveBeenCalled();
  });

  test("shows error message on short password submission", async () => {
    render(<UserLogin />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    expect(
      screen.getByText(
        /Please ensure your password is at least 8 characters long/i,
      ),
    ).toBeInTheDocument();
    expect(loginUser).not.toHaveBeenCalled();
  });

  test("navigates to /UserDashboard on successful customer login", async () => {
    loginUser.mockResolvedValueOnce({ status: "success", role: "customer" });

    render(<UserLogin />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: "customer@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        email: "customer@example.com",
        password: "password123",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/UserDashboard");
    });
  });

  test("navigates to /AdminDashboard on successful admin login", async () => {
    loginUser.mockResolvedValueOnce({ status: "success", role: "admin" });

    render(<UserLogin />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/AdminDashboard");
    });
  });

  test("displays unverified message and clears password field on unverified response", async () => {
    loginUser.mockResolvedValueOnce({
      status: "unverified",
      message: "Please verify your email address.",
    });

    render(<UserLogin />);

    const passwordInput = screen.getByPlaceholderText(/Password/i);
    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: "unverified@example.com" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Please verify your email address."),
      ).toBeInTheDocument();
      expect(passwordInput.value).toBe("");
    });
  });

  test("displays error message on failed login attempt", async () => {
    loginUser.mockResolvedValueOnce({
      status: "error",
      message: "Invalid credentials.",
    });

    render(<UserLogin />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials.")).toBeInTheDocument();
    });
  });

  test("handles forgot password click with empty email field", () => {
    render(<UserLogin />);

    fireEvent.click(
      screen.getByRole("button", { name: /Forgot your password\?/i }),
    );

    expect(
      screen.getByText(
        /Please enter your email address so we can help you reset your password/i,
      ),
    ).toBeInTheDocument();
    expect(passwordResetLink).not.toHaveBeenCalled();
  });

  test("triggers password reset request successfully when email is provided", async () => {
    passwordResetLink.mockResolvedValueOnce({ status: "success" });

    render(<UserLogin />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Forgot your password\?/i }),
    );

    await waitFor(() => {
      expect(passwordResetLink).toHaveBeenCalledWith("user@example.com");
      expect(
        screen.getByText(
          /If an account exists for this email address, a password reset link has been sent./i,
        ),
      ).toBeInTheDocument();
    });
  });
});
