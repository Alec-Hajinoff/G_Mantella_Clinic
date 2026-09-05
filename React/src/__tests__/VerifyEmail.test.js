import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import VerifyEmail from "../VerifyEmail";
import { verifyEmail } from "../ApiService";

const mockNavigate = jest.fn();
let mockSearch = "?token=valid-token";

const mockLocation = {
  get search() {
    return mockSearch;
  },
};

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

jest.mock("../ApiService", () => ({
  verifyEmail: jest.fn(),
}));

describe("VerifyEmail Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch = "?token=valid-token";
  });

  test("renders loading state initially while verifying token", () => {
    verifyEmail.mockImplementationOnce(() => new Promise(() => {}));

    render(<VerifyEmail />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.getByText(/Verifying your email address/i),
    ).toBeInTheDocument();
  });

  test("shows error when token is missing in URL search params", async () => {
    mockSearch = "";

    render(<VerifyEmail />);

    await waitFor(() => {
      expect(
        screen.getByText("No verification token provided."),
      ).toBeInTheDocument();
    });

    expect(verifyEmail).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /Go to home page/i }),
    ).toBeInTheDocument();
  });

  test("navigates to /RegisteredPage on successful token verification", async () => {
    verifyEmail.mockResolvedValueOnce({ success: true });

    render(<VerifyEmail />);

    await waitFor(() => {
      expect(verifyEmail).toHaveBeenCalledWith("valid-token");
      expect(mockNavigate).toHaveBeenCalledWith("/RegisteredPage");
    });
  });

  test("displays error message when API responds with verification failure", async () => {
    verifyEmail.mockResolvedValueOnce({
      success: false,
      message: "Token has expired or is invalid.",
    });

    render(<VerifyEmail />);

    await waitFor(() => {
      expect(
        screen.getByText("Token has expired or is invalid."),
      ).toBeInTheDocument();
    });
  });

  test("displays error message when verification request encounters a network exception", async () => {
    verifyEmail.mockRejectedValueOnce(new Error("Network response error."));

    render(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByText("Network response error.")).toBeInTheDocument();
    });
  });

  test("navigates home when 'Go to home page' button is clicked on error state", async () => {
    mockSearch = "";

    render(<VerifyEmail />);

    const homeButton = await screen.findByRole("button", {
      name: /Go to home page/i,
    });
    fireEvent.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
