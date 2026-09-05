import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyEmail } from "./ApiService";
import "./VerifyEmail.css";

function VerifyEmail() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided.");
        return;
      }

      try {
        const data = await verifyEmail(token);

        if (data.success) {
          navigate("/RegisteredPage");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed. Please try again.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "An error occurred during verification.");
      }
    };

    verifyToken();
  }, [location, navigate]);

  const handleRegisterClick = () => {
    navigate("/");
  };

  return (
    <div className="container text-center verify-email-container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6">
          {status === "loading" && (
            <>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Verifying your email address...</p>
            </>
          )}

          {status === "error" && (
            <>
              <p>{message}</p>
              <div className="button-wrapper">
                <button className="btn-secondary" onClick={handleRegisterClick}>
                  Go to home page
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
