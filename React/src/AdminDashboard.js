import React, { useState } from "react";
import "./AdminDashboard.css";
import LogoutComponent from "./LogoutComponent";
import BusinessHoursManager from "./BusinessHoursManager";
import ServiceManager from "./ServiceManager";

import AdminBookingsList from "./AdminBookingsList";
import AdminBookingCalendar from "./AdminBookingCalendar";
import AvailabilityHorizonExtender from "./AvailabilityHorizonExtender";
import AdminProductEntry from "./AdminProductEntry";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("bookings");

  const [refreshProducts, setRefreshProducts] = useState(0);

  const handleProductAdded = () => {
    setRefreshProducts((prev) => prev + 1);
  };

  return (
    <div className="admin-container container">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9">
          <div className="admin-header">
            <p>
              Welcome to your admin dashboard. Here you can manage bookings,
              business hours, services, and inventory.
            </p>
          </div>

          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "bookings" ? "active" : ""}`}
                onClick={() => setActiveTab("bookings")}
              >
                Bookings & Calendar
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "products" ? "active" : ""}`}
                onClick={() => setActiveTab("products")}
              >
                Products & Services
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "availability" ? "active" : ""}`}
                onClick={() => setActiveTab("availability")}
              >
                Appointment Availability
              </button>
            </li>
          </ul>

          {activeTab === "bookings" && (
            <div className="tab-pane-content">
              <AdminBookingsList />
              <AdminBookingCalendar />
            </div>
          )}

          {activeTab === "products" && (
            <div className="tab-pane-content">
              <ServiceManager />
              <div className="mt-4">
                <AdminProductEntry onProductAdded={handleProductAdded} />
              </div>
            </div>
          )}

          {activeTab === "availability" && (
            <div className="tab-pane-content">
              <BusinessHoursManager />
              <div className="mt-4">
                <AvailabilityHorizonExtender />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
