import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BasketProvider, useBasket } from "../BasketContext";

const TestConsumer = () => {
  const {
    basket,
    addToBasket,
    removeFromBasket,
    updateQuantity,
    clearBasket,
    basketCount,
    basketSubtotal,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useBasket();

  return (
    <div>
      <span data-testid="count">{basketCount}</span>
      <span data-testid="subtotal">{basketSubtotal.toFixed(2)}</span>
      <span data-testid="drawer-status">
        {isDrawerOpen ? "open" : "closed"}
      </span>

      <ul data-testid="basket-list">
        {basket.map((item) => (
          <li key={item.id} data-testid={`item-${item.id}`}>
            {item.name} - Qty: {item.quantity}
          </li>
        ))}
      </ul>

      <button
        onClick={() =>
          addToBasket({ id: 1, name: "Oil Change", price_gbp: "49.99" })
        }
      >
        Add Oil Change
      </button>

      <button
        onClick={() =>
          addToBasket(
            { id: 2, name: "Brake Pads", price_gbp: "30.00" },
            2,
            false,
          )
        }
      >
        Add 2 Brake Pads (No Drawer)
      </button>

      <button onClick={() => removeFromBasket(1)}>Remove Oil Change</button>
      <button onClick={() => updateQuantity(1, 3)}>Set Oil Change Qty 3</button>
      <button onClick={() => updateQuantity(1, 0)}>Set Oil Change Qty 0</button>
      <button onClick={clearBasket}>Clear Basket</button>
      <button onClick={() => setIsDrawerOpen(false)}>Close Drawer</button>
    </div>
  );
};

describe("BasketContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("provides initial empty context state when localStorage is clear", () => {
    render(
      <BasketProvider>
        <TestConsumer />
      </BasketProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("0.00");
    expect(screen.getByTestId("drawer-status")).toHaveTextContent("closed");
    expect(screen.getByTestId("basket-list")).toBeEmptyDOMElement();
  });

  test("loads initial state from localStorage if data exists", () => {
    const initialItems = [
      { id: 1, name: "Tire Replacement", price_gbp: "80.00", quantity: 2 },
    ];
    localStorage.setItem("loveday_basket", JSON.stringify(initialItems));

    render(
      <BasketProvider>
        <TestConsumer />
      </BasketProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("160.00");
    expect(screen.getByTestId("item-1")).toHaveTextContent(
      "Tire Replacement - Qty: 2",
    );
  });

  test("adds new items to basket and opens drawer by default", () => {
    render(
      <BasketProvider>
        <TestConsumer />
      </BasketProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /add oil change/i }));

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("49.99");
    expect(screen.getByTestId("drawer-status")).toHaveTextContent("open");
    expect(screen.getByTestId("item-1")).toHaveTextContent(
      "Oil Change - Qty: 1",
    );
    expect(localStorage.getItem("loveday_basket")).toContain("Oil Change");
  });

  test("increments quantity if existing item is added again", () => {
    render(
      <BasketProvider>
        <TestConsumer />
      </BasketProvider>,
    );

    const addButton = screen.getByRole("button", { name: /add oil change/i });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("99.98");
    expect(screen.getByTestId("item-1")).toHaveTextContent(
      "Oil Change - Qty: 2",
    );
  });

  test("respects quantity and openDrawer arguments when adding items", () => {
    render(
      <BasketProvider>
        <TestConsumer />
      </BasketProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /add 2 brake pads \(no drawer\)/i }),
    );

    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("60.00");
    expect(screen.getByTestId("drawer-status")).toHaveTextContent("closed");
  });

  test("removes item from basket", () => {
    render(
      <BasketProvider>
        <TestConsumer />
      </BasketProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /add oil change/i }));
    expect(screen.getByTestId("item-1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove oil change/i }));

    expect(screen.queryByTestId("item-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  test("updates item quantity correctly", () => {
    render(
      <BasketProvider>
        <TestConsumer />
      </BasketProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /add oil change/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /set oil change qty 3/i }),
    );

    expect(screen.getByTestId("count")).toHaveTextContent("3");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("149.97");
  });

  test("removes item if quantity is set to 0 or less", () => {
    render(
      <BasketProvider>
        <TestConsumer />
      </BasketProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /add oil change/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /set oil change qty 0/i }),
    );

    expect(screen.queryByTestId("item-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  test("clears all items from basket", () => {
    render(
      <BasketProvider>
        <TestConsumer />
      </BasketProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /add oil change/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /add 2 brake pads \(no drawer\)/i }),
    );

    expect(screen.getByTestId("count")).toHaveTextContent("3");

    fireEvent.click(screen.getByRole("button", { name: /clear basket/i }));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("0.00");
    expect(screen.getByTestId("basket-list")).toBeEmptyDOMElement();
    expect(localStorage.getItem("loveday_basket")).toBe("[]");
  });

  test("updates drawer visibility state", () => {
    render(
      <BasketProvider>
        <TestConsumer />
      </BasketProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /add oil change/i }));
    expect(screen.getByTestId("drawer-status")).toHaveTextContent("open");

    fireEvent.click(screen.getByRole("button", { name: /close drawer/i }));
    expect(screen.getByTestId("drawer-status")).toHaveTextContent("closed");
  });
});
