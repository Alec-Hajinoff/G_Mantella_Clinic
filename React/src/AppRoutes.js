import { Routes, Route } from "react-router-dom";
import MainRegLog from "./MainRegLog";
import RegisteredPage from "./RegisteredPage";
import UserDashboard from "./UserDashboard";
import LogoutComponent from "./LogoutComponent";
import VerifyEmail from "./VerifyEmail";
import PasswordReset from "./PasswordReset";
import AdminDashboard from "./AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";
import UserLogin from "./UserLogin";
import UserRegistration from "./UserRegistration";

import ShopPage from "./ShopPage";
import ProductDetailPage from "./ProductDetailPage";
import BasketPage from "./BasketPage";
import CheckoutPage from "./CheckoutPage";
import OrderSuccessPage from "./OrderSuccessPage";

import React from "react";

export default function AppRoutes({ isAuthenticated, userRole, isLoading }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainRegLog
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            isLoading={isLoading}
          />
        }
      />
      <Route path="/UserLogin" element={<UserLogin />} />
      <Route path="/UserRegistration" element={<UserRegistration />} />
      <Route path="/RegisteredPage" element={<RegisteredPage />} />
      <Route path="/LogoutComponent" element={<LogoutComponent />} />
      <Route path="/VerifyEmail" element={<VerifyEmail />} />
      <Route path="/PasswordReset" element={<PasswordReset />} />

      <Route path="/shop" element={<ShopPage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/basket" element={<BasketPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order/success" element={<OrderSuccessPage />} />

      <Route
        path="/UserDashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/AdminDashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
