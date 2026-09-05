import React, { useState, useEffect } from "react";

import { productCatalogueGet, productCataloguePost } from "./ApiService";
import "./ProductCatalogue.css";

function ProductCatalogue() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingProductId, setBuyingProductId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productCatalogueGet();
        if (response.status === "success") {
          setProducts(response.products);

          const initialQuantities = {};
          response.products.forEach((product) => {
            initialQuantities[product.id] = 1;
          });
          setQuantities(initialQuantities);
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

  const handleQuantityChange = (id, delta) => {
    setQuantities((prevQuantities) => {
      const currentQty = prevQuantities[id] || 1;
      const newQty = Math.max(1, currentQty + delta);
      return { ...prevQuantities, [id]: newQty };
    });
  };

  const handleBuy = async (product) => {
    const quantity = quantities[product.id] || 1;

    if (!product.stripe_price_id) {
      alert("This product is not currently configured for online purchase.");
      return;
    }

    try {
      setBuyingProductId(product.id);
      const response = await productCataloguePost(
        product.stripe_price_id,
        quantity,
      );

      if (response.status === "success" && response.url) {
        window.location.href = response.url;
      } else {
        alert(
          response.message || "Could not initiate payment. Please try again.",
        );
      }
    } catch (err) {
      alert(err.message || "An error occurred during checkout.");
    } finally {
      setBuyingProductId(null);
    }
  };

  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    try {
      const filename = imagePath.split("\\").pop().split("/").pop();
      return require(`./Images/${filename}`);
    } catch (e) {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger my-4">{error}</div>;
  }

  return (
    <div className="container product-catalogue-container">
      <h2 className="mb-4">Products & Services</h2>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {products.map((product) => {
          const imageSrc = getImageSrc(product.image_url);
          const isBuying = buyingProductId === product.id;

          return (
            <div className="col" key={product.id}>
              <div className="card product-card h-100">
                <div className="product-image-wrapper">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={product.name}
                      className="product-image"
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      No image available
                    </div>
                  )}
                </div>
                <div className="product-card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="product-title me-2">{product.name}</h5>
                    <span className="badge bg-secondary product-type-badge">
                      {product.type}
                    </span>
                  </div>
                  <p className="product-description">{product.description}</p>
                  <div className="product-price-row">
                    <span className="product-price">
                      £{parseFloat(product.price_gbp).toFixed(2)}
                    </span>
                  </div>

                  <div className="quantity-control">
                    <button
                      className="btn btn-outline-secondary quantity-btn"
                      type="button"
                      disabled={isBuying}
                      onClick={() => handleQuantityChange(product.id, -1)}
                    >
                      -
                    </button>
                    <span className="quantity-display">
                      {quantities[product.id] || 1}
                    </span>
                    <button
                      className="btn btn-outline-secondary quantity-btn"
                      type="button"
                      disabled={isBuying}
                      onClick={() => handleQuantityChange(product.id, 1)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="btn btn-primary buy-button"
                    disabled={isBuying}
                    onClick={() => handleBuy(product)}
                  >
                    {isBuying ? "Redirecting..." : "Buy Now"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProductCatalogue;
