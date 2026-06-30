import express from "express";
import rateLimit from "express-rate-limit";
import protect from "../middleware/authMiddleware.js";
import { queryAI } from "../controllers/aiController.js";

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI queries, please try again after 15 minutes."
  }
});

router.post("/query", protect, aiLimiter, queryAI);

export default router;
