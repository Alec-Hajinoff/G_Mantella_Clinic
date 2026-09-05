import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";
import { checkSession } from "../ApiService";

jest.mock("../ApiService");

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders nothing (null) while session check is pending", () => {
    checkSession.mockImplementation(() => new Promise(() => {}));

    const { container } = render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  test("renders protected children when session check succeeds (authenticated: true)", async () => {
    checkSession.mockResolvedValueOnce({ authenticated: true });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Secret Content")).toBeInTheDocument();
    });

    expect(checkSession).toHaveBeenCalledTimes(1);
  });

  test("redirects to home route ('/') when session check returns authenticated: false", async () => {
    checkSession.mockResolvedValueOnce({ authenticated: false });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });

    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  test("redirects to home route ('/') when session check API call fails", async () => {
    checkSession.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });

    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });
});
