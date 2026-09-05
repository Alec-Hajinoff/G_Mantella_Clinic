import React from "react";

function OrderSummaryPanel({
  items,
  subtotal,
  deliveryFee = 0,
  isDelivery = false,
}) {
  const total = subtotal + (isDelivery ? deliveryFee : 0);

  return (
    <div className="card bg-light">
      <div className="card-body">
        <h5 className="card-title mb-3">Order Summary</h5>
        <div className="mb-3">
          {items.map((item) => (
            <div
              key={item.id || item.product_id}
              className="d-flex justify-content-between small mb-1"
            >
              <span>
                {item.name} (x{item.quantity})
              </span>
              <span>
                £
                {(
                  parseFloat(item.price_gbp || item.unit_amount / 100) *
                  item.quantity
                ).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <hr />
        <div className="d-flex justify-content-between mb-1">
          <span>Subtotal</span>
          <span>£{subtotal.toFixed(2)}</span>
        </div>
        {isDelivery && (
          <div className="d-flex justify-content-between mb-1 text-muted">
            <span>Delivery Fee</span>
            <span>£{deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <hr />
        <div className="d-flex justify-content-between fw-bold fs-5">
          <span>Total</span>
          <span className="text-success">£{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default OrderSummaryPanel;
