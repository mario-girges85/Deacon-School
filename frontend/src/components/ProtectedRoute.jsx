import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, isAdmin } from "../util/auth";

// Usage:
// <ProtectedRoute requireAdmin element={<Users />} />
// <ProtectedRoute requireAuth element={<Profile />} />

const ProtectedRoute = ({
  element,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = "/",
}) => {
  // Quick synchronous checks from token to avoid rendering flicker
  if (requireAuth && !isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && !isAdmin()) {
    return <Navigate to={redirectTo} replace />;
  }
  return element;
};

export default ProtectedRoute;
