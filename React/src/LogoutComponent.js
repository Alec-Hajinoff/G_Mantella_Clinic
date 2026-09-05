import React from "react";
import { useNavigate } from "react-router-dom";
import "./LogoutComponent.css";
import { logoutUser } from "./ApiService";

const LogoutComponent = ({ onLogoutComplete }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
      if (onLogoutComplete) {
        onLogoutComplete();
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <button onClick={handleLogout} className="btn-text">
      Logout
    </button>
  );
};

export default LogoutComponent;
