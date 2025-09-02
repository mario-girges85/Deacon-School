const multer = require("multer");
const path = require("path");
const fs = require("fs");

const HYMNS_DIR = path.join(__dirname, "../uploads/hymns");

// Ensure base directory exists
if (!fs.existsSync(HYMNS_DIR)) {
  fs.mkdirSync(HYMNS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // All files go into uploads/hymns
    cb(null, HYMNS_DIR);
  },
  filename: function (req, file, cb) {
    const { id } = req.params;
    const ext = path.extname(file.originalname || "").toLowerCase();
    const ts = Date.now();
    const base = `hymn_${id}_${ts}`;
    cb(null, base + ext);
  },
});

const allowedMimes = new Set([
  "audio/mpeg", // mp3
  "audio/wav", // wav
  "audio/ogg", // ogg
  "audio/mp4", // m4a
]);

const allowedExts = [".mp3", ".wav", ".ogg", ".m4a"];

const fileFilter = function (req, file, cb) {
  const name = (file.originalname || "").toLowerCase();
  const type = (file.mimetype || "").toLowerCase();
  const hasAllowedExt = allowedExts.some((ext) => name.endsWith(ext));
  const hasAllowedMime = allowedMimes.has(type);

  if (hasAllowedExt || hasAllowedMime) {
    return cb(null, true);
  }

  const err = new Error("Only audio files (mp3, wav, ogg, m4a) are allowed.");
  err.status = 400;
  err.name = "FileValidationError";
  return cb(err, false);
};

const uploadHymnAudio = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // up to 50MB
  fileFilter,
});

module.exports = uploadHymnAudio;
