const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  uploadLecture,
  uploadMultipleFiles,
  uploadSpecificFile,
  getCurriculum,
} = require("../controllers/curriculumController");
const { uploadCurriculum, uploadMultipleCurriculum } = require("../middleware/curriculumUpload");

// List curriculum for a level with optional filters
router.get("/levels/:levelId/curriculum", getCurriculum);

// Upload a lecture file (legacy single file)
router.post(
  "/levels/:levelId/curriculum/:subject/semesters/:semester/lectures/:lecture",
  uploadCurriculum.single("file"),
  uploadLecture
);

// Upload multiple files for a lecture (audio, PDF, video)
router.post(
  "/levels/:levelId/curriculum/:subject/semesters/:semester/lectures/:lecture/multiple",
  uploadMultipleCurriculum,
  uploadMultipleFiles
);

// Upload specific file type (audio, PDF, or video)
router.post(
  "/levels/:levelId/curriculum/:subject/semesters/:semester/lectures/:lecture/:fileType",
  uploadCurriculum.single("file"),
  uploadSpecificFile
);

module.exports = router;
