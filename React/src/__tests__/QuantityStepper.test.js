import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuantityStepper from "../QuantityStepper";

describe("QuantityStepper Component", () => {
  const mockOnIncrease = jest.fn();
  const mockOnDecrease = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders current quantity value", () => {
    render(
      <QuantityStepper
        quantity={3}
        onIncrease={mockOnIncrease}
        onDecrease={mockOnDecrease}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("calls onIncrease when '+' button is clicked", async () => {
    render(
      <QuantityStepper
        quantity={1}
        onIncrease={mockOnIncrease}
        onDecrease={mockOnDecrease}
      />,
    );

    const increaseBtn = screen.getByRole("button", { name: "+" });
    await userEvent.click(increaseBtn);

    expect(mockOnIncrease).toHaveBeenCalledTimes(1);
  });

  test("calls onDecrease when '-' button is clicked and quantity > 1", async () => {
    render(
      <QuantityStepper
        quantity={2}
        onIncrease={mockOnIncrease}
        onDecrease={mockOnDecrease}
      />,
    );

    const decreaseBtn = screen.getByRole("button", { name: "-" });
    await userEvent.click(decreaseBtn);

    expect(mockOnDecrease).toHaveBeenCalledTimes(1);
  });

  test("disables '-' button when quantity is 1", () => {
    render(
      <QuantityStepper
        quantity={1}
        onIncrease={mockOnIncrease}
        onDecrease={mockOnDecrease}
      />,
    );

    const decreaseBtn = screen.getByRole("button", { name: "-" });
    const increaseBtn = screen.getByRole("button", { name: "+" });

    expect(decreaseBtn).toBeDisabled();
    expect(increaseBtn).not.toBeDisabled();
  });

  test("disables both buttons when disabled prop is true", () => {
    render(
      <QuantityStepper
        quantity={5}
        onIncrease={mockOnIncrease}
        onDecrease={mockOnDecrease}
        disabled={true}
      />,
    );

    const decreaseBtn = screen.getByRole("button", { name: "-" });
    const increaseBtn = screen.getByRole("button", { name: "+" });

    expect(decreaseBtn).toBeDisabled();
    expect(increaseBtn).toBeDisabled();
  });
});
