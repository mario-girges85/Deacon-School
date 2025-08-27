const express = require("express");
const router = express.Router();
const {
  createLevel,
  getAllLevels,
  getLevelById,
  updateLevel,
  deleteLevel,
} = require("../controllers/levelController");

// Level routes
router.post("/", createLevel);
router.get("/", getAllLevels);
router.get("/:id", getLevelById);
router.put("/:id", updateLevel);
router.delete("/:id", deleteLevel);

module.exports = router;
