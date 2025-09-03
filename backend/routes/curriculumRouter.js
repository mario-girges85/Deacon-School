const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  uploadLecture,
  uploadMultipleFiles,
  uploadSpecificFile,
  getCurriculum,
  setLectureHymns,
} = require("../controllers/curriculumController");
const {
  uploadCurriculum,
  uploadMultipleCurriculum,
} = require("../middleware/curriculumUpload");
const { authenticateToken, requireAdmin, checkRole } = require("../util/auth");

// List curriculum for a level with optional filters - All authenticated users can view
router.get("/levels/:levelId/curriculum", authenticateToken, getCurriculum);

// Upload a lecture file (legacy single file) - Admin only
router.post(
  "/levels/:levelId/curriculum/:subject/semesters/:semester/lectures/:lecture",
  authenticateToken,
  requireAdmin,
  uploadCurriculum.single("file"),
  uploadLecture
);

// Upload multiple files for a lecture (audio, PDF, video) - Admin only
router.post(
  "/levels/:levelId/curriculum/:subject/semesters/:semester/lectures/:lecture/multiple",
  authenticateToken,
  requireAdmin,
  uploadMultipleCurriculum,
  uploadMultipleFiles
);

// Upload specific file type (audio, PDF, or video) - Admin only
router.post(
  "/levels/:levelId/curriculum/:subject/semesters/:semester/lectures/:lecture/:fileType",
  authenticateToken,
  requireAdmin,
  uploadCurriculum.single("file"),
  uploadSpecificFile
);

// Set hymns for an al7an lecture (replace set) - Admin only
router.put(
  "/levels/:levelId/curriculum/:subject/semesters/:semester/lectures/:lecture/hymns",
  authenticateToken,
  requireAdmin,
  setLectureHymns
);

module.exports = router;
