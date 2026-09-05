import React from "react";
import HeroSection from "./HeroSection";
import ShopPage from "./ShopPage";
import BookingCallToAction from "./BookingCallToAction";

import "./Main.css";

function Main({ isAuthenticated, userRole, isLoading }) {
  return (
    <div className="overflow-hidden">
      <div>
        <HeroSection />
      </div>

      <div className="container text-center">
        <div className="row">
          <div className="col-12">
            <div className="main-container">
              <div>
                <BookingCallToAction
                  isAuthenticated={isAuthenticated}
                  userRole={userRole}
                  isLoading={isLoading}
                />
              </div>

              <section className="hero">
                <h2 className="hero-title">Our Products</h2>
              </section>

              <div className="intro-section">
                <ShopPage />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
