import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";
import { checkSession } from "../ApiService";

jest.mock("../ApiService", () => ({
  checkSession: jest.fn(),
}));

jest.mock(
  "../Header",
  () =>
    ({ isAuthenticated, isLoading, onLogoutComplete }) => (
      <header data-testid="header">
        Header - Auth: {String(isAuthenticated)}, Loading: {String(isLoading)}
        <button onClick={onLogoutComplete}>Mock Logout</button>
      </header>
    ),
);

jest.mock("../NavigationBar", () => ({ isAuthenticated, userRole }) => (
  <nav data-testid="navigation-bar">
    Nav - Auth: {String(isAuthenticated)}, Role: {userRole || "none"}
  </nav>
));

jest.mock("../AppRoutes", () => ({ isAuthenticated, userRole, isLoading }) => (
  <div data-testid="app-routes">
    Routes - Auth: {String(isAuthenticated)}, Role: {userRole || "none"},
    Loading: {String(isLoading)}
  </div>
));

jest.mock("../Footer", () => () => (
  <footer data-testid="footer">Footer</footer>
));
jest.mock("../ScrollToTop", () => () => <div data-testid="scroll-to-top" />);

jest.mock("../BasketContext", () => ({
  BasketProvider: ({ children }) => (
    <div data-testid="basket-provider">{children}</div>
  ),
}));

describe("App Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders layout structure and verifies session on mount for an authenticated user", async () => {
    checkSession.mockResolvedValueOnce({
      authenticated: true,
      role: "admin",
    });

    render(<App />);

    expect(screen.getByTestId("basket-provider")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("navigation-bar")).toBeInTheDocument();
    expect(screen.getByTestId("app-routes")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    expect(checkSession).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(
        screen.getByText("Header - Auth: true, Loading: false"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Nav - Auth: true, Role: admin"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Routes - Auth: true, Role: admin, Loading: false"),
      ).toBeInTheDocument();
    });
  });

  it("handles unauthenticated session response gracefully", async () => {
    checkSession.mockResolvedValueOnce({
      authenticated: false,
      role: null,
    });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Header - Auth: false, Loading: false"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Nav - Auth: false, Role: none"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Routes - Auth: false, Role: none, Loading: false"),
      ).toBeInTheDocument();
    });
  });

  it("resets authentication state when session check fails or throws an error", async () => {
    checkSession.mockRejectedValueOnce(new Error("Network Error"));

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Header - Auth: false, Loading: false"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Nav - Auth: false, Role: none"),
      ).toBeInTheDocument();
    });
  });

  it("re-runs verifySession when onLogoutComplete callback is triggered from Header", async () => {
    checkSession
      .mockResolvedValueOnce({ authenticated: true, role: "customer" })
      .mockResolvedValueOnce({ authenticated: false, role: null });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Header - Auth: true, Loading: false"),
      ).toBeInTheDocument();
    });

    screen.getByRole("button", { name: "Mock Logout" }).click();

    await waitFor(() => {
      expect(checkSession).toHaveBeenCalledTimes(2);
      expect(
        screen.getByText("Header - Auth: false, Loading: false"),
      ).toBeInTheDocument();
    });
  });
});
