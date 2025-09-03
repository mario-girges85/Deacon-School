import React from "react";

/**
 * Frontend Authentication Utilities
 * Handles token management, verification, and role checking
 */

/**
 * Get token from localStorage
 * @returns {string|null} - JWT token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem("token");
};

/**
 * Set token in localStorage
 * @param {string} token - JWT token to store
 */
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem("token");
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} - True if token exists
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

/**
 * Verify JWT token (client-side only - for display purposes)
 * @param {string} token - JWT token to verify
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    if (!token) return null;

    // Split token and get payload part
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode base64 payload
    const payload = parts[1];
    const decodedPayload = JSON.parse(atob(payload));

    return decodedPayload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
};

/**
 * Decode JWT token without verification (client-side only)
 * @param {string} token - JWT token to decode
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Convert base64url -> base64 and add padding
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    if (pad) payload += "=".repeat(4 - pad);
    const json = atob(payload);
    return JSON.parse(json);
  } catch (_) {
    // Silent fallback; return null so callers can use stored user
    return null;
  }
};

/**
 * Get current user info from token
 * @returns {object|null} - User object with id, phone, code, or null if no token
 */
export const getCurrentUser = () => {
  const token = getToken();
  const decoded = decodeToken(token);
  if (decoded) return decoded;
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Check if user has specific role
 * @param {string} requiredRole - Role to check
 * @returns {boolean} - True if user has the required role
 */
export const hasRole = (requiredRole) => {
  const user = getCurrentUser();
  if (!user) return false;

  // Note: This checks the token payload, not the database
  // For security, always verify on the backend
  return user.role === requiredRole;
};

/**
 * Check if user has any of the specified roles
 * @param {string|array} requiredRoles - Single role or array of roles
 * @returns {boolean} - True if user has any of the required roles
 */
export const hasAnyRole = (requiredRoles) => {
  const user = getCurrentUser();
  if (!user) return false;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(user.role);
};

/**
 * Check if user has admin role
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = () => hasRole("admin");

/**
 * Check if user has teacher role
 * @returns {boolean} - True if user is teacher
 */
export const isTeacher = () => hasRole("teacher");

/**
 * Check if user has supervisor role
 * @returns {boolean} - True if user is supervisor
 */
export const isSupervisor = () => hasRole("supervisor");

/**
 * Check if user has student role
 * @returns {boolean} - True if user is student
 */
export const isStudent = () => hasRole("student");

/**
 * Get user's display name from token
 * @returns {string} - User's name or "User" if not available
 */
export const getUserDisplayName = () => {
  const user = getCurrentUser();
  return user?.name || "User";
};

/**
 * Check if token is expired (client-side check)
 * @returns {boolean} - True if token is expired
 */
export const isTokenExpired = () => {
  const user = getCurrentUser();
  if (!user || !user.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return user.exp < currentTime;
};

/**
 * Logout user and clear all auth data
 */
export const logout = () => {
  localStorage.clear("user");
  removeToken();
  // You can add additional cleanup here
  // Example: clear user data, redirect to login, etc.
};

/**
 * Client helper: show forbidden alert and optionally redirect
 */
export const notifyForbidden = (message = "ليس لديك صلاحية للوصول") => {
  try {
    alert(message);
  } catch (_) {}
};

/**
 * Create authorization header for API requests
 * @returns {object} - Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Verify token validity and handle expired tokens
 * @returns {boolean} - True if token is valid
 */
export const verifyTokenValidity = () => {
  if (!isAuthenticated()) {
    return false;
  }

  if (isTokenExpired()) {
    logout();
    return false;
  }

  return true;
};

/**
 * Role-based component rendering helper
 * @param {string|array} requiredRoles - Required role(s)
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {React.ReactNode} fallback - Component to render if not authorized
 * @returns {React.ReactNode} - Appropriate component based on role
 */
export const RoleGuard = ({ requiredRoles, children, fallback = null }) => {
  const hasAccess = hasAnyRole(requiredRoles);
  return hasAccess ? children : fallback;
};

/**
 * Higher-order component for role-based access control
 * @param {string|array} requiredRoles - Required role(s)
 * @param {React.ComponentType} Component - Component to wrap
 * @returns {React.ComponentType} - Wrapped component with role check
 */
export const withRole = (requiredRoles) => (Component) => {
  return (props) => {
    const hasAccess = hasAnyRole(requiredRoles);

    if (!hasAccess) {
      return null; // or a custom unauthorized component
    }

    return React.createElement(Component, { ...props });
  };
};
