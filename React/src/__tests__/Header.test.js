import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "../Header";

jest.mock("../LogoutComponent", () => {
  return function DummyLogout({ onLogoutComplete }) {
    return <button onClick={onLogoutComplete}>Logout Component</button>;
  };
});

jest.mock("../BasketWidget", () => {
  return function DummyBasket() {
    return <div>Basket Widget</div>;
  };
});

describe("Header Component", () => {
  const mockOnLogoutComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders logo image with correct attributes linking to home", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header
          isAuthenticated={false}
          isLoading={false}
          onLogoutComplete={mockOnLogoutComplete}
        />
      </MemoryRouter>,
    );

    const logo = screen.getByRole("img", {
      name: /loveday auto repairs logo/i,
    });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("title", "Loveday Auto Repairs");

    const logoLink = logo.closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  test("always renders BasketWidget regardless of authentication status", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header
          isAuthenticated={false}
          isLoading={false}
          onLogoutComplete={mockOnLogoutComplete}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Basket Widget")).toBeInTheDocument();
  });

  test("does not render login/logout controls while loading", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header
          isAuthenticated={false}
          isLoading={true}
          onLogoutComplete={mockOnLogoutComplete}
        />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", { name: /log in/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /sign up/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Logout Component")).not.toBeInTheDocument();
    expect(screen.getByText("Basket Widget")).toBeInTheDocument();
  });

  test("renders 'Log in' and 'Sign up' links when user is not authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header
          isAuthenticated={false}
          isLoading={false}
          onLogoutComplete={mockOnLogoutComplete}
        />
      </MemoryRouter>,
    );

    const loginLink = screen.getByRole("link", { name: /log in/i });
    const signupLink = screen.getByRole("link", { name: /sign up/i });

    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/UserLogin");

    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute("href", "/UserRegistration");

    expect(screen.queryByText("Logout Component")).not.toBeInTheDocument();
  });

  test("applies 'active' CSS class to current location link", () => {
    render(
      <MemoryRouter initialEntries={["/UserLogin"]}>
        <Header
          isAuthenticated={false}
          isLoading={false}
          onLogoutComplete={mockOnLogoutComplete}
        />
      </MemoryRouter>,
    );

    const loginLink = screen.getByRole("link", { name: /log in/i });
    const signupLink = screen.getByRole("link", { name: /sign up/i });

    expect(loginLink).toHaveClass("active");
    expect(signupLink).not.toHaveClass("active");
  });

  test("renders LogoutComponent when user is authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header
          isAuthenticated={true}
          isLoading={false}
          onLogoutComplete={mockOnLogoutComplete}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Logout Component")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /log in/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /sign up/i }),
    ).not.toBeInTheDocument();
  });
});
