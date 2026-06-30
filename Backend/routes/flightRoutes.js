import express from "express";
import {
  addFlight,
  getTripFlights,
  updateFlight,
  deleteFlight,
  refreshFlightStatus,
} from "../controllers/flightController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE FLIGHT
router.post("/create", protect, addFlight);

// GET TRIP FLIGHTS
router.get("/trip/:tripId", protect, getTripFlights);

// UPDATE FLIGHT DETAILS
router.put("/:id", protect, updateFlight);

// DELETE FLIGHT
router.delete("/:id", protect, deleteFlight);

// REFRESH FLIGHT STATUS
router.post("/:id/refresh", protect, refreshFlightStatus);

export default router;
