import React, { useState } from "react";
import "./AvailabilityHorizonExtender.css";
import { availabilityHorizonExtender } from "./ApiService";

function AvailabilityHorizonExtender() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [statusType, setStatusType] = useState("info");

  const handleExtendHorizon = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await availabilityHorizonExtender();
      if (response.status === "success") {
        setStatusType("success");
        setMessage(
          response.message ||
            "Extended availability slots by 3 additional months.",
        );

        window.dispatchEvent(new CustomEvent("bookingUpdated"));
      } else {
        setStatusType("danger");
        setMessage(response.message || "Failed to extend availability slots.");
      }
    } catch (err) {
      setStatusType("danger");
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card availability-horizon-card mt-4 mb-4">
      <div className="card-body">
        <h5 className="availability-horizon-title mb-2">
          Extend Appointment Horizon
        </h5>
        <p className="availability-horizon-text mb-3">
          Generate 3 additional months of appointment slots based on current
          business hours, starting from the end of the existing schedule
          horizon.
        </p>

        {message && (
          <div className={`alert alert-${statusType} py-2 mb-3`} role="alert">
            {message}
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleExtendHorizon}
          disabled={loading}
        >
          {loading
            ? "Generating Slots..."
            : "Generate 3 Additional Months of Slots"}
        </button>
      </div>
    </div>
  );
}

export default AvailabilityHorizonExtender;
