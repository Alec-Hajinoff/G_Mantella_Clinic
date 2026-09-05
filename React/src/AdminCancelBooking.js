import React, { useState } from "react";
import "./AdminCancelBooking.css";
import { adminCancelBooking } from "./ApiService";

function AdminCancelBooking({ appointmentId, onBookingCancelled }) {
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
      const response = await adminCancelBooking(appointmentId);
      if (response.status === "success") {
        window.dispatchEvent(new CustomEvent("bookingUpdated"));

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
    <div className="admin-cancel-booking-container">
      {!confirming ? (
        <button
          type="button"
          className="admin-btn-cancel-initial"
          onClick={handleFirstClick}
        >
          Cancel Booking
        </button>
      ) : (
        <div className="admin-cancel-confirm-box">
          <p className="admin-cancel-confirm-text">
            Cancel this customer booking?
          </p>
          <button
            type="button"
            className="admin-btn-confirm-cancel"
            onClick={handleSecondClick}
            disabled={loading}
          >
            {loading ? "Cancelling..." : "Yes, Cancel"}
          </button>
          <button
            type="button"
            className="admin-btn-abort-cancel"
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

export default AdminCancelBooking;
