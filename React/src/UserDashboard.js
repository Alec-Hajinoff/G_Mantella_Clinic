import React, { useState } from "react";
import "./UserDashboard.css";
import LogoutComponent from "./LogoutComponent";
import BookingCalendar from "./BookingCalendar";
import CustomerBookingsList from "./CustomerBookingsList";
import CustomerProfile from "./CustomerProfile";
import CustomerDeleteAccount from "./CustomerDeleteAccount";

function UserDashboard() {
  const [activeTab, setActiveTab] = useState("book-service");

  return (
    <div className="user-dashboard-container container">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9">
          <div className="admin-header">
            <p>
              Welcome to your dashboard. Here you can book and track your
              appointments and manage your account.
            </p>
          </div>

          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "book-service" ? "active" : ""}`}
                onClick={() => setActiveTab("book-service")}
              >
                Book a Service
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "my-bookings" ? "active" : ""}`}
                onClick={() => setActiveTab("my-bookings")}
              >
                My Bookings
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "account" ? "active" : ""}`}
                onClick={() => setActiveTab("account")}
              >
                Account
              </button>
            </li>
          </ul>

          {activeTab === "book-service" && (
            <div className="tab-pane-content">
              <BookingCalendar />
            </div>
          )}

          {activeTab === "my-bookings" && (
            <div className="tab-pane-content">
              <CustomerBookingsList />
            </div>
          )}

          {activeTab === "account" && (
            <div className="tab-pane-content">
              <CustomerProfile />
              <div className="mt-4">
                <CustomerDeleteAccount />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
