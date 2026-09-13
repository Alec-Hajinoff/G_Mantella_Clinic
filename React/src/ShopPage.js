import React, { useState, useEffect } from "react";
import { productCatalogueGet } from "./ApiService";
import ProductCard from "./ProductCard";

function ShopPage({
  selectedProducts = null,
  onClearSelection = () => {},
  layout = "full",
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFilteredMode = Array.isArray(selectedProducts);

  const displayProducts = isFilteredMode ? selectedProducts : products;

  const gridClasses =
    layout === "embedded"
      ? "row row-cols-1 row-cols-sm-2 row-cols-lg-2 g-4"
      : "row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productCatalogueGet();
        if (response.status === "success") {
          setProducts(response.products);
        } else {
          setError(response.message || "Failed to load products.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading && !isFilteredMode) {
    return (
      <div className="container text-center my-5 py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading products...</span>
        </div>
      </div>
    );
  }

  if (error && !isFilteredMode) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      {isFilteredMode && (
        <div className="mb-4">
          <button
            className="btn btn-outline-primary"
            onClick={onClearSelection}
          >
            ← Show All Products
          </button>
        </div>
      )}

      {isFilteredMode && displayProducts.length === 0 ? (
        <div className="alert alert-info text-center">
          No products available for this placement yet. Please check back soon.
        </div>
      ) : (
        <div className={gridClasses}>
          {displayProducts.map((product) => (
            <div className="col" key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShopPage;
