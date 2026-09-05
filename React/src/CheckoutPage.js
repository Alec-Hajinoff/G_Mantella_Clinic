import React, { useState } from "react";
import { useBasket } from "./BasketContext";
import { checkoutSessionCreate } from "./ApiService";
import OrderSummaryPanel from "./OrderSummaryPanel";

function CheckoutPage() {
  const { basket, basketSubtotal } = useBasket();
  const [fulfillment, setFulfillment] = useState("collection");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    postcode: "",
  });

  const deliveryFee = 5.0;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const items = basket.map((item) => ({
        stripe_price_id: item.stripe_price_id,
        quantity: item.quantity,
      }));

      const response = await checkoutSessionCreate({
        items,
        fulfillment,
        customer_details: formData,
        delivery_fee: fulfillment === "delivery" ? deliveryFee : 0,
      });

      if (response.status === "success" && response.url) {
        window.location.href = response.url;
      } else {
        setError(response.message || "Failed to process checkout.");
      }
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (basket.length === 0) {
    return (
      <div className="container my-5 text-center">
        <h4>No items in basket to checkout.</h4>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4">Checkout</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-lg-7">
            <h5 className="mb-3">1. Contact Information</h5>
            <div className="row g-3">
              <div className="col-sm-6">
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  placeholder="First Name"
                  required
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-sm-6">
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  placeholder="Last Name"
                  required
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-sm-6">
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Email Address"
                  required
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-sm-6">
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  placeholder="Phone Number"
                  required
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <h5 className="mb-3 mt-4">2. Fulfillment Option</h5>
            <div className="btn-group w-100 mb-3" role="group">
              <input
                type="radio"
                className="btn-check"
                name="fulfillment"
                id="coll"
                value="collection"
                checked={fulfillment === "collection"}
                onChange={() => setFulfillment("collection")}
              />
              <label className="btn btn-outline-primary" htmlFor="coll">
                Garage Collection (Free)
              </label>

              <input
                type="radio"
                className="btn-check"
                name="fulfillment"
                id="deliv"
                value="delivery"
                checked={fulfillment === "delivery"}
                onChange={() => setFulfillment("delivery")}
              />
              <label className="btn btn-outline-primary" htmlFor="deliv">
                Local Delivery (£5.00)
              </label>
            </div>

            {fulfillment === "delivery" && (
              <div className="row g-3 border rounded p-3 bg-light">
                <h6>Delivery Address</h6>
                <div className="col-12">
                  <input
                    type="text"
                    name="addressLine1"
                    className="form-control"
                    placeholder="Address Line 1"
                    required
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-sm-6">
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    placeholder="City"
                    required
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-sm-6">
                  <input
                    type="text"
                    name="postcode"
                    className="form-control"
                    placeholder="Postcode"
                    required
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-5">
            <OrderSummaryPanel
              items={basket}
              subtotal={basketSubtotal}
              deliveryFee={deliveryFee}
              isDelivery={fulfillment === "delivery"}
            />
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 mt-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Redirecting to Stripe..." : "Pay with Stripe"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CheckoutPage;
