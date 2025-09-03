const express = require("express");
const router = express.Router();
const hymnsController = require("../controllers/hymnsController");
const uploadHymnAudio = require("../middleware/hymnAudioUpload");
const { authenticateToken, requireAdmin } = require("../util/auth");

// Get all hymns
router.get("/", hymnsController.getHymns);

// Get hymn by ID
router.get("/:id", hymnsController.getHymnById);

// Create new hymn
router.post("/", authenticateToken, requireAdmin, hymnsController.createHymn);

// Update hymn
router.put("/:id", authenticateToken, requireAdmin, hymnsController.updateHymn);

// Delete hymn
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  hymnsController.deleteHymn
);

// Upload hymn audio
router.post(
  "/:id/audio",
  authenticateToken,
  requireAdmin,
  uploadHymnAudio.single("audio"),
  hymnsController.uploadHymnAudio
);

module.exports = router;
