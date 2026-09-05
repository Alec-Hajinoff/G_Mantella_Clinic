import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PasswordReset.css";
import { passwordResetToken, updatePassword } from "./ApiService";

function PasswordReset() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const [tokenStatus, setTokenStatus] = useState({
    isValid: false,
    checking: true,
    message: "",
  });
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenStatus({
          isValid: false,
          checking: false,
          message:
            "This password reset link is no longer valid. For security reasons, links can only be used once and are time-limited.\n\nIf you need any assistance, please contact me at alec@hertfordstandard.com.",
        });
        return;
      }
      try {
        const data = await passwordResetToken(token);

        if (data.valid) {
          setTokenStatus({
            isValid: true,
            checking: false,
            message: "",
          });
        } else {
          setTokenStatus({
            isValid: false,
            checking: false,
            message:
              data.message ||
              "This password reset link is no longer valid. For security reasons, links can only be used once and are time-limited.\n\nIf you need any assistance, please contact me at alec@hertfordstandard.com.",
          });
        }
      } catch (error) {
        setTokenStatus({
          isValid: false,
          checking: false,
          message:
            "This password reset link is no longer valid. For security reasons, links can only be used once and are time-limited.\n\nIf you need any assistance, please contact me at alec@hertfordstandard.com.",
        });
      }
    };

    verifyToken();
  }, [token]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    if (formData.newPassword.length < 8) {
      setErrorMessage(
        "Please enter a password that is at least 8 characters long.",
      );
      clearErrorMessageAfterDelay();
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage(
        "The passwords you entered do not match. Please try again.",
      );
      clearErrorMessageAfterDelay();
      setLoading(false);
      return;
    }

    try {
      const data = await updatePassword(token, formData.newPassword);

      if (data.success) {
        setSuccessMessage(
          "Your password has been updated successfully.\nYou can now sign in using your new details.",
        );

        setPasswordUpdated(true);

        setFormData({
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setErrorMessage(
          data.message ||
            "We were unable to update your password at the moment. Please try again.",
        );
        clearErrorMessageAfterDelay();
      }
    } catch (error) {
      setErrorMessage(
        "Something went wrong while updating your password. Please try again shortly.",
      );
      clearErrorMessageAfterDelay();
    } finally {
      setLoading(false);
    }
  };

  const handleReturnHome = () => {
    navigate("/");
  };

  if (tokenStatus.checking) {
    return (
      <div className="password-reset-container text-center">
        <div className="password-reset-wrapper">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading, please wait...</span>
          </div>
          <p className="verifying-text">
            We are verifying your password reset link. Please wait...
          </p>
        </div>
      </div>
    );
  }

  if (!tokenStatus.isValid) {
    return (
      <div className="password-reset-container">
        <div className="password-reset-wrapper">
          <p className="password-reset-divider">Please reset your password</p>
          <div className="error token-error" aria-live="polite">
            {tokenStatus.message}
          </div>
          <div className="return-home-container">
            <button onClick={handleReturnHome} className="btn btn-secondary">
              Return to home page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="password-reset-container container">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-3">
          <div className="password-reset-wrapper">
            <p className="password-reset-divider">Please reset your password</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <input
                  autoComplete="off"
                  type="password"
                  className="form-control"
                  id="newPassword"
                  name="newPassword"
                  required
                  minLength="8"
                  placeholder="New password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={passwordUpdated}
                />
              </div>

              <div className="form-group">
                <input
                  autoComplete="off"
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minLength="8"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={passwordUpdated}
                />
              </div>

              {errorMessage && (
                <div
                  id="error-message"
                  className="error text-danger"
                  aria-live="polite"
                >
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div
                  id="success-message"
                  className="error success-message text-center"
                  aria-live="polite"
                >
                  {successMessage}
                  <div className="return-home-button-container">
                    <button
                      onClick={handleReturnHome}
                      className="btn btn-secondary return-home-button"
                    >
                      Return to home page
                    </button>
                  </div>
                </div>
              )}

              {!passwordUpdated && (
                <button
                  type="submit"
                  className="btn btn-secondary update-password-button"
                  disabled={loading}
                >
                  Update password
                  {loading && (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                      id="spinnerUpdate"
                    ></span>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;
