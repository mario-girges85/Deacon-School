const express = require("express");
const router = express.Router();
const {
  generateSchedule,
  applySchedule,
  saveSchedule,
  getCurrentSchedule,
} = require("../controllers/scheduleController");

router.post("/generate", generateSchedule);
router.post("/apply", applySchedule);
router.post("/save", saveSchedule);
router.get("/current", getCurrentSchedule);

module.exports = router;
