import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerDeleteAccount.css";
import { customerDeleteAccount } from "./ApiService";

function CustomerDeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInitialClick = () => {
    setConfirming(true);
  };

  const handleAbort = () => {
    setConfirming(false);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      const response = await customerDeleteAccount();
      if (response.status === "success") {
        navigate("/");
      } else {
        alert(response.message || "Could not delete account.");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-account-card">
      <div className="delete-account-header">
        <h5>Delete Account</h5>
        <p>
          Deleting your account will remove your personal information. This
          action cannot be undone.
        </p>
      </div>

      {!confirming ? (
        <button
          type="button"
          className="btn-delete-initial"
          onClick={handleInitialClick}
        >
          Delete My Account
        </button>
      ) : (
        <div className="delete-confirm-box">
          <span>Are you sure you want to permanently delete your account?</span>
          <button
            type="button"
            className="btn-confirm-delete"
            onClick={handleConfirmDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Yes, Delete Account"}
          </button>
          <button
            type="button"
            className="btn-abort-delete"
            onClick={handleAbort}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomerDeleteAccount;
