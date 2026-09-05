import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useBasket } from "./BasketContext";

function OrderSuccessPage() {
  const { clearBasket } = useBasket();

  useEffect(() => {
    clearBasket();
  }, []);

  return (
    <div className="container my-5 text-center py-5">
      <div className="card shadow-sm p-5 mx-auto" style={{ maxWidth: "600px" }}>
        <h2 className="text-success mb-3">✓ Payment Successful!</h2>
        <p className="lead">
          Thank you for your order with Loveday Auto Repairs.
        </p>
        <p className="text-muted">
          A confirmation email has been sent to your email address.
        </p>

        <div className="border rounded p-3 bg-light my-4">
          <h6>Collection & Fitting Note</h6>
          <p className="small mb-0">
            If you ordered items requiring fitting or MOT/Service appointments,
            you can schedule your slot below.
          </p>
        </div>

        <div className="d-flex justify-content-center gap-3">
          <Link to="/shop" className="btn btn-outline-primary">
            Return to Shop
          </Link>
          <Link to="/UserDashboard" className="btn btn-primary">
            Book Appointment Slot
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
