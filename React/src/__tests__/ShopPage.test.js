import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ShopPage from "../ShopPage";
import { productCatalogueGet } from "../ApiService";

jest.mock("../ApiService");
jest.mock("../ProductCard", () => {
  return function MockProductCard({ product }) {
    return (
      <div data-testid="product-card">
        <h3>{product.name}</h3>
        <span>£{product.price_gbp}</span>
      </div>
    );
  };
});

describe("ShopPage Component", () => {
  const mockProducts = [
    {
      id: 1,
      name: "Brake Pads",
      price_gbp: "45.00",
      description: "Front pair brake pads.",
    },
    {
      id: 2,
      name: "Engine Oil",
      price_gbp: "30.00",
      description: "5W-30 Synthetic Oil.",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading spinner on initial mount", () => {
    productCatalogueGet.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <ShopPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading products...")).toBeInTheDocument();
  });

  test("fetches and renders list of products via ProductCard components", async () => {
    productCatalogueGet.mockResolvedValueOnce({
      status: "success",
      products: mockProducts,
    });

    render(
      <MemoryRouter>
        <ShopPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Brake Pads")).toBeInTheDocument();
      expect(screen.getByText("Engine Oil")).toBeInTheDocument();
    });

    const cards = screen.getAllByTestId("product-card");
    expect(cards).toHaveLength(2);
    expect(productCatalogueGet).toHaveBeenCalledTimes(1);
  });

  test("displays error alert when API request fails with error message", async () => {
    productCatalogueGet.mockResolvedValueOnce({
      status: "error",
      message: "Unable to retrieve catalogue.",
    });

    render(
      <MemoryRouter>
        <ShopPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Unable to retrieve catalogue."),
      ).toBeInTheDocument();
    });

    expect(screen.queryByTestId("product-card")).not.toBeInTheDocument();
  });

  test("displays error alert when API call throws an exception", async () => {
    productCatalogueGet.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <ShopPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("product-card")).not.toBeInTheDocument();
  });
});
