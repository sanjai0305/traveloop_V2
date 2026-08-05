import express from "express";
import protect from "../middleware/authMiddleware.js";
import protectDriver from "../middleware/driverAuthMiddleware.js";
import supabase from "../config/supabase.js";

const router = express.Router();

// GET /api/driver-updates/:tripId
router.get("/:tripId", protect, async (req, res) => {
  try {
    const { tripId } = req.params;

    const { data: trip } = await supabase
      .from("agent_trips")
      .select("title, driver_id")
      .eq("id", tripId)
      .maybeSingle();

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    res.status(200).json({
      success: true,
      updates: [],
      tripTitle: trip.title,
      hasDriver: !!trip.driver_id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// POST /api/driver-updates/:tripId
router.post("/:tripId", protectDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    res.status(201).json({
      success: true,
      update: { _id: "UPD-" + Date.now(), message },
      message: "Update posted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// DELETE /api/driver-updates/:tripId/:updateId
router.delete("/:tripId/:updateId", protectDriver, async (req, res) => {
  res.status(200).json({ success: true, message: "Update deleted" });
});

export default router;
