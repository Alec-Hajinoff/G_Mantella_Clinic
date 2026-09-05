import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NavigationBar from "../NavigationBar";

describe("NavigationBar Component", () => {
  test("renders Home and Shop navigation links", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavigationBar isAuthenticated={false} userRole={null} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /dashboard/i }),
    ).toBeInTheDocument();
  });

  test("applies active class to current path link", () => {
    render(
      <MemoryRouter initialEntries={["/shop"]}>
        <NavigationBar isAuthenticated={false} userRole={null} />
      </MemoryRouter>,
    );

    const shopLink = screen.getByRole("link", { name: /shop/i });
    const homeLink = screen.getByRole("link", { name: /home/i });

    expect(shopLink).toHaveClass("active");
    expect(homeLink).not.toHaveClass("active");
  });

  test("routes Dashboard link to /UserLogin when user is not authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavigationBar isAuthenticated={false} userRole={null} />
      </MemoryRouter>,
    );

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute("href", "/UserLogin");
  });

  test("routes Dashboard link to /UserDashboard for authenticated customers", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavigationBar isAuthenticated={true} userRole="customer" />
      </MemoryRouter>,
    );

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute("href", "/UserDashboard");
  });

  test("routes Dashboard link to /AdminDashboard for authenticated admin users", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavigationBar isAuthenticated={true} userRole="admin" />
      </MemoryRouter>,
    );

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute("href", "/AdminDashboard");
  });

  test("highlights Dashboard link as active on /UserDashboard and /AdminDashboard routes", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/UserDashboard"]}>
        <NavigationBar isAuthenticated={true} userRole="customer" />
      </MemoryRouter>,
    );

    let dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveClass("active");

    rerender(
      <MemoryRouter initialEntries={["/AdminDashboard"]}>
        <NavigationBar isAuthenticated={true} userRole="admin" />
      </MemoryRouter>,
    );

    dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveClass("active");
  });
});
