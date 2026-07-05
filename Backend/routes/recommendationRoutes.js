import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getUserRecommendations,
  getTripRecommendations,
  getDestinationRecommendations
} from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/user/:userId?", protect, getUserRecommendations);
router.get("/trip/:tripId", protect, getTripRecommendations);
router.get("/destination/:id", protect, getDestinationRecommendations);

export default router;
