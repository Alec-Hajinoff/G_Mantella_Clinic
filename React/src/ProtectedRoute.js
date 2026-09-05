import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkSession } from "./ApiService";

const ProtectedRoute = ({ children }) => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await checkSession();
        setAuth(data.authenticated === true);
      } catch (error) {
        setAuth(false);
      }
    };

    verify();
  }, []);

  if (auth === null) return null;

  return auth ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
