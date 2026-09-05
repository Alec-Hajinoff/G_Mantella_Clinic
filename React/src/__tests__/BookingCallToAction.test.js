import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import BookingCallToAction from "../BookingCallToAction";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const renderComponent = (props = {}) => {
  const defaultProps = {
    isAuthenticated: false,
    userRole: null,
    isLoading: false,
    ...props,
  };

  return render(
    <BrowserRouter>
      <BookingCallToAction {...defaultProps} />
    </BrowserRouter>,
  );
};

describe("BookingCallToAction Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders static component content correctly", () => {
    renderComponent();

    expect(
      screen.getByRole("heading", { name: /need a garage appointment\?/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /book your slot online for mot, servicing, or repairs at loveday auto\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /book an appointment/i }),
    ).toBeInTheDocument();
  });

  test("disables button and shows loading state when isLoading is true", () => {
    renderComponent({ isLoading: true });

    const button = screen.getByRole("button", {
      name: /checking session\.\.\./i,
    });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.queryByText(/sign in required/i)).not.toBeInTheDocument();
  });

  test("navigates to /UserDashboard when authenticated customer clicks book", () => {
    renderComponent({ isAuthenticated: true, userRole: "customer" });

    const button = screen.getByRole("button", { name: /book an appointment/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith("/UserDashboard");
  });

  test("navigates to /AdminDashboard when authenticated non-customer clicks book", () => {
    renderComponent({ isAuthenticated: true, userRole: "admin" });

    const button = screen.getByRole("button", { name: /book an appointment/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith("/AdminDashboard");
  });

  test("opens authentication modal when unauthenticated user clicks book", () => {
    renderComponent({ isAuthenticated: false });

    expect(screen.queryByText(/sign in required/i)).not.toBeInTheDocument();

    const button = screen.getByRole("button", { name: /book an appointment/i });
    fireEvent.click(button);

    expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/UserLogin",
    );
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/UserRegistration",
    );
  });

  test("closes modal when clicking the close button or backdrop", () => {
    renderComponent({ isAuthenticated: false });

    fireEvent.click(
      screen.getByRole("button", { name: /book an appointment/i }),
    );
    expect(screen.getByText(/sign in required/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/sign in required/i)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /book an appointment/i }),
    );
    const backdrop = screen
      .getByText(/sign in required/i)
      .closest(".booking-cta-modal-backdrop");
    fireEvent.click(backdrop);

    expect(screen.queryByText(/sign in required/i)).not.toBeInTheDocument();
  });
});
