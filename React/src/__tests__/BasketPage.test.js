import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import BasketPage from "../BasketPage";
import { useBasket } from "../BasketContext";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

jest.mock("../BasketContext", () => ({
  useBasket: jest.fn(),
}));

jest.mock("../BasketItemRow", () => {
  return function DummyBasketItemRow({ item, onUpdateQuantity, onRemove }) {
    return (
      <tr data-testid={`basket-item-${item.id}`}>
        <td>{item.name}</td>
        <td>
          <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
            Increase
          </button>
          <button onClick={() => onRemove(item.id)}>Remove</button>
        </td>
      </tr>
    );
  };
});

jest.mock("../OrderSummaryPanel", () => {
  return function DummyOrderSummaryPanel({ items, subtotal }) {
    return (
      <div data-testid="order-summary-panel">
        Items Count: {items.length}, Subtotal: £{subtotal.toFixed(2)}
      </div>
    );
  };
});

describe("BasketPage Component", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  test("renders empty basket message and link when basket has no items", () => {
    useBasket.mockReturnValue({
      basket: [],
      updateQuantity: jest.fn(),
      removeFromBasket: jest.fn(),
      basketSubtotal: 0,
    });

    render(
      <MemoryRouter>
        <BasketPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /your basket is empty/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /looks like you haven't added any products or services yet/i,
      ),
    ).toBeInTheDocument();

    const continueShoppingLink = screen.getByRole("link", {
      name: /continue shopping/i,
    });
    expect(continueShoppingLink).toBeInTheDocument();
    expect(continueShoppingLink).toHaveAttribute("href", "/shop");
  });

  test("renders basket items table and order summary when items exist", () => {
    const mockBasket = [
      { id: 1, name: "Oil Change", price_gbp: "49.99", quantity: 1 },
      { id: 2, name: "Brake Pads", price_gbp: "30.00", quantity: 2 },
    ];

    useBasket.mockReturnValue({
      basket: mockBasket,
      updateQuantity: jest.fn(),
      removeFromBasket: jest.fn(),
      basketSubtotal: 109.99,
    });

    render(
      <MemoryRouter>
        <BasketPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /shopping basket/i }),
    ).toBeInTheDocument();

    expect(screen.getByTestId("basket-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("basket-item-2")).toBeInTheDocument();
    expect(screen.getByTestId("order-summary-panel")).toHaveTextContent(
      "Items Count: 2, Subtotal: £109.99",
    );

    const continueShoppingLink = screen.getByRole("link", {
      name: /← continue shopping/i,
    });
    expect(continueShoppingLink).toHaveAttribute("href", "/shop");
  });

  test("passes updateQuantity and removeFromBasket callbacks correctly to rows", () => {
    const mockUpdateQuantity = jest.fn();
    const mockRemoveFromBasket = jest.fn();
    const mockBasket = [
      { id: 1, name: "Oil Change", price_gbp: "49.99", quantity: 1 },
    ];

    useBasket.mockReturnValue({
      basket: mockBasket,
      updateQuantity: mockUpdateQuantity,
      removeFromBasket: mockRemoveFromBasket,
      basketSubtotal: 49.99,
    });

    render(
      <MemoryRouter>
        <BasketPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /increase/i }));
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 2);

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(mockRemoveFromBasket).toHaveBeenCalledWith(1);
  });

  test("navigates to checkout page when 'Proceed to Checkout' is clicked", () => {
    useBasket.mockReturnValue({
      basket: [{ id: 1, name: "Oil Change", price_gbp: "49.99", quantity: 1 }],
      updateQuantity: jest.fn(),
      removeFromBasket: jest.fn(),
      basketSubtotal: 49.99,
    });

    render(
      <MemoryRouter>
        <BasketPage />
      </MemoryRouter>,
    );

    const checkoutButton = screen.getByRole("button", {
      name: /proceed to checkout/i,
    });
    fireEvent.click(checkoutButton);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/checkout");
  });
});
