import React, { useState } from "react";
import "./UserRegistration.css";
import { useNavigate } from "react-router-dom";
import { registerUser } from "./ApiService";

function UserRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const clearErrorMessageAfterDelay = () => {
    setTimeout(() => {
      setErrorMessage("");
    }, 5000);
  };

  const clearSuccessMessageAfterDelay = () => {
    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(formData.email)) {
      setErrorMessage(
        "Please enter a valid email address (for example, name@domain.com).",
      );
      clearErrorMessageAfterDelay();
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage("Please choose a password with at least 8 characters.");
      clearErrorMessageAfterDelay();
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser(formData);
      if (data.success) {
        setSuccessMessage(
          "You're almost there! Please check your email for a link to confirm your address and complete sign-in.",
        );
        clearSuccessMessageAfterDelay();

        setFormData({ email: "", password: "" });
        setErrorMessage("");
      } else {
        setErrorMessage(
          data.message ||
            "We couldn’t complete your registration just now. Please try again.",
        );
        clearErrorMessageAfterDelay();

        setFormData({ email: "", password: "" });
      }
    } catch (error) {
      setErrorMessage(error.message);
      clearErrorMessageAfterDelay();

      setFormData({ email: "", password: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container container">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-lg-3">
          <div className="user-registration-wrapper">
            <form className="row g-2" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <input
                  autoComplete="off"
                  type="email"
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Email address"
                />
              </div>
              <div className="form-group">
                <input
                  autoComplete="off"
                  type="password"
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                  placeholder="Choose a strong password"
                />
              </div>
              {successMessage && (
                <div id="success-message">{successMessage}</div>
              )}
              {errorMessage && <div id="error-message">{errorMessage}</div>}
              <button type="submit" className="btn btn-secondary">
                {loading ? "Registering" : "Register"}
                <span
                  className="spinner-border spinner-border-sm ms-2"
                  role="status"
                  aria-hidden="true"
                  id="spinnerRegister"
                  style={{ display: loading ? "inline-block" : "none" }}
                ></span>
              </button>
              <div id="registerPlaceholder"></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserRegistration;
