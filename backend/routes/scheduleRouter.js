const express = require("express");
const router = express.Router();
const {
  generateSchedule,
  applySchedule,
  saveSchedule,
} = require("../controllers/scheduleController");

router.post("/generate", generateSchedule);
router.post("/apply", applySchedule);
router.post("/save", saveSchedule);

module.exports = router;
