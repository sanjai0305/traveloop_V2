import express from "express";
import { verifyReferralCode, getReferralStatus } from "../controllers/referralController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/referrals/verify — verify a referral code and generate reward
router.post("/verify", protect, verifyReferralCode);

// GET /api/referrals/status — get current referral + reward status for logged-in user
router.get("/status", protect, getReferralStatus);

export default router;
