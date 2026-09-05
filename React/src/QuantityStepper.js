import React from "react";

function QuantityStepper({ quantity, onIncrease, onDecrease, disabled }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <button
        className="btn btn-outline-secondary btn-sm"
        type="button"
        disabled={disabled || quantity <= 1}
        onClick={onDecrease}
      >
        -
      </button>
      <span className="fw-bold px-2">{quantity}</span>
      <button
        className="btn btn-outline-secondary btn-sm"
        type="button"
        disabled={disabled}
        onClick={onIncrease}
      >
        +
      </button>
    </div>
  );
}

export default QuantityStepper;
