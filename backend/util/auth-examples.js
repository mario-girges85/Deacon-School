/**
 * Backend Authentication Usage Examples
 * This file shows how to use the auth utilities in your routes
 */

const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  requireAdmin,
  requireTeacher,
  requireStaff,
  requireManagement,
  checkRole,
} = require("./auth");

// Example 1: Basic protected route (any authenticated user)
router.get("/profile", authenticateToken, (req, res) => {
  // req.user contains: { id, phone, code, role, name }
  res.json({
    success: true,
    user: req.user,
  });
});

// Example 2: Admin-only route
router.get("/admin/dashboard", authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Admin dashboard data",
    user: req.user,
  });
});

// Example 3: Teacher-only route
router.get(
  "/teacher/classes",
  authenticateToken,
  requireTeacher,
  (req, res) => {
    res.json({
      success: true,
      message: "Teacher classes data",
      user: req.user,
    });
  }
);

// Example 4: Staff-only route (teacher, admin, or supervisor)
router.get("/staff/portal", authenticateToken, requireStaff, (req, res) => {
  res.json({
    success: true,
    message: "Staff portal data",
    user: req.user,
  });
});

// Example 5: Management-only route (admin or supervisor)
router.get(
  "/management/reports",
  authenticateToken,
  requireManagement,
  (req, res) => {
    res.json({
      success: true,
      message: "Management reports",
      user: req.user,
    });
  }
);

// Example 6: Custom role check
router.get(
  "/custom-route",
  authenticateToken,
  checkRole(["teacher", "supervisor"]),
  (req, res) => {
    res.json({
      success: true,
      message: "Custom role access",
      user: req.user,
    });
  }
);

// Example 7: Multiple middleware with role check
router.post(
  "/create-course",
  authenticateToken, // First: verify token
  requireStaff, // Second: check if staff
  (req, res) => {
    // Third: handle request
    res.json({
      success: true,
      message: "Course created",
      user: req.user,
    });
  }
);

// Example 8: Conditional role-based logic
router.get("/data", authenticateToken, (req, res) => {
  const userRole = req.user.role;

  let data = {};

  if (userRole === "admin") {
    data = { allData: true, sensitive: true };
  } else if (userRole === "teacher") {
    data = { classData: true, studentData: true };
  } else if (userRole === "supervisor") {
    data = { overviewData: true, reports: true };
  } else if (userRole === "student") {
    data = { personalData: true, grades: true };
  }

  res.json({
    success: true,
    data: data,
    user: req.user,
  });
});

module.exports = router;
