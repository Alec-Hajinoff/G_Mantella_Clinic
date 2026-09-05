import React from "react";
import { Link } from "react-router-dom";
import { useBasket } from "./BasketContext";
import "./BasketWidget.css";

function BasketWidget() {
  const {
    basket,
    basketCount,
    basketSubtotal,
    isDrawerOpen,
    setIsDrawerOpen,
    removeFromBasket,
  } = useBasket();

  return (
    <div className="position-relative">
      <button
        className="basket-btn position-relative"
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
      >
        🛒 Basket
        {basketCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {basketCount}
          </span>
        )}
      </button>

      {isDrawerOpen && (
        <div
          className="card position-absolute end-0 mt-2 shadow-lg z-3"
          style={{ width: "320px" }}
        >
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="m-0">Your Basket ({basketCount})</h6>
            <button
              className="btn-close"
              onClick={() => setIsDrawerOpen(false)}
            ></button>
          </div>
          <div
            className="card-body overflow-auto"
            style={{ maxHeight: "250px" }}
          >
            {basket.length === 0 ? (
              <p className="text-muted text-center my-3">
                Your basket is empty
              </p>
            ) : (
              basket.map((item) => (
                <div
                  key={item.id}
                  className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom"
                >
                  <div>
                    <div className="fw-bold small">{item.name}</div>
                    <div className="text-muted small">
                      {item.quantity} x £{parseFloat(item.price_gbp).toFixed(2)}
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-link text-danger p-0"
                    onClick={() => removeFromBasket(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          {basket.length > 0 && (
            <div className="card-footer">
              <div className="d-flex justify-content-between fw-bold mb-2">
                <span>Subtotal:</span>
                <span>£{basketSubtotal.toFixed(2)}</span>
              </div>
              <div className="d-grid gap-2">
                <Link
                  to="/basket"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  View basket / Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BasketWidget;
