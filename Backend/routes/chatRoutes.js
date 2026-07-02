import express from "express";
import {
  sendChatNotification,
  sendMessage,
  getMessages,
  markSeen,
  reactToMessage,
  editMessage,
  deleteMessage,
} from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// REST Chat message endpoints
router.post("/:tripId", protect, sendMessage);
router.get("/:tripId", protect, getMessages);
router.post("/:tripId/seen", protect, markSeen);
router.post("/message/:messageId/react", protect, reactToMessage);
router.put("/message/:messageId", protect, editMessage);
router.delete("/message/:messageId", protect, deleteMessage);

// Cooldown notifications
router.post("/:tripId/notify", protect, sendChatNotification);

export default router;
