const express = require("express");
const router = express.Router();
const {
  createClass,
  getAllClasses,
  getClassById,
  getClassDetails,
  updateClass,
  deleteClass,
  getClassTeacherAssignments,
  updateClassTeacherAssignments,
} = require("../controllers/classController");
const { authenticateToken, requireAdmin } = require("../util/auth");

// Class routes
router.post("/", authenticateToken, requireAdmin, createClass);
router.get("/", getAllClasses);
router.get("/:id", getClassById);
router.get("/:id/details", getClassDetails);
router.put("/:id", authenticateToken, requireAdmin, updateClass);
router.delete("/:id", authenticateToken, requireAdmin, deleteClass);

// Teacher assignments per subject for a class
router.get("/:id/teacher-assignments", getClassTeacherAssignments);
router.put("/:id/teacher-assignments", updateClassTeacherAssignments);

module.exports = router;
