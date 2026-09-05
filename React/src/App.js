import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import Header from "./Header";
import Footer from "./Footer";
import AppRoutes from "./AppRoutes";
import NavigationBar from "./NavigationBar";
import "./App.css";

import { checkSession } from "./ApiService";
import { BasketProvider } from "./BasketContext";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  const verifySession = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await checkSession();
      setIsAuthenticated(result.authenticated);
      setUserRole(result.role || null);
    } catch (error) {
      console.error("Session check failed:", error);
      setIsAuthenticated(false);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [location.pathname, verifySession]);

  return (
    <div className="app-layout">
      <Header
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        onLogoutComplete={verifySession}
      />

      <NavigationBar isAuthenticated={isAuthenticated} userRole={userRole} />

      <main className="app-main-content">
        <AppRoutes
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          isLoading={isLoading}
        />
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <BasketProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </BasketProvider>
  );
}

export default App;
