import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getMyRewards, claimReward } from "../controllers/rewardController.js";

const router = express.Router();

router.get("/my", protect, getMyRewards);
router.post("/claim", protect, claimReward);

export default router;
