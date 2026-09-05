import React from "react";
import { useNavigate } from "react-router-dom";
import { useBasket } from "./BasketContext";
import "./ProductCard.css";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToBasket } = useBasket();

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    addToBasket(product, 1, true);
  };

  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    const filename = imagePath.split("\\").pop().split("/").pop();
    return `http://localhost/Loveday_Auto/PHP/Images/${filename}`;
  };

  const imageSrc = getImageSrc(product.image_url);

  return (
    <div
      className="card h-100 shadow-sm product-card"
      onClick={handleCardClick}
    >
      <div className="card-img-top d-flex align-items-center justify-content-center product-card-img-container">
        {imageSrc ? (
          <img src={imageSrc} alt={product.name} className="product-card-img" />
        ) : (
          <span className="product-card-no-image">No image</span>
        )}
      </div>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title h6 mb-2 product-card-title">
          {product.name}
        </h5>

        <p className="card-text small flex-grow-1 product-card-description">
          {product.description}
        </p>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="product-card-price">
            £{parseFloat(product.price_gbp).toFixed(2)}
          </span>
          <button
            className="btn btn-sm product-card-add-btn"
            onClick={handleAddClick}
          >
            Add to basket
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
