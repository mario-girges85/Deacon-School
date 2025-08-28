const express = require("express");
const router = express.Router();
const User = require("../models/user");
const userController = require("../controllers/userController");
const profileImageUpload = require("../middleware/profileImage");
const upload = require("../middleware/upload");

// Register route with image upload middleware
router.post(
  "/register",
  profileImageUpload.single("image"),
  userController.register
);

// Update profile image for existing user
router.put(
  "/:id/image",
  profileImageUpload.single("image"),
  userController.updateUserImage
);

// Unified bulk import (CSV or Excel). Field name: 'file'. Optional body: classId
router.post("/bulk-import", upload.single("file"), userController.bulkImport);

router.post("/login", userController.login);
router.get("/get-users", userController.getUsers);

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
router.get("/:id", userController.getUserById);
router.delete("/delete/:id", userController.deleteUser);

module.exports = router;
