import express from "express";
import { sendChatNotification } from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Route for bridging notifications with cooldown
router.post("/:tripId/notify", protect, sendChatNotification);

export default router;
