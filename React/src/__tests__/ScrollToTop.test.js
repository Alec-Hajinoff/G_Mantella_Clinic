import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import ScrollToTop from "../ScrollToTop";

describe("ScrollToTop Component", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("scrolls to (0, 0) on initial render", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  test("scrolls to (0, 0) when path changes", async () => {
    const TestNavigation = () => {
      const navigate = useNavigate();
      return <button onClick={() => navigate("/new-page")}>Navigate</button>;
    };

    render(
      <MemoryRouter initialEntries={["/home"]}>
        <ScrollToTop />
        <Routes>
          <Route path="/home" element={<TestNavigation />} />
          <Route path="/new-page" element={<div>New Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    window.scrollTo.mockClear();

    const button = screen.getByRole("button", { name: "Navigate" });
    await userEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  test("returns null and renders no DOM elements", () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>,
    );

    expect(container.firstChild).toBeNull();
  });
});
