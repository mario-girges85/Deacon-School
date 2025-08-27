const multer = require("multer");

// Use memory storage for Excel files since we need to process them
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for Excel files
  },
  fileFilter: function (req, file, cb) {
    // Allow Excel (.xlsx/.xls) and CSV files
    const name = (file.originalname || "").toLowerCase();
    const type = (file.mimetype || "").toLowerCase();

    const isExcel =
      type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      type === "application/vnd.ms-excel" ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls");

    const isCsv =
      type === "text/csv" ||
      type === "application/csv" ||
      type === "application/vnd.ms-excel" ||
      name.endsWith(".csv");

    if (isExcel || isCsv) {
      return cb(null, true);
    }

    const err = new Error("Only Excel (.xlsx/.xls) or CSV (.csv) files are allowed.");
    err.status = 400;
    err.name = "FileValidationError";
    return cb(err, false);
  },
});

module.exports = upload;
