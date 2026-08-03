import express from "express";
import {
  sendMessage,
  getMessages,
  reactToMessage,
  editMessage,
  deleteMessage,
  updateLiveLocation,
  getActiveLocations,
  votePoll,
  markExpensePaid,
  askAiAssistant,
  getSharedMedia,
  sendChatNotification,
  markSeen,
} from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Primary REST Chat Endpoints
router.post("/:tripId", protect, sendMessage);
router.get("/:tripId", protect, getMessages);

// Message Reactions & Mutations
router.post("/message/:messageId/react", protect, reactToMessage);
router.put("/message/:messageId", protect, editMessage);
router.delete("/message/:messageId", protect, deleteMessage);

// Live GPS Locations
router.post("/:tripId/location/live", protect, updateLiveLocation);
router.get("/:tripId/location/live", protect, getActiveLocations);

// Interactive Poll & Expense
router.post("/poll/:messageId/vote", protect, votePoll);
router.post("/expense/:messageId/pay", protect, markExpensePaid);

// AI Trip Assistant & Shared Media
router.post("/:tripId/ai", protect, askAiAssistant);
router.get("/:tripId/media", protect, getSharedMedia);

// Legacy aliases
router.post("/:tripId/notify", protect, sendChatNotification);
router.post("/:tripId/seen", protect, markSeen);

export default router;
