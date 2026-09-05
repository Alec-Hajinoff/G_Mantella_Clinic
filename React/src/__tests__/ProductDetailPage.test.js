import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useParams, useNavigate } from "react-router-dom";
import ProductDetailPage from "../ProductDetailPage";
import { productCatalogueGet, checkoutSessionCreate } from "../ApiService";
import { useBasket } from "../BasketContext";

jest.mock("../ApiService");
jest.mock("../BasketContext", () => ({
  useBasket: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

const originalLocation = window.location;
const originalAlert = window.alert;

describe("ProductDetailPage Component", () => {
  const mockNavigate = jest.fn();
  const mockAddToBasket = jest.fn();

  const mockProducts = [
    {
      id: "42",
      name: "Brake Pads - Front Pair",
      type: "Part",
      price_gbp: "45.00",
      description:
        "Premium ceramic front brake pads for maximum stopping power.",
      stripe_price_id: "price_brake_pads_42",
      image_url: "C:\\images\\brake-pads.jpg",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ id: "42" });
    useNavigate.mockReturnValue(mockNavigate);
    useBasket.mockReturnValue({ addToBasket: mockAddToBasket });

    delete window.location;
    window.location = { href: "" };
    window.alert = jest.fn();
  });

  afterAll(() => {
    window.location = originalLocation;
    window.alert = originalAlert;
  });

  test("renders loading spinner initially", () => {
    productCatalogueGet.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <ProductDetailPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("fetches and displays product details upon load", async () => {
    productCatalogueGet.mockResolvedValueOnce({
      status: "success",
      products: mockProducts,
    });

    render(
      <MemoryRouter>
        <ProductDetailPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Brake Pads - Front Pair")).toBeInTheDocument();
      expect(screen.getByText("Part")).toBeInTheDocument();
      expect(screen.getByText("£45.00")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Premium ceramic front brake pads for maximum stopping power.",
        ),
      ).toBeInTheDocument();
    });

    const img = screen.getByRole("img", { name: "Brake Pads - Front Pair" });
    expect(img).toHaveAttribute(
      "src",
      "http://localhost/Loveday_Auto/PHP/Images/brake-pads.jpg",
    );
  });

  test("displays error state when product ID is not found in response", async () => {
    productCatalogueGet.mockResolvedValueOnce({
      status: "success",
      products: [],
    });

    render(
      <MemoryRouter>
        <ProductDetailPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Product not found.")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /back to shop/i }),
      ).toHaveAttribute("href", "/shop");
    });
  });

  test("calls addToBasket when 'Add to basket' button is clicked", async () => {
    productCatalogueGet.mockResolvedValueOnce({
      status: "success",
      products: mockProducts,
    });

    render(
      <MemoryRouter>
        <ProductDetailPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Brake Pads - Front Pair")).toBeInTheDocument();
    });

    const basketBtn = screen.getByRole("button", { name: /add to basket/i });
    await userEvent.click(basketBtn);

    expect(mockAddToBasket).toHaveBeenCalledWith(mockProducts[0], 1, true);
  });

  test("initiates checkout session and redirects on 'Buy Now' click", async () => {
    productCatalogueGet.mockResolvedValueOnce({
      status: "success",
      products: mockProducts,
    });
    checkoutSessionCreate.mockResolvedValueOnce({
      status: "success",
      url: "https://checkout.stripe.com/pay/cs_test_session_42",
    });

    render(
      <MemoryRouter>
        <ProductDetailPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Brake Pads - Front Pair")).toBeInTheDocument();
    });

    const buyNowBtn = screen.getByRole("button", { name: /buy now/i });
    await userEvent.click(buyNowBtn);

    expect(checkoutSessionCreate).toHaveBeenCalledWith({
      items: [{ stripe_price_id: "price_brake_pads_42", quantity: 1 }],
    });

    await waitFor(() => {
      expect(window.location.href).toBe(
        "https://checkout.stripe.com/pay/cs_test_session_42",
      );
    });
  });

  test("alerts error when purchasing product without stripe_price_id", async () => {
    const unconfiguredProduct = [{ ...mockProducts[0], stripe_price_id: null }];
    productCatalogueGet.mockResolvedValueOnce({
      status: "success",
      products: unconfiguredProduct,
    });

    render(
      <MemoryRouter>
        <ProductDetailPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Brake Pads - Front Pair")).toBeInTheDocument();
    });

    const buyNowBtn = screen.getByRole("button", { name: /buy now/i });
    await userEvent.click(buyNowBtn);

    expect(window.alert).toHaveBeenCalledWith(
      "This product is not configured for online purchasing.",
    );
    expect(checkoutSessionCreate).not.toHaveBeenCalled();
  });
});
