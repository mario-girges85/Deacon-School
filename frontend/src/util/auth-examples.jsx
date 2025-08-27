/**
 * Frontend Authentication Usage Examples
 * This file shows how to use the auth utilities in your React components
 */

import React from "react";
import axios from "axios";
import {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  getCurrentUser,
  hasRole,
  hasAnyRole,
  isAdmin,
  isTeacher,
  isSupervisor,
  isStudent,
  getAuthHeaders,
  RoleGuard,
  withRole,
  logout,
} from "./auth";

// Example 1: Login component with token storage
export const LoginExample = () => {
  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post("/api/users/login", credentials, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      if (data.success) {
        setToken(data.token); // Store token
        // Redirect or update state
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return <div>{/* Login form */}</div>;
};

// Example 2: Protected component with authentication check
export const ProtectedComponent = () => {
  if (!isAuthenticated()) {
    return <div>Please log in to access this content.</div>;
  }

  const user = getCurrentUser();

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Your role: {user.role}</p>
    </div>
  );
};

// Example 3: Role-based component rendering
export const RoleBasedComponent = () => {
  return (
    <div>
      {/* Admin only content */}
      {isAdmin() && (
        <div className="admin-panel">
          <h2>Admin Panel</h2>
          <p>Only admins can see this</p>
        </div>
      )}

      {/* Teacher only content */}
      {isTeacher() && (
        <div className="teacher-panel">
          <h2>Teacher Panel</h2>
          <p>Only teachers can see this</p>
        </div>
      )}

      {/* Supervisor only content */}
      {isSupervisor() && (
        <div className="supervisor-panel">
          <h2>Supervisor Panel</h2>
          <p>Only supervisors can see this</p>
        </div>
      )}

      {/* Student only content */}
      {isStudent() && (
        <div className="student-panel">
          <h2>Student Panel</h2>
          <p>Only students can see this</p>
        </div>
      )}
    </div>
  );
};

// Example 4: Using RoleGuard component
export const RoleGuardExample = () => {
  return (
    <div>
      {/* Admin only */}
      <RoleGuard requiredRoles="admin">
        <div className="admin-content">
          <h2>Admin Dashboard</h2>
          <p>Admin-specific content</p>
        </div>
      </RoleGuard>

      {/* Multiple roles */}
      <RoleGuard requiredRoles={["teacher", "supervisor"]}>
        <div className="staff-content">
          <h2>Staff Dashboard</h2>
          <p>Teacher and supervisor content</p>
        </div>
      </RoleGuard>

      {/* With fallback */}
      <RoleGuard
        requiredRoles="admin"
        fallback={<div>Access denied. Admin only.</div>}
      >
        <div className="admin-only">
          <h2>Admin Only</h2>
          <p>This will show fallback for non-admins</p>
        </div>
      </RoleGuard>
    </div>
  );
};

// Example 5: Using withRole HOC
export const AdminDashboard = () => (
  <div>
    <h2>Admin Dashboard</h2>
    <p>Admin-specific functionality</p>
  </div>
);

export const TeacherDashboard = () => (
  <div>
    <h2>Teacher Dashboard</h2>
    <p>Teacher-specific functionality</p>
  </div>
);

// Wrap components with role requirements
export const ProtectedAdminDashboard = withRole("admin")(AdminDashboard);
export const ProtectedTeacherDashboard = withRole("teacher")(TeacherDashboard);

// Example 6: API calls with authentication headers
export const AuthenticatedAPI = () => {
  const fetchUserData = async () => {
    try {
      const headers = getAuthHeaders(); // Gets Authorization: Bearer <token>

      const response = await axios.get("/api/users/profile", {
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      const data = response.data;
      return data;
    } catch (error) {
      console.error("API call failed:", error);
    }
  };

  return (
    <div>
      <button onClick={fetchUserData}>Fetch User Data</button>
    </div>
  );
};

// Example 7: Navigation guard component
export const NavigationGuard = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to login or show login prompt
    return <div>Please log in to continue</div>;
  }

  return children;
};

// Example 8: Logout functionality
export const LogoutButton = () => {
  const handleLogout = () => {
    logout(); // Clears token and any other auth data
    // Redirect to login page
    window.location.href = "/login";
  };

  return <button onClick={handleLogout}>Logout</button>;
};

// Example 9: Conditional navigation based on role
export const NavigationMenu = () => {
  const user = getCurrentUser();

  if (!user) return null;

  return (
    <nav>
      <ul>
        <li>
          <a href="/dashboard">Dashboard</a>
        </li>

        {/* Admin navigation */}
        {isAdmin() && (
          <>
            <li>
              <a href="/admin/users">Manage Users</a>
            </li>
            <li>
              <a href="/admin/settings">System Settings</a>
            </li>
          </>
        )}

        {/* Teacher navigation */}
        {isTeacher() && (
          <>
            <li>
              <a href="/teacher/classes">My Classes</a>
            </li>
            <li>
              <a href="/teacher/students">My Students</a>
            </li>
          </>
        )}

        {/* Supervisor navigation */}
        {isSupervisor() && (
          <li>
            <a href="/supervisor/portal">Supervisor Portal</a>
          </li>
        )}

        {/* Student navigation */}
        {isStudent() && (
          <>
            <li>
              <a href="/student/courses">My Courses</a>
            </li>
            <li>
              <a href="/student/grades">My Grades</a>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

// Example 10: Token expiration check
export const TokenExpirationCheck = () => {
  React.useEffect(() => {
    const checkToken = () => {
      if (isAuthenticated() && isTokenExpired()) {
        // Token is expired, logout user
        logout();
        alert("Your session has expired. Please log in again.");
        // Redirect to login
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkToken, 5 * 60 * 1000);

    // Initial check
    checkToken();

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
};

// Example 11: Axios with authentication interceptor
export const AxiosWithAuth = () => {
  // Set up axios interceptor for authentication
  React.useEffect(() => {
    // Request interceptor to add auth token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, logout user
          logout();
          // Redirect to login
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const fetchProtectedData = async () => {
    try {
      // No need to manually add headers - interceptor handles it
      const response = await axios.get("/api/protected/data");
      console.log("Protected data:", response.data);
    } catch (error) {
      console.error("Failed to fetch protected data:", error);
    }
  };

  return (
    <div>
      <button onClick={fetchProtectedData}>Fetch Protected Data</button>
    </div>
  );
};
