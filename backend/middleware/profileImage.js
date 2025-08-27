const path = require("path");
const fs = require("fs");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the destination folder for uploaded files
    const dest = "./uploads/profiles";
    try {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
    } catch (e) {
      return cb(e);
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to avoid naming conflicts
    const originalFileExtension = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}${originalFileExtension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /\.(jpg|jpeg|png|heic)$/i;
    const fileType = path.extname(file.originalname).toLowerCase();

    if (!allowedTypes.test(fileType)) {
      const err = new Error("File extension is not allowed.");
      err.status = 400;
      err.name = "FileValidationError";
      return cb(err, false);
    }

    return cb(null, true);
  },
});

module.exports = upload;
