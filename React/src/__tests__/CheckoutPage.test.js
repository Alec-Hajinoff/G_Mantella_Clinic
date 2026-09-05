import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CheckoutPage from "../CheckoutPage";
import { useBasket } from "../BasketContext";
import { checkoutSessionCreate } from "../ApiService";

jest.mock("../BasketContext", () => ({
  useBasket: jest.fn(),
}));

jest.mock("../ApiService", () => ({
  checkoutSessionCreate: jest.fn(),
}));

jest.mock("../OrderSummaryPanel", () => {
  return function DummyOrderSummaryPanel(props) {
    return (
      <div data-testid="order-summary-panel">
        <div>Subtotal: {props.subtotal}</div>
        <div>Is Delivery: {props.isDelivery.toString()}</div>
      </div>
    );
  };
});

describe("CheckoutPage Component", () => {
  const mockBasketItems = [
    {
      stripe_price_id: "price_123",
      quantity: 2,
      name: "Oil Filter",
      price: 15.0,
    },
    {
      stripe_price_id: "price_456",
      quantity: 1,
      name: "Brake Pads",
      price: 40.0,
    },
  ];

  const originalLocation = window.location;

  beforeAll(() => {
    delete window.location;
    window.location = { href: "" };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = "";
  });

  test("renders empty basket message when basket is empty", () => {
    useBasket.mockReturnValue({ basket: [], basketSubtotal: 0 });

    render(<CheckoutPage />);

    expect(
      screen.getByRole("heading", {
        name: /no items in basket to checkout\./i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /pay with stripe/i }),
    ).not.toBeInTheDocument();
  });

  test("renders checkout form and order summary panel when basket has items", () => {
    useBasket.mockReturnValue({
      basket: mockBasketItems,
      basketSubtotal: 70.0,
    });

    render(<CheckoutPage />);

    expect(
      screen.getByRole("heading", { name: /^checkout$/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("order-summary-panel")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /pay with stripe/i }),
    ).toBeInTheDocument();
  });

  test("toggles delivery address inputs when switching fulfillment options", () => {
    useBasket.mockReturnValue({
      basket: mockBasketItems,
      basketSubtotal: 70.0,
    });

    render(<CheckoutPage />);

    expect(
      screen.queryByPlaceholderText("Address Line 1"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/local delivery/i));

    expect(screen.getByPlaceholderText("Address Line 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("City")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Postcode")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/garage collection/i));

    expect(
      screen.queryByPlaceholderText("Address Line 1"),
    ).not.toBeInTheDocument();
  });

  test("submits collection order successfully and redirects to Stripe URL", async () => {
    useBasket.mockReturnValue({
      basket: mockBasketItems,
      basketSubtotal: 70.0,
    });
    checkoutSessionCreate.mockResolvedValueOnce({
      status: "success",
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });

    render(<CheckoutPage />);

    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { name: "firstName", value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { name: "lastName", value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { name: "email", value: "john@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Phone Number"), {
      target: { name: "phone", value: "07123456789" },
    });

    fireEvent.click(screen.getByRole("button", { name: /pay with stripe/i }));

    expect(checkoutSessionCreate).toHaveBeenCalledWith({
      items: [
        { stripe_price_id: "price_123", quantity: 2 },
        { stripe_price_id: "price_456", quantity: 1 },
      ],
      fulfillment: "collection",
      customer_details: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "07123456789",
        addressLine1: "",
        city: "",
        postcode: "",
      },
      delivery_fee: 0,
    });

    await waitFor(() => {
      expect(window.location.href).toBe(
        "https://checkout.stripe.com/pay/cs_test_123",
      );
    });
  });

  test("submits delivery order with delivery fee included", async () => {
    useBasket.mockReturnValue({
      basket: mockBasketItems,
      basketSubtotal: 70.0,
    });
    checkoutSessionCreate.mockResolvedValueOnce({
      status: "success",
      url: "https://checkout.stripe.com/pay/cs_test_456",
    });

    render(<CheckoutPage />);

    fireEvent.click(screen.getByLabelText(/local delivery/i));

    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { name: "firstName", value: "Jane" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { name: "lastName", value: "Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { name: "email", value: "jane@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Phone Number"), {
      target: { name: "phone", value: "07987654321" },
    });
    fireEvent.change(screen.getByPlaceholderText("Address Line 1"), {
      target: { name: "addressLine1", value: "10 High St" },
    });
    fireEvent.change(screen.getByPlaceholderText("City"), {
      target: { name: "city", value: "London" },
    });
    fireEvent.change(screen.getByPlaceholderText("Postcode"), {
      target: { name: "postcode", value: "SW1A 1AA" },
    });

    fireEvent.click(screen.getByRole("button", { name: /pay with stripe/i }));

    expect(checkoutSessionCreate).toHaveBeenCalledWith({
      items: [
        { stripe_price_id: "price_123", quantity: 2 },
        { stripe_price_id: "price_456", quantity: 1 },
      ],
      fulfillment: "delivery",
      customer_details: {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phone: "07987654321",
        addressLine1: "10 High St",
        city: "London",
        postcode: "SW1A 1AA",
      },
      delivery_fee: 5.0,
    });
  });

  test("renders error message on API failure response", async () => {
    useBasket.mockReturnValue({
      basket: mockBasketItems,
      basketSubtotal: 70.0,
    });
    checkoutSessionCreate.mockResolvedValueOnce({
      status: "error",
      message: "Out of stock item.",
    });

    render(<CheckoutPage />);

    fireEvent.click(screen.getByRole("button", { name: /pay with stripe/i }));

    await waitFor(() => {
      expect(screen.getByText("Out of stock item.")).toBeInTheDocument();
    });
  });

  test("renders error message on API network exception", async () => {
    useBasket.mockReturnValue({
      basket: mockBasketItems,
      basketSubtotal: 70.0,
    });
    checkoutSessionCreate.mockRejectedValueOnce(new Error("Server error"));

    render(<CheckoutPage />);

    fireEvent.click(screen.getByRole("button", { name: /pay with stripe/i }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });
});
