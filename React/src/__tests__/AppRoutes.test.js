import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import AppRoutes from "../AppRoutes";

jest.mock("../MainRegLog", () => ({ isAuthenticated, userRole, isLoading }) => (
  <div data-testid="main-reg-log">
    MainRegLog - Auth: {String(isAuthenticated)}, Role: {userRole || "none"},
    Loading: {String(isLoading)}
  </div>
));
jest.mock("../UserLogin", () => () => (
  <div data-testid="user-login">User Login</div>
));
jest.mock("../UserRegistration", () => () => (
  <div data-testid="user-registration">User Registration</div>
));
jest.mock("../RegisteredPage", () => () => (
  <div data-testid="registered-page">Registered Page</div>
));
jest.mock("../LogoutComponent", () => () => (
  <div data-testid="logout-component">Logout Component</div>
));
jest.mock("../VerifyEmail", () => () => (
  <div data-testid="verify-email">Verify Email</div>
));
jest.mock("../PasswordReset", () => () => (
  <div data-testid="password-reset">Password Reset</div>
));

jest.mock("../ShopPage", () => () => (
  <div data-testid="shop-page">Shop Page</div>
));
jest.mock("../ProductDetailPage", () => () => (
  <div data-testid="product-detail-page">Product Detail Page</div>
));
jest.mock("../BasketPage", () => () => (
  <div data-testid="basket-page">Basket Page</div>
));
jest.mock("../CheckoutPage", () => () => (
  <div data-testid="checkout-page">Checkout Page</div>
));
jest.mock("../OrderSuccessPage", () => () => (
  <div data-testid="order-success-page">Order Success Page</div>
));

jest.mock("../UserDashboard", () => () => (
  <div data-testid="user-dashboard">User Dashboard</div>
));
jest.mock("../AdminDashboard", () => () => (
  <div data-testid="admin-dashboard">Admin Dashboard</div>
));

jest.mock("../ProtectedRoute", () => ({ children }) => (
  <div data-testid="protected-route">{children}</div>
));

describe("AppRoutes Component", () => {
  const renderWithRouter = (initialEntries = ["/"], props = {}) => {
    const defaultProps = {
      isAuthenticated: false,
      userRole: null,
      isLoading: false,
      ...props,
    };

    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes {...defaultProps} />
      </MemoryRouter>,
    );
  };

  it("renders MainRegLog for root path '/' with received props", () => {
    renderWithRouter(["/"], {
      isAuthenticated: true,
      userRole: "customer",
      isLoading: false,
    });

    expect(screen.getByTestId("main-reg-log")).toBeInTheDocument();
    expect(
      screen.getByText(
        "MainRegLog - Auth: true, Role: customer, Loading: false",
      ),
    ).toBeInTheDocument();
  });

  it("renders public authentication pages correctly", () => {
    const publicRoutes = [
      { path: "/UserLogin", testId: "user-login" },
      { path: "/UserRegistration", testId: "user-registration" },
      { path: "/RegisteredPage", testId: "registered-page" },
      { path: "/LogoutComponent", testId: "logout-component" },
      { path: "/VerifyEmail", testId: "verify-email" },
      { path: "/PasswordReset", testId: "password-reset" },
    ];

    publicRoutes.forEach(({ path, testId }) => {
      const { unmount } = renderWithRouter([path]);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
      unmount();
    });
  });

  it("renders e-commerce shop pages correctly", () => {
    const shopRoutes = [
      { path: "/shop", testId: "shop-page" },
      { path: "/product/42", testId: "product-detail-page" },
      { path: "/basket", testId: "basket-page" },
      { path: "/checkout", testId: "checkout-page" },
      { path: "/order/success", testId: "order-success-page" },
    ];

    shopRoutes.forEach(({ path, testId }) => {
      const { unmount } = renderWithRouter([path]);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
      unmount();
    });
  });

  it("renders UserDashboard wrapped inside ProtectedRoute", () => {
    renderWithRouter(["/UserDashboard"]);

    expect(screen.getByTestId("protected-route")).toBeInTheDocument();
    expect(screen.getByTestId("user-dashboard")).toBeInTheDocument();
  });

  it("renders AdminDashboard wrapped inside ProtectedRoute", () => {
    renderWithRouter(["/AdminDashboard"]);

    expect(screen.getByTestId("protected-route")).toBeInTheDocument();
    expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
  });
});
