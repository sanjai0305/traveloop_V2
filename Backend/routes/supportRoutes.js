import express from "express";
import rateLimit from "express-rate-limit";
import protect from "../middleware/authMiddleware.js";
import { sendSupportEmail, sendSupportReply } from "../services/gmailService.js";

const router = express.Router();

// Rate limiter: 5 requests per 15 minutes per IP
const supportRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many support requests. Please try again later." },
});

router.post("/", protect, supportRateLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (!message || message.trim().length <= 5) {
      return res.status(400).json({ success: false, message: "Message must be longer than 5 characters." });
    }

    try {
      // Send support ticket details to support inbox
      await sendSupportEmail(name.trim(), email.trim(), message.trim());
      
      // Send acknowledgement auto-reply to the user
      await sendSupportReply(name.trim(), email.trim());
    } catch (mailErr) {
      // Log the specific error but don't fail the request completely if configuration is missing
      console.error("Support Email Send Failed:", mailErr.message);
      // Wait, is Gmail API failure required to fail the endpoint or succeed?
      // "If Gmail API fails: Log error, Return graceful response, Show existing error toast. Never crash UI."
      // If it fails, let's return a 500 or graceful error response so the frontend displays the error toast!
      return res.status(500).json({ success: false, message: "Failed to send support ticket. Please check backend logs." });
    }

    return res.status(200).json({
      success: true,
      message: "Support request sent successfully.",
    });
  } catch (error) {
    console.error("[Support Route] Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
