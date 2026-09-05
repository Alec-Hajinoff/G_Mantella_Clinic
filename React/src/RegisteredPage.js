import React from "react";
import "./RegisteredPage.css";
import UserLogin from "./UserLogin.js";

function RegisteredPage() {
  return (
    <div className="registered-page-wrapper">
      <div className="container text-center">
        <div className="row">
          <div className="col-12 text-center my-4">
            <p className="w-100 whitespace-nowrap">
              Thank you for verifying your email address! Please log in using
              your credentials.
            </p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-12 col-lg-3">
            <p className="registered-section-divider">Registered user login:</p>
          </div>
        </div>
        <div>
          <UserLogin />
        </div>
      </div>
    </div>
  );
}

export default RegisteredPage;
