const express = require("express");
const router = express.Router();
const hymnsController = require("../controllers/hymnsController");
const uploadHymnAudio = require("../middleware/hymnAudioUpload");

// Get all hymns
router.get("/", hymnsController.getHymns);

// Get hymn by ID
router.get("/:id", hymnsController.getHymnById);

// Create new hymn
router.post("/", hymnsController.createHymn);

// Update hymn
router.put("/:id", hymnsController.updateHymn);

// Delete hymn
router.delete("/:id", hymnsController.deleteHymn);

// Upload hymn audio
router.post(
  "/:id/audio",
  uploadHymnAudio.single("audio"),
  hymnsController.uploadHymnAudio
);

module.exports = router;
