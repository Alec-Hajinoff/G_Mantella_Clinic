import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BasketItemRow from "../BasketItemRow";

describe("BasketItemRow Component", () => {
  const mockItem = {
    id: 1,
    name: "Full Service & Oil Change",
    type: "service",
    price_gbp: "149.99",
    quantity: 2,
  };

  const mockOnUpdateQuantity = jest.fn();
  const mockOnRemove = jest.fn();

  const renderComponent = (itemProps = mockItem) => {
    return render(
      <table>
        <tbody>
          <BasketItemRow
            item={itemProps}
            onUpdateQuantity={mockOnUpdateQuantity}
            onRemove={mockOnRemove}
          />
        </tbody>
      </table>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders item details, unit price, and calculated line total correctly", () => {
    renderComponent();

    expect(screen.getByText("Full Service & Oil Change")).toBeInTheDocument();
    expect(screen.getByText("service")).toBeInTheDocument();
    expect(screen.getByText("£149.99")).toBeInTheDocument();

    expect(screen.getByText("£299.98")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  test("calls onUpdateQuantity with incremented value when increasing quantity", () => {
    renderComponent();

    const increaseButton =
      screen.getByRole("button", { name: /\+|\badd\b|\bincrease\b/i }) ||
      screen.getAllByRole("button")[0];

    fireEvent.click(increaseButton);

    expect(mockOnUpdateQuantity).toHaveBeenCalledTimes(1);
    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(1, 3);
  });

  test("calls onUpdateQuantity with decremented value when decreasing quantity", () => {
    renderComponent();

    const decreaseButton =
      screen.getByRole("button", { name: /-|\bsubtract\b|\bdecrease\b/i }) ||
      screen.getAllByRole("button")[1];

    fireEvent.click(decreaseButton);

    expect(mockOnUpdateQuantity).toHaveBeenCalledTimes(1);
    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(1, 1);
  });

  test("calls onRemove with the correct item id when remove button is clicked", () => {
    renderComponent();

    const removeButton = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledTimes(1);
    expect(mockOnRemove).toHaveBeenCalledWith(1);
  });
});
