import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./BookingCallToAction.css";

function BookingCallToAction({ isAuthenticated, userRole, isLoading }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleBookingClick = (e) => {
    e.preventDefault();

    if (isLoading) return;

    if (isAuthenticated) {
      if (userRole === "customer") {
        navigate("/UserDashboard");
      } else {
        navigate("/AdminDashboard");
      }
    } else {
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="booking-cta-container">
      <div className="booking-cta-card">
        <div className="booking-cta-card-body">
          <div className="booking-cta-calendar-placeholder">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="currentColor"
              className="bi bi-calendar-check booking-cta-icon"
              viewBox="0 0 16 16"
            >
              <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
            </svg>
          </div>
          <h3 className="booking-cta-title">Need a Garage Appointment?</h3>
          <p className="booking-cta-text">
            Book your slot online for MOT, servicing, or repairs at Loveday
            Auto.
          </p>
          <button
            onClick={handleBookingClick}
            className="btn btn-primary btn-lg booking-cta-btn"
            disabled={isLoading}
          >
            {isLoading ? "Checking session..." : "Book an Appointment"}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="booking-cta-modal-backdrop" onClick={closeModal}>
          <div
            className="booking-cta-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="booking-cta-modal-header">
              <h5 className="booking-cta-modal-title">Sign In Required</h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeModal}
                aria-label="Close"
              ></button>
            </div>
            <div className="booking-cta-modal-body">
              <p>
                Please log in or sign up for an account to schedule your
                appointment slot.
              </p>
            </div>

            <div className="booking-cta-modal-footer flex-column flex-sm-row">
              <Link
                to="/UserLogin"
                className="btn btn-primary"
                onClick={closeModal}
              >
                Log In
              </Link>
              <Link
                to="/UserRegistration"
                className="btn btn-outline-secondary"
                onClick={closeModal}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingCallToAction;
