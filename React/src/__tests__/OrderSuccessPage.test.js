import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OrderSuccessPage from "../OrderSuccessPage";
import { useBasket } from "../BasketContext";

jest.mock("../BasketContext", () => ({
  useBasket: jest.fn(),
}));

describe("OrderSuccessPage Component", () => {
  const mockClearBasket = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useBasket.mockReturnValue({
      clearBasket: mockClearBasket,
    });
  });

  test("clears the basket on mount", () => {
    render(
      <MemoryRouter>
        <OrderSuccessPage />
      </MemoryRouter>,
    );

    expect(mockClearBasket).toHaveBeenCalledTimes(1);
  });

  test("renders success messages and information notes", () => {
    render(
      <MemoryRouter>
        <OrderSuccessPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/payment successful!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/thank you for your order with loveday auto repairs/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /a confirmation email has been sent to your email address/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /if you ordered items requiring fitting or mot\/service appointments/i,
      ),
    ).toBeInTheDocument();
  });

  test("renders action links pointing to correct routes", () => {
    render(
      <MemoryRouter>
        <OrderSuccessPage />
      </MemoryRouter>,
    );

    const shopLink = screen.getByRole("link", { name: /return to shop/i });
    const dashboardLink = screen.getByRole("link", {
      name: /book appointment slot/i,
    });

    expect(shopLink).toHaveAttribute("href", "/shop");
    expect(dashboardLink).toHaveAttribute("href", "/UserDashboard");
  });
});
