const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");
const { authenticateToken, requireAdmin } = require("../util/auth");

// Get all events
router.get("/", eventsController.getEvents);

// Get event by ID
router.get("/:id", eventsController.getEventById);

// Create new event
router.post("/", authenticateToken, requireAdmin, eventsController.createEvent);

// Update event
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  eventsController.updateEvent
);

// Delete event
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  eventsController.deleteEvent
);

module.exports = router;
