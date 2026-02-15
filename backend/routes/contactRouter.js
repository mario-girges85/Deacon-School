const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const { authenticateToken, requireAdmin } = require("../util/auth");

// Authenticated users: submit contact form
router.post("/", authenticateToken, contactController.createMessage);

// Admin only: list messages
router.get(
  "/messages",
  authenticateToken,
  requireAdmin,
  contactController.getMessages
);

// Admin only: mark as read
router.put(
  "/messages/:id/read",
  authenticateToken,
  requireAdmin,
  contactController.markAsRead
);

// Admin only: delete message
router.delete(
  "/messages/:id",
  authenticateToken,
  requireAdmin,
  contactController.deleteMessage
);

module.exports = router;
