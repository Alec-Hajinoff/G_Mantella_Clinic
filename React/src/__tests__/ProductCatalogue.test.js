import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductCatalogue from "../ProductCatalogue";
import { productCatalogueGet, productCataloguePost } from "../ApiService";

jest.mock("../ApiService");

const originalLocation = window.location;
const originalAlert = window.alert;

describe("ProductCatalogue Component", () => {
  const mockProducts = [
    {
      id: 1,
      name: "Full Service & MOT",
      type: "Service",
      description: "Complete vehicle service and MOT testing.",
      price_gbp: "180.00",
      stripe_price_id: "price_123",
      image_url: null,
    },
    {
      id: 2,
      name: "Brake Fluid",
      type: "Part",
      description: "High performance brake fluid.",
      price_gbp: "15.00",
      stripe_price_id: null,
      image_url: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    delete window.location;
    window.location = { href: "" };

    window.alert = jest.fn();
  });

  afterAll(() => {
    window.location = originalLocation;
    window.alert = originalAlert;
  });

  test("renders loading spinner initially and fetches products", async () => {
    productCatalogueGet.mockResolvedValueOnce({
      status: "success",
      products: mockProducts,
    });

    render(<ProductCatalogue />);

    expect(screen.getByText(/loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Full Service & MOT")).toBeInTheDocument();
      expect(screen.getByText("Brake Fluid")).toBeInTheDocument();
    });

    expect(productCatalogueGet).toHaveBeenCalledTimes(1);
  });

  test("displays error message when API fetch fails", async () => {
    productCatalogueGet.mockRejectedValueOnce(
      new Error("Database connection error"),
    );

    render(<ProductCatalogue />);

    await waitFor(() => {
      expect(screen.getByText("Database connection error")).toBeInTheDocument();
    });
  });

  test("increments and decrements product quantities correctly", async () => {
    productCatalogueGet.mockResolvedValueOnce({
      status: "success",
      products: mockProducts,
    });

    render(<ProductCatalogue />);

    await waitFor(() => {
      expect(screen.getByText("Full Service & MOT")).toBeInTheDocument();
    });

    const quantityDisplays = screen.getAllByText("1");
    const plusButtons = screen.getAllByRole("button", { name: "+" });
    const minusButtons = screen.getAllByRole("button", { name: "-" });

    await userEvent.click(plusButtons[0]);
    expect(screen.getByText("2")).toBeInTheDocument();

    await userEvent.click(minusButtons[0]);
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);

    await userEvent.click(minusButtons[0]);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  test("shows alert when attempting to buy product without stripe_price_id", async () => {
    productCatalogueGet.mockResolvedValueOnce({
      status: "success",
      products: mockProducts,
    });

    render(<ProductCatalogue />);

    await waitFor(() => {
      expect(screen.getByText("Brake Fluid")).toBeInTheDocument();
    });

    const buyButtons = screen.getAllByRole("button", { name: /buy now/i });
    await userEvent.click(buyButtons[1]);

    expect(window.alert).toHaveBeenCalledWith(
      "This product is not currently configured for online purchase.",
    );
    expect(productCataloguePost).not.toHaveBeenCalled();
  });

  test("redirects to Stripe checkout URL upon successful purchase initiation", async () => {
    productCatalogueGet.mockResolvedValueOnce({
      status: "success",
      products: mockProducts,
    });
    productCataloguePost.mockResolvedValueOnce({
      status: "success",
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });

    render(<ProductCatalogue />);

    await waitFor(() => {
      expect(screen.getByText("Full Service & MOT")).toBeInTheDocument();
    });

    const buyButtons = screen.getAllByRole("button", { name: /buy now/i });
    await userEvent.click(buyButtons[0]);

    expect(productCataloguePost).toHaveBeenCalledWith("price_123", 1);
    await waitFor(() => {
      expect(window.location.href).toBe(
        "https://checkout.stripe.com/pay/cs_test_123",
      );
    });
  });
});
