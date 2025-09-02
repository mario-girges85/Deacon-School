const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");

// Get all events
router.get("/", eventsController.getEvents);

// Get event by ID
router.get("/:id", eventsController.getEventById);

// Create new event
router.post("/", eventsController.createEvent);

// Update event
router.put("/:id", eventsController.updateEvent);

// Delete event
router.delete("/:id", eventsController.deleteEvent);

module.exports = router;
