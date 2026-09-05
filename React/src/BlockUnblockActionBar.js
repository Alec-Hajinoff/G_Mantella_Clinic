import React, { useState } from "react";
import "./BlockUnblockActionBar.css";
import { blockUnblockActionBar } from "./ApiService";

function BlockUnblockActionBar({
  selectedSlots,
  onActionCompleted,
  onClearSelection,
}) {
  const [loading, setLoading] = useState(false);

  if (!selectedSlots || selectedSlots.length === 0) {
    return null;
  }

  const handleToggleSlots = async (actionTarget = null) => {
    setLoading(true);
    try {
      const slotIds = selectedSlots.map((s) => s.id);
      const response = await blockUnblockActionBar(slotIds, actionTarget);

      if (response.status === "success") {
        window.dispatchEvent(new CustomEvent("bookingUpdated"));
        if (onActionCompleted) {
          onActionCompleted();
        }
      } else {
        alert(response.message || "Failed to update slots.");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasBlocked = selectedSlots.some((s) => s.status === "blocked");
  const hasAvailable = selectedSlots.some((s) => s.status === "available");

  return (
    <div className="block-unblock-action-bar">
      <span className="block-unblock-bar-text">
        {selectedSlots.length} {selectedSlots.length === 1 ? "slot" : "slots"}{" "}
        selected
      </span>
      <div className="block-unblock-btn-group">
        {(!hasBlocked || (hasBlocked && hasAvailable)) && (
          <button
            type="button"
            className="btn btn-warning btn-sm"
            onClick={() => handleToggleSlots("block")}
            disabled={loading}
          >
            {loading ? "Updating..." : "Block Selected Slots"}
          </button>
        )}
        {(hasBlocked || (!hasBlocked && !hasAvailable)) && (
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={() => handleToggleSlots("unblock")}
            disabled={loading}
          >
            {loading ? "Updating..." : "Unblock Selected Slots"}
          </button>
        )}
        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={onClearSelection}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default BlockUnblockActionBar;
