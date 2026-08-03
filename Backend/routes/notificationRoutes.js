import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { acceptInvite, declineInvite } from "../controllers/tripController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all notifications
router.get("/", protect, getNotifications);

// Accept / Decline / Reject Invite aliases
router.post("/:notificationId/accept", protect, acceptInvite);
router.post("/:notificationId/decline", protect, declineInvite);
router.post("/:notificationId/reject", protect, declineInvite);
router.post("/invite/:notificationId/accept", protect, acceptInvite);
router.post("/invite/:notificationId/decline", protect, declineInvite);
router.post("/invite/:notificationId/reject", protect, declineInvite);

// Mark all as read
router.put("/read-all", protect, markAllAsRead);

// Mark a single notification as read
router.put("/:id/read", protect, markAsRead);

// Clear all notifications
router.delete("/clear-all", protect, clearAllNotifications);

// Delete single notification
router.delete("/:id", protect, deleteNotification);

export default router;
