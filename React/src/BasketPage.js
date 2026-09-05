import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBasket } from "./BasketContext";
import BasketItemRow from "./BasketItemRow";
import OrderSummaryPanel from "./OrderSummaryPanel";

function BasketPage() {
  const { basket, updateQuantity, removeFromBasket, basketSubtotal } =
    useBasket();
  const navigate = useNavigate();

  if (basket.length === 0) {
    return (
      <div className="container my-5 text-center py-5">
        <h3>Your basket is empty</h3>
        <p className="text-muted">
          Looks like you haven't added any products or services yet.
        </p>
        <Link to="/shop" className="btn btn-primary mt-3">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4">Shopping Basket</h2>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="table-responsive">
            <table className="table table-hover border">
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {basket.map((item) => (
                  <BasketItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromBasket}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between mt-3">
            <Link to="/shop" className="btn btn-outline-secondary">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        <div className="col-lg-4">
          <OrderSummaryPanel items={basket} subtotal={basketSubtotal} />
          <button
            className="btn btn-success w-100 btn-lg mt-3"
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default BasketPage;
