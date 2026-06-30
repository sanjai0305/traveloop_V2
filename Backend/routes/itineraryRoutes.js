import express from "express";

import {
  createItinerary,
  getTripItinerary,
  updateItinerary,
  deleteItinerary,
} from "../controllers/itineraryController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE ITINERARY
router.post(
  "/create",
  protect,
  createItinerary
);

// GET ITINERARY BY TRIP
router.get(
  "/:tripId",
  protect,
  getTripItinerary
);

// UPDATE ITINERARY ITEM
router.put(
  "/:id",
  protect,
  updateItinerary
);

// DELETE ITINERARY ITEM
router.delete(
  "/:id",
  protect,
  deleteItinerary
);

export default router;