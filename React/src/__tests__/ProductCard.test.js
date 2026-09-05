import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard";
import { useBasket } from "../BasketContext";

jest.mock("../BasketContext", () => ({
  useBasket: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("ProductCard Component", () => {
  const mockNavigate = jest.fn();
  const mockAddToBasket = jest.fn();

  const mockProduct = {
    id: 101,
    name: "Bosch Engine Oil 5W-30",
    description: "High performance synthetic motor oil for modern engines.",
    price_gbp: "29.99",
    image_url: "C:\\uploads\\products\\engine-oil.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useBasket.mockReturnValue({
      addToBasket: mockAddToBasket,
    });
  });

  test("renders product details correctly with formatted price", () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Bosch Engine Oil 5W-30")).toBeInTheDocument();
    expect(
      screen.getByText(
        "High performance synthetic motor oil for modern engines.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("£29.99")).toBeInTheDocument();
  });

  test("parses image path and sets correct backend URL", () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>,
    );

    const image = screen.getByRole("img", { name: "Bosch Engine Oil 5W-30" });
    expect(image).toHaveAttribute(
      "src",
      "http://localhost/Loveday_Auto/PHP/Images/engine-oil.jpg",
    );
  });

  test("displays 'No image' fallback when image_url is missing", () => {
    const productWithoutImage = { ...mockProduct, image_url: null };

    render(
      <MemoryRouter>
        <ProductCard product={productWithoutImage} />
      </MemoryRouter>,
    );

    expect(screen.getByText("No image")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("navigates to product details page when card is clicked", async () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>,
    );

    const cardTitle = screen.getByText("Bosch Engine Oil 5W-30");
    await userEvent.click(cardTitle);

    expect(mockNavigate).toHaveBeenCalledWith("/product/101");
  });

  test("adds item to basket and stops event propagation on button click", async () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>,
    );

    const addButton = screen.getByRole("button", { name: /add to basket/i });
    await userEvent.click(addButton);

    expect(mockAddToBasket).toHaveBeenCalledWith(mockProduct, 1, true);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
