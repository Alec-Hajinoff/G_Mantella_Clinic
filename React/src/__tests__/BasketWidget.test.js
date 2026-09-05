import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BasketWidget from "../BasketWidget";
import { useBasket } from "../BasketContext";

jest.mock("../BasketContext", () => ({
  useBasket: jest.fn(),
}));

describe("BasketWidget Component", () => {
  const mockSetIsDrawerOpen = jest.fn();
  const mockRemoveFromBasket = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders widget button without badge when basket is empty", () => {
    useBasket.mockReturnValue({
      basket: [],
      basketCount: 0,
      basketSubtotal: 0,
      isDrawerOpen: false,
      setIsDrawerOpen: mockSetIsDrawerOpen,
      removeFromBasket: mockRemoveFromBasket,
    });

    render(
      <MemoryRouter>
        <BasketWidget />
      </MemoryRouter>,
    );

    const toggleBtn = screen.getByRole("button", { name: /🛒 basket/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText(/your basket/i)).not.toBeInTheDocument();
  });

  test("renders item count badge when basket has items", () => {
    useBasket.mockReturnValue({
      basket: [{ id: 1, name: "Oil Change", price_gbp: "49.99", quantity: 3 }],
      basketCount: 3,
      basketSubtotal: 149.97,
      isDrawerOpen: false,
      setIsDrawerOpen: mockSetIsDrawerOpen,
      removeFromBasket: mockRemoveFromBasket,
    });

    render(
      <MemoryRouter>
        <BasketWidget />
      </MemoryRouter>,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("toggles drawer open status when basket button is clicked", () => {
    useBasket.mockReturnValue({
      basket: [],
      basketCount: 0,
      basketSubtotal: 0,
      isDrawerOpen: false,
      setIsDrawerOpen: mockSetIsDrawerOpen,
      removeFromBasket: mockRemoveFromBasket,
    });

    render(
      <MemoryRouter>
        <BasketWidget />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /🛒 basket/i }));

    expect(mockSetIsDrawerOpen).toHaveBeenCalledTimes(1);
    expect(mockSetIsDrawerOpen).toHaveBeenCalledWith(true);
  });

  test("renders empty drawer content when open and basket is empty", () => {
    useBasket.mockReturnValue({
      basket: [],
      basketCount: 0,
      basketSubtotal: 0,
      isDrawerOpen: true,
      setIsDrawerOpen: mockSetIsDrawerOpen,
      removeFromBasket: mockRemoveFromBasket,
    });

    render(
      <MemoryRouter>
        <BasketWidget />
      </MemoryRouter>,
    );

    expect(screen.getByText("Your Basket (0)")).toBeInTheDocument();
    expect(screen.getByText("Your basket is empty")).toBeInTheDocument();
    expect(screen.queryByText(/subtotal:/i)).not.toBeInTheDocument();
  });

  test("renders items, subtotal, and checkout link when drawer is open with items", () => {
    const mockBasket = [
      { id: 1, name: "Oil Change", price_gbp: "49.99", quantity: 1 },
      { id: 2, name: "Brake Pads", price_gbp: "30.00", quantity: 2 },
    ];

    useBasket.mockReturnValue({
      basket: mockBasket,
      basketCount: 3,
      basketSubtotal: 109.99,
      isDrawerOpen: true,
      setIsDrawerOpen: mockSetIsDrawerOpen,
      removeFromBasket: mockRemoveFromBasket,
    });

    render(
      <MemoryRouter>
        <BasketWidget />
      </MemoryRouter>,
    );

    expect(screen.getByText("Your Basket (3)")).toBeInTheDocument();
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("1 x £49.99")).toBeInTheDocument();
    expect(screen.getByText("Brake Pads")).toBeInTheDocument();
    expect(screen.getByText("2 x £30.00")).toBeInTheDocument();
    expect(screen.getByText("£109.99")).toBeInTheDocument();

    const checkoutLink = screen.getByRole("link", {
      name: /view basket \/ checkout/i,
    });
    expect(checkoutLink).toHaveAttribute("href", "/basket");
  });

  test("calls removeFromBasket when item remove button is clicked", () => {
    useBasket.mockReturnValue({
      basket: [{ id: 1, name: "Oil Change", price_gbp: "49.99", quantity: 1 }],
      basketCount: 1,
      basketSubtotal: 49.99,
      isDrawerOpen: true,
      setIsDrawerOpen: mockSetIsDrawerOpen,
      removeFromBasket: mockRemoveFromBasket,
    });

    render(
      <MemoryRouter>
        <BasketWidget />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "×" }));

    expect(mockRemoveFromBasket).toHaveBeenCalledTimes(1);
    expect(mockRemoveFromBasket).toHaveBeenCalledWith(1);
  });

  test("closes drawer when close button or view basket link is clicked", () => {
    useBasket.mockReturnValue({
      basket: [{ id: 1, name: "Oil Change", price_gbp: "49.99", quantity: 1 }],
      basketCount: 1,
      basketSubtotal: 49.99,
      isDrawerOpen: true,
      setIsDrawerOpen: mockSetIsDrawerOpen,
      removeFromBasket: mockRemoveFromBasket,
    });

    render(
      <MemoryRouter>
        <BasketWidget />
      </MemoryRouter>,
    );

    const closeButtons = screen.getAllByRole("button");
    const closeDrawerBtn = closeButtons.find((btn) =>
      btn.classList.contains("btn-close"),
    );
    fireEvent.click(closeDrawerBtn);
    expect(mockSetIsDrawerOpen).toHaveBeenCalledWith(false);

    const checkoutLink = screen.getByRole("link", {
      name: /view basket \/ checkout/i,
    });
    fireEvent.click(checkoutLink);
    expect(mockSetIsDrawerOpen).toHaveBeenCalledWith(false);
  });
});
