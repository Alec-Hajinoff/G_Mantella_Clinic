import React, { useState } from "react";
import "./CustomerCancelBooking.css";
import { customerCancelBooking } from "./ApiService";

function CustomerCancelBooking({ appointmentId, onBookingCancelled }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFirstClick = () => {
    setConfirming(true);
  };

  const handleCancelConfirmation = () => {
    setConfirming(false);
  };

  const handleSecondClick = async () => {
    setLoading(true);
    try {
      const response = await customerCancelBooking(appointmentId);
      if (response.status === "success") {
        if (onBookingCancelled) {
          onBookingCancelled();
        }
      } else {
        alert(response.message || "Failed to cancel booking.");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cancel-booking-container">
      {!confirming ? (
        <button
          type="button"
          className="btn-cancel-initial"
          onClick={handleFirstClick}
        >
          Cancel Booking
        </button>
      ) : (
        <div className="cancel-confirm-box">
          <p className="cancel-confirm-text">Are you sure?</p>
          <button
            type="button"
            className="btn-confirm-cancel"
            onClick={handleSecondClick}
            disabled={loading}
          >
            {loading ? "Cancelling..." : "Yes, Cancel"}
          </button>
          <button
            type="button"
            className="btn-abort-cancel"
            onClick={handleCancelConfirmation}
            disabled={loading}
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomerCancelBooking;
