import express from "express";
import mongoose from "mongoose";
import protect from "../middleware/authMiddleware.js";
import protectDriver from "../middleware/driverAuthMiddleware.js";
import AgentTrip from "../models/AgentTrip.js";
import DriverUpdate from "../models/DriverUpdate.js";

const router = express.Router();

// GET /api/driver-updates/:tripId
router.get("/:tripId", protect, async (req, res) => {
  try {
    const { tripId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = await AgentTrip.findById(tripId).select("title driverId");

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const updatesList = await DriverUpdate.find({
      trip: tripId,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .limit(50);

    const updates = (updatesList || []).map(u => {
      const obj = u.toObject ? u.toObject() : u;
      return {
        ...obj,
        _id: u._id,
        trip: u.trip,
        driver: u.driver,
      };
    });

    res.status(200).json({
      success: true,
      updates,
      tripTitle: trip.title,
      hasDriver: !!trip.driverId,
    });
  } catch (error) {
    console.error("[DriverUpdates GET] Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// POST /api/driver-updates/:tripId
router.post("/:tripId", protectDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { type = "info", message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = await AgentTrip.findById(tripId).select("driverId title");

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const driverId = req.driver._id || req.driver.id;
    if (trip.driverId && trip.driverId.toString() !== driverId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned driver for this trip",
      });
    }

    const updateRow = await DriverUpdate.create({
      trip: tripId,
      driver: driverId,
      driverName: req.driver.name || "Driver",
      type: type.toLowerCase(),
      message: message.trim(),
      isDeleted: false
    });

    const update = {
      ...updateRow.toObject(),
      _id: updateRow._id,
      trip: updateRow.trip,
      driver: updateRow.driver,
    };

    const io = req.app.get("io");
    if (io) {
      io.to(`trip_${tripId}`).emit("driver-update-posted", {
        tripId,
        update,
      });
    }

    res.status(201).json({
      success: true,
      update,
      message: "Update posted successfully",
    });
  } catch (error) {
    console.error("[DriverUpdates POST] Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// DELETE /api/driver-updates/:tripId/:updateId
router.delete("/:tripId/:updateId", protectDriver, async (req, res) => {
  try {
    const { tripId, updateId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tripId) || !mongoose.Types.ObjectId.isValid(updateId)) {
      return res.status(404).json({ success: false, message: "Update not found or not yours" });
    }

    const driverId = req.driver._id || req.driver.id;
    const update = await DriverUpdate.findOneAndUpdate(
      { _id: updateId, trip: tripId, driver: driverId },
      { isDeleted: true },
      { returnDocument: "after" }
    );

    if (!update) {
      return res.status(404).json({ success: false, message: "Update not found or not yours" });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`trip_${tripId}`).emit("driver-update-deleted", { tripId, updateId });
    }

    res.status(200).json({ success: true, message: "Update deleted" });
  } catch (error) {
    console.error("[DriverUpdates DELETE] Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
