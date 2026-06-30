import express from "express";
import {
  getSavedDestinations,
  addSavedDestination,
  removeSavedDestination,
  updateProfile,
  deleteAccount,
  rewardXp,
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

// Delete account (cascading)
router.delete("/delete-account", protect, deleteAccount);

export default router;
