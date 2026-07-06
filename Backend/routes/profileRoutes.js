import express from "express";
import {
  getSavedDestinations,
  addSavedDestination,
  removeSavedDestination,
  updateProfile,
  deleteAccount,
  rewardXp,
  getReferralDashboard,
  claimScratchCard,
} from "../controllers/profileController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Get saved destinations
router.get("/saved-destinations", protect, getSavedDestinations);

// Save a destination
router.post("/saved-destinations", protect, addSavedDestination);

// Remove a saved destination
router.delete("/saved-destinations/:name", protect, removeSavedDestination);

// Update profile details
router.put("/update", protect, updateProfile);

// Reward XP endpoint
router.post("/reward-xp", protect, rewardXp);

// Get referral dashboard stats
router.get("/referral-dashboard", protect, getReferralDashboard);

// Claim scratch card reward
router.post("/claim-scratch-card/:cardId", protect, claimScratchCard);

// Delete account (cascading)
router.delete("/delete-account", protect, deleteAccount);

export default router;
