const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  uploadLecture,
  getCurriculum,
} = require("../controllers/curriculumController");
const uploadCurriculum = require("../middleware/curriculumUpload");

// List curriculum for a level with optional filters
router.get("/levels/:levelId/curriculum", getCurriculum);

// Upload a lecture file
router.post(
  "/levels/:levelId/curriculum/:subject/semesters/:semester/lectures/:lecture",
  uploadCurriculum.single("file"),
  uploadLecture
);

module.exports = router;
