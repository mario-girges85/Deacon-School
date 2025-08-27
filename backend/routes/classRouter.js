const express = require("express");
const router = express.Router();
const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassTeacherAssignments,
  updateClassTeacherAssignments,
} = require("../controllers/classController");

// Class routes
router.post("/", createClass);
router.get("/", getAllClasses);
router.get("/:id", getClassById);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

// Teacher assignments per subject for a class
router.get("/:id/teacher-assignments", getClassTeacherAssignments);
router.put("/:id/teacher-assignments", updateClassTeacherAssignments);

module.exports = router;
