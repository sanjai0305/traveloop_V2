import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all notifications
router.get("/", protect, getNotifications);

// Mark all as read
router.put("/read-all", protect, markAllAsRead);

// Mark a single notification as read
router.put("/:id/read", protect, markAsRead);

// Clear all notifications
router.delete("/clear-all", protect, clearAllNotifications);

// Delete single notification
router.delete("/:id", protect, deleteNotification);

export default router;
