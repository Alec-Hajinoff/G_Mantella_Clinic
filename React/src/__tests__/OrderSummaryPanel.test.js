import { render, screen } from "@testing-library/react";
import OrderSummaryPanel from "../OrderSummaryPanel";

describe("OrderSummaryPanel Component", () => {
  const mockItemsWithPriceGbp = [
    { id: 1, name: "Brake Fluid Change", quantity: 1, price_gbp: 45.0 },
    { id: 2, name: "Oil Filter", quantity: 2, price_gbp: 12.5 },
  ];

  const mockItemsWithUnitAmount = [
    {
      product_id: "prod_1",
      name: "MOT Inspection",
      quantity: 1,
      unit_amount: 5485,
    },
  ];

  test("renders item list correctly using price_gbp format", () => {
    render(
      <OrderSummaryPanel
        items={mockItemsWithPriceGbp}
        subtotal={70.0}
        deliveryFee={0}
        isDelivery={false}
      />,
    );

    expect(screen.getByText("Brake Fluid Change (x1)")).toBeInTheDocument();
    expect(screen.getByText("£45.00")).toBeInTheDocument();
    expect(screen.getByText("Oil Filter (x2)")).toBeInTheDocument();
    expect(screen.getByText("£25.00")).toBeInTheDocument();
  });

  test("calculates item price correctly using unit_amount in pence format", () => {
    render(
      <OrderSummaryPanel
        items={mockItemsWithUnitAmount}
        subtotal={54.85}
        deliveryFee={0}
        isDelivery={false}
      />,
    );

    expect(screen.getByText("MOT Inspection (x1)")).toBeInTheDocument();

    const priceElements = screen.getAllByText("£54.85");
    expect(priceElements).toHaveLength(3);
  });

  test("does not display delivery fee when isDelivery is false", () => {
    render(
      <OrderSummaryPanel
        items={mockItemsWithPriceGbp}
        subtotal={70.0}
        deliveryFee={4.99}
        isDelivery={false}
      />,
    );

    expect(screen.queryByText("Delivery Fee")).not.toBeInTheDocument();

    const totalElements = screen.getAllByText("£70.00");
    expect(totalElements).toHaveLength(2);
  });

  test("displays delivery fee and calculates total correctly when isDelivery is true", () => {
    render(
      <OrderSummaryPanel
        items={mockItemsWithPriceGbp}
        subtotal={70.0}
        deliveryFee={4.99}
        isDelivery={true}
      />,
    );

    expect(screen.getByText("Delivery Fee")).toBeInTheDocument();
    expect(screen.getByText("£4.99")).toBeInTheDocument();
    expect(screen.getByText("£74.99")).toBeInTheDocument();
  });
});
