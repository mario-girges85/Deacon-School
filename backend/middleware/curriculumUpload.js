const multer = require("multer");
const path = require("path");
const fs = require("fs");

const CURRICULUM_DIR = path.join(__dirname, "../uploads/Curriculum");

// Ensure base directory exists
if (!fs.existsSync(CURRICULUM_DIR)) {
  fs.mkdirSync(CURRICULUM_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // All files go into uploads/Curriculum
    cb(null, CURRICULUM_DIR);
  },
  filename: function (req, file, cb) {
    const { levelId, subject, semester, lecture } = req.params;
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeSubject = (subject || "").toLowerCase();
    const ts = Date.now();
    const base = `${levelId}_${safeSubject}_s${semester}_l${lecture}_${ts}`;
    cb(null, base + ext);
  },
});

const allowedMimes = new Set([
  "audio/mpeg", // mp3
  "application/pdf", // pdf
  "video/x-matroska", // mkv (common)
  "video/webm", // fallback some mkv tagged as webm
]);

const allowedExts = [".mp3", ".pdf", ".mkv"];

const fileFilter = function (req, file, cb) {
  const name = (file.originalname || "").toLowerCase();
  const type = (file.mimetype || "").toLowerCase();
  const hasAllowedExt = allowedExts.some((ext) => name.endsWith(ext));
  const hasAllowedMime = allowedMimes.has(type);
  if (hasAllowedExt || hasAllowedMime) {
    return cb(null, true);
  }
  const err = new Error("Only mp3, mkv or pdf files are allowed.");
  err.status = 400;
  err.name = "FileValidationError";
  return cb(err, false);
};

const uploadCurriculum = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // up to 200MB
  fileFilter,
});

module.exports = uploadCurriculum;
