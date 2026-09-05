import React, { useState, useEffect, useCallback } from "react";
import "./CustomerBookingsList.css";
import { customerBookingsList } from "./ApiService";
import CustomerCancelBooking from "./CustomerCancelBooking";

function CustomerBookingsList() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      const response = await customerBookingsList();
      if (response.status === "success") {
        setUpcoming(response.upcoming);
        setPast(response.past);
      } else {
        setError(response.message || "Could not load bookings.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();

    const handleBookingUpdate = () => {
      fetchBookings();
    };

    window.addEventListener("bookingUpdated", handleBookingUpdate);
    return () => {
      window.removeEventListener("bookingUpdated", handleBookingUpdate);
    };
  }, [fetchBookings]);

  const handleBookingCancelled = () => {
    fetchBookings();

    window.dispatchEvent(new CustomEvent("bookingUpdated"));
  };

  if (loading) {
    return <div className="text-muted my-3">Loading your bookings...</div>;
  }

  if (error) {
    return <div className="alert alert-danger my-3">{error}</div>;
  }

  const renderBookingCard = (booking, isUpcoming) => (
    <div key={booking.appointment_id} className="booking-card">
      <div className="booking-card-header">
        <span className="booking-date">
          {booking.date} ({booking.start_time.slice(0, 5)} -{" "}
          {booking.end_time.slice(0, 5)})
        </span>
        <span className={isUpcoming ? "badge-upcoming" : "badge-past"}>
          {isUpcoming ? "Upcoming" : "Past"}
        </span>
      </div>

      <div className="booking-card-body">
        {booking.service_name && (
          <div className="booking-detail-item">
            <strong>Service:</strong> {booking.service_name}
          </div>
        )}

        {booking.vehicle_reg && (
          <div className="booking-detail-item">
            <strong>Vehicle Reg:</strong> {booking.vehicle_reg}
          </div>
        )}

        {booking.notes && (
          <div className="booking-detail-item">
            <strong>Notes:</strong> {booking.notes}
          </div>
        )}

        {isUpcoming && (
          <CustomerCancelBooking
            appointmentId={booking.appointment_id}
            onBookingCancelled={handleBookingCancelled}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="customer-bookings-container">
      <div className="bookings-section">
        <h5 className="text-primary mb-3">Your Future Appointments</h5>
        {upcoming.length === 0 ? (
          <p className="text-muted small">
            No upcoming appointments scheduled.
          </p>
        ) : (
          upcoming.map((b) => renderBookingCard(b, true))
        )}
      </div>

      <div className="bookings-section">
        <h5 className="text-secondary mb-3">You Past Appointments</h5>
        {past.length === 0 ? (
          <p className="text-muted small">No past appointments found.</p>
        ) : (
          past.map((b) => renderBookingCard(b, false))
        )}
      </div>
    </div>
  );
}

export default CustomerBookingsList;
