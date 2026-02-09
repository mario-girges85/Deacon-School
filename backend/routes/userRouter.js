const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const profileImageUpload = require("../middleware/profileImage");
const upload = require("../middleware/upload");
const {
  authenticateToken,
  requireAdmin,
  requireStaff,
} = require("../util/auth");

// Register route with image upload middleware
router.post(
  "/register",
  profileImageUpload.single("image"),
  userController.register
);

// Update profile image for existing user
router.put(
  "/:id/image",
  authenticateToken,
  // allow self or admin
  (req, res, next) => {
    if (
      String(req.user.id) !== String(req.params.id) &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "غير مصرح لك بتحديث صورة هذا المستخدم",
        });
    }
    next();
  },
  profileImageUpload.single("image"),
  userController.updateUserImage
);

// Change password
router.put(
  "/:id/password",
  authenticateToken,
  (req, res, next) => {
    if (
      String(req.user.id) !== String(req.params.id) &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "غير مصرح لك بتغيير كلمة المرور لهذا المستخدم",
        });
    }
    next();
  },
  userController.changePassword
);

// Unified bulk import (CSV or Excel). Field name: 'file'. Optional body: classId
router.post(
  "/bulk-import",
  authenticateToken,
  requireAdmin,
  upload.single("file"),
  userController.bulkImport
);

// Bulk import for teachers (CSV or Excel). Field name: 'file'.
router.post(
  "/bulk-import-teachers",
  authenticateToken,
  requireAdmin,
  upload.single("file"),
  userController.bulkImportTeachers
);

router.post("/login", userController.login);
router.get(
  "/get-users",
  authenticateToken,
  requireAdmin,
  userController.getUsers
);
router.get(
  "/teachers-by-subject",
  authenticateToken,
  requireStaff,
  userController.getTeachersBySubject
);

// School statistics (place BEFORE param routes to avoid /:id capturing "stats")
router.get("/stats", userController.getSchoolStats);

// Teacher/Supervisor class associations (also BEFORE param routes)
router.post("/assign-classes", userController.assignClassesToTeacher);
router.get("/teacher/:userId/classes", userController.getTeacherClasses);
router.delete(
  "/teacher/:userId/classes",
  userController.removeAllClassesFromTeacher
);
router.get("/teachers-with-classes", userController.getTeachersWithClasses);

// Get single user by id (keep after specific routes)
router.get("/:id", authenticateToken, userController.getUserById);
router.delete(
  "/delete/:id",
  authenticateToken,
  requireAdmin,
  userController.deleteUser
);

module.exports = router;
