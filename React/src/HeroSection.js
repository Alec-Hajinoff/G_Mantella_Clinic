import React from "react";
import "./HeroSection.css";

function HeroSection() {
  return (
    <section className="hero-section-wrapper">
      <div className="container text-center">
        <div className="row">
          <div className="col-12">
            <div className="hero-content">
              <h1 className="hero-heading">
                Professional vehicle servicing and repairs from a trusted local
                garage.
              </h1>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
