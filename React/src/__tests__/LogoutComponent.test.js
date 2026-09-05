import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LogoutComponent from "../LogoutComponent";
import { logoutUser } from "../ApiService";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../ApiService", () => ({
  logoutUser: jest.fn(),
}));

describe("LogoutComponent Component", () => {
  const mockOnLogoutComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders logout button", () => {
    render(<LogoutComponent onLogoutComplete={mockOnLogoutComplete} />);

    const logoutButton = screen.getByRole("button", { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveClass("btn-text");
  });

  test("calls logoutUser, navigates home, and executes callback on click", async () => {
    logoutUser.mockResolvedValueOnce({});

    render(<LogoutComponent onLogoutComplete={mockOnLogoutComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    expect(logoutUser).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
      expect(mockOnLogoutComplete).toHaveBeenCalledTimes(1);
    });
  });

  test("handles logout safely when onLogoutComplete callback is omitted", async () => {
    logoutUser.mockResolvedValueOnce({});

    render(<LogoutComponent />);

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("catches and logs error when logoutUser rejects", async () => {
    const errorMsg = "Logout request failed";
    logoutUser.mockRejectedValueOnce(new Error(errorMsg));

    render(<LogoutComponent onLogoutComplete={mockOnLogoutComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(errorMsg);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockOnLogoutComplete).not.toHaveBeenCalled();
  });
});
