// routes/aiRoutes.js
// AI Service gateway routes.
// All routes require authentication — the Backend is the sole gateway to the AI Service.

import express from "express";
import rateLimit from "express-rate-limit";
import protect from "../middleware/authMiddleware.js";
import {
  queryAI,
  postChat,
  postSearch,
  getRecommendations,
  getAnalytics,
  getDemands,
} from "../controllers/aiController.js";

const router = express.Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI chat requests. Please wait before continuing." },
});

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI search requests. Please slow down." },
});

const recommendationsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many recommendation requests." },
});

const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many analytics requests." },
});

// ── Routes ────────────────────────────────────────────────────────────────────

// PRESERVED — existing trip-context Gemini assistant (used by TripAiAssistantPage legacy)
router.post("/query", protect, chatLimiter, queryAI);

// NEW — AI Service gateway endpoints
router.post("/chat",              protect, chatLimiter,            postChat);
router.post("/search",            protect, searchLimiter,          postSearch);
router.get("/recommendations",    protect, recommendationsLimiter, getRecommendations);
router.get("/analytics",          protect, analyticsLimiter,       getAnalytics);
router.get("/demands",            protect, analyticsLimiter,       getDemands);

export default router;
