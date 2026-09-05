import React from "react";
import QuantityStepper from "./QuantityStepper";

function BasketItemRow({ item, onUpdateQuantity, onRemove }) {
  const lineTotal = parseFloat(item.price_gbp) * item.quantity;

  return (
    <tr className="align-middle">
      <td>
        <div className="fw-bold">{item.name}</div>
        <small className="text-muted text-capitalize">{item.type}</small>
      </td>
      <td>£{parseFloat(item.price_gbp).toFixed(2)}</td>
      <td>
        <QuantityStepper
          quantity={item.quantity}
          onIncrease={() => onUpdateQuantity(item.id, item.quantity + 1)}
          onDecrease={() => onUpdateQuantity(item.id, item.quantity - 1)}
        />
      </td>
      <td className="fw-bold">£{lineTotal.toFixed(2)}</td>
      <td>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => onRemove(item.id)}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

export default BasketItemRow;
