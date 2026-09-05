import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, useLocation } from "react-router-dom";
import PasswordReset from "../PasswordReset";
import { passwordResetToken, updatePassword } from "../ApiService";

jest.mock("../ApiService");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe("PasswordReset Component", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  test("displays loading spinner during token verification", () => {
    useLocation.mockReturnValue({ search: "?token=valid-token" });
    passwordResetToken.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <PasswordReset />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/we are verifying your password reset link/i),
    ).toBeInTheDocument();
  });

  test("shows invalid token message when no token is present in URL", async () => {
    useLocation.mockReturnValue({ search: "" });

    render(
      <MemoryRouter>
        <PasswordReset />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/this password reset link is no longer valid/i),
      ).toBeInTheDocument();
    });
  });

  test("shows invalid token message when API reports token is invalid", async () => {
    useLocation.mockReturnValue({ search: "?token=invalid-token" });
    passwordResetToken.mockResolvedValueOnce({
      valid: false,
      message: "Token has expired.",
    });

    render(
      <MemoryRouter>
        <PasswordReset />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Token has expired.")).toBeInTheDocument();
    });
  });

  test("renders password form when token verification succeeds", async () => {
    useLocation.mockReturnValue({ search: "?token=valid-token" });
    passwordResetToken.mockResolvedValueOnce({ valid: true });

    render(
      <MemoryRouter>
        <PasswordReset />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("New password")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Confirm password"),
      ).toBeInTheDocument();
    });
  });

  test("shows error when password is less than 8 characters", async () => {
    useLocation.mockReturnValue({ search: "?token=valid-token" });
    passwordResetToken.mockResolvedValueOnce({ valid: true });

    render(
      <MemoryRouter>
        <PasswordReset />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("New password")).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText("New password"), "short");
    await userEvent.type(
      screen.getByPlaceholderText("Confirm password"),
      "short",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /update password/i }),
    );

    expect(screen.getByText(/at least 8 characters long/i)).toBeInTheDocument();
  });

  test("shows error when passwords do not match", async () => {
    useLocation.mockReturnValue({ search: "?token=valid-token" });
    passwordResetToken.mockResolvedValueOnce({ valid: true });

    render(
      <MemoryRouter>
        <PasswordReset />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("New password")).toBeInTheDocument();
    });

    await userEvent.type(
      screen.getByPlaceholderText("New password"),
      "password123",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm password"),
      "mismatch123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /update password/i }),
    );

    expect(
      screen.getByText(/the passwords you entered do not match/i),
    ).toBeInTheDocument();
  });

  test("updates password successfully and hides submit button", async () => {
    useLocation.mockReturnValue({ search: "?token=valid-token" });
    passwordResetToken.mockResolvedValueOnce({ valid: true });
    updatePassword.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <PasswordReset />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("New password")).toBeInTheDocument();
    });

    await userEvent.type(
      screen.getByPlaceholderText("New password"),
      "newSecret123",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm password"),
      "newSecret123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /update password/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/your password has been updated successfully/i),
      ).toBeInTheDocument();
    });

    expect(updatePassword).toHaveBeenCalledWith("valid-token", "newSecret123");
    expect(
      screen.queryByRole("button", { name: /update password/i }),
    ).not.toBeInTheDocument();
  });

  test("navigates home when 'Return to home page' button is clicked", async () => {
    useLocation.mockReturnValue({ search: "" });

    render(
      <MemoryRouter>
        <PasswordReset />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /return to home page/i }),
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /return to home page/i }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
