import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CustomerDeleteAccount from "../CustomerDeleteAccount";
import { customerDeleteAccount } from "../ApiService";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../ApiService", () => ({
  customerDeleteAccount: jest.fn(),
}));

describe("CustomerDeleteAccount Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders initial header, description, and delete button", () => {
    render(<CustomerDeleteAccount />);

    expect(
      screen.getByRole("heading", { level: 5, name: /delete account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /deleting your account will remove your personal information/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete my account/i }),
    ).toBeInTheDocument();
  });

  test("shows confirmation message and buttons when initial delete button is clicked", () => {
    render(<CustomerDeleteAccount />);

    fireEvent.click(screen.getByRole("button", { name: /delete my account/i }));

    expect(
      screen.getByText(
        /are you sure you want to permanently delete your account\?/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /yes, delete account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^cancel$/i }),
    ).toBeInTheDocument();
  });

  test("hides confirmation prompt when 'Cancel' abort button is clicked", () => {
    render(<CustomerDeleteAccount />);

    fireEvent.click(screen.getByRole("button", { name: /delete my account/i }));
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(
      screen.getByRole("button", { name: /delete my account/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        /are you sure you want to permanently delete your account\?/i,
      ),
    ).not.toBeInTheDocument();
  });

  test("navigates to '/' when account deletion succeeds", async () => {
    customerDeleteAccount.mockResolvedValueOnce({ status: "success" });

    render(<CustomerDeleteAccount />);

    fireEvent.click(screen.getByRole("button", { name: /delete my account/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /yes, delete account/i }),
    );

    expect(customerDeleteAccount).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("shows alert with custom message when API returns failure status", async () => {
    const errorMessage = "Cannot delete account with active bookings.";
    customerDeleteAccount.mockResolvedValueOnce({
      status: "error",
      message: errorMessage,
    });

    render(<CustomerDeleteAccount />);

    fireEvent.click(screen.getByRole("button", { name: /delete my account/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /yes, delete account/i }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(errorMessage);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows fallback alert message when API returns failure status without a message", async () => {
    customerDeleteAccount.mockResolvedValueOnce({ status: "error" });

    render(<CustomerDeleteAccount />);

    fireEvent.click(screen.getByRole("button", { name: /delete my account/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /yes, delete account/i }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Could not delete account.");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows alert when API promise rejects", async () => {
    const networkError = new Error("Server error");
    customerDeleteAccount.mockRejectedValueOnce(networkError);

    render(<CustomerDeleteAccount />);

    fireEvent.click(screen.getByRole("button", { name: /delete my account/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /yes, delete account/i }),
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Server error");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("disables action buttons and shows loading text during execution", async () => {
    let resolveApi;
    customerDeleteAccount.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveApi = resolve;
        }),
    );

    render(<CustomerDeleteAccount />);

    fireEvent.click(screen.getByRole("button", { name: /delete my account/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /yes, delete account/i }),
    );

    const confirmBtn = screen.getByRole("button", { name: /deleting\.\.\./i });
    const abortBtn = screen.getByRole("button", { name: /^cancel$/i });

    expect(confirmBtn).toBeDisabled();
    expect(abortBtn).toBeDisabled();

    resolveApi({ status: "success" });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
