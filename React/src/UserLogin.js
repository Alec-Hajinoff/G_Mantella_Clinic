import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserLogin.css";
import { loginUser, passwordResetLink } from "./ApiService";

function UserLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const [unverifiedMessage, setUnverifiedMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

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

  const clearUnverifiedMessageAfterDelay = () => {
    setTimeout(() => {
      setUnverifiedMessage("");
    }, 5000);
  };

  const clearResetMessageAfterDelay = () => {
    setTimeout(() => {
      setResetMessage("");
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(formData.email)) {
      setErrorMessage(
        "Please enter a valid email address (for example, name@domain.com).",
      );
      clearErrorMessageAfterDelay();
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage(
        "Please ensure your password is at least 8 characters long.",
      );
      clearErrorMessageAfterDelay();
      setLoading(false);
      return;
    }

    setErrorMessage("");
    setUnverifiedMessage("");

    try {
      const data = await loginUser(formData);
      if (data.status === "success") {
        if (data.role === "customer") {
          navigate("/UserDashboard");
        } else {
          navigate("/AdminDashboard");
        }
      } else if (data.status === "unverified") {
        setUnverifiedMessage(data.message);
        clearUnverifiedMessageAfterDelay();
        setFormData({ password: "" });
      } else {
        setErrorMessage(
          data.message ||
            "We couldn’t sign you in at the moment. Please check your details and try again.",
        );
        clearErrorMessageAfterDelay();
        setFormData({ password: "" });
      }
    } catch (error) {
      setErrorMessage(error.message);
      clearErrorMessageAfterDelay();
      setFormData({ password: "" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailInput = document.getElementById("yourEmailLogin");
    const email = emailInput ? emailInput.value : formData.email;

    if (!email || !email.trim()) {
      setErrorMessage(
        "Please enter your email address so we can help you reset your password.",
      );
      clearErrorMessageAfterDelay();
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      await passwordResetLink(email);
      setResetMessage(
        "If an account exists for this email address, a password reset link has been sent.",
      );
      clearResetMessageAfterDelay();
    } catch (error) {
      setResetMessage(
        "If an account exists for this email address, a password reset link has been sent.",
      );
      clearResetMessageAfterDelay();
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page-container container">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-lg-3">
          <div className="user-login-wrapper">
            <form className="row g-2" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <input
                  autoComplete="off"
                  type="email"
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                  className="form-control"
                  id="yourEmailLogin"
                  name="email"
                  required
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <input
                  autoComplete="off"
                  type="password"
                  className="form-control"
                  id="yourPasswordLogin"
                  name="password"
                  required
                  minLength="8"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {unverifiedMessage && (
                <div
                  id="unverified-message"
                  className="error-message"
                  aria-live="polite"
                >
                  {unverifiedMessage}
                </div>
              )}

              {errorMessage && (
                <div
                  id="error-message-one"
                  className="error-message"
                  aria-live="polite"
                >
                  {errorMessage}
                </div>
              )}
              {resetMessage && (
                <div
                  id="reset-message"
                  className="reset-message"
                  aria-live="polite"
                >
                  {resetMessage}
                </div>
              )}
              <button type="submit" className="btn btn-secondary" id="loginBtn">
                Login
                <span
                  className="spinner-border spinner-border-sm ms-2"
                  role="status"
                  aria-hidden="true"
                  id="spinnerLogin"
                  style={{ display: loading ? "inline-block" : "none" }}
                ></span>
              </button>
              <div className="forgot-password-link-container">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                >
                  Forgot your password?
                  {resetLoading && (
                    <span
                      className="spinner-border spinner-border-sm ms-2"
                      role="status"
                      aria-hidden="true"
                      id="spinnerReset"
                    ></span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserLogin;
