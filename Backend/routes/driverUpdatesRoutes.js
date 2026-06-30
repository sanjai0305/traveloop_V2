/**
 * routes/driverUpdatesRoutes.js
 *
 * Driver Update announcements for a trip.
 *
 * GET    /api/driver-updates/:tripId          — any authenticated traveler/agent
 * POST   /api/driver-updates/:tripId          — driver only
 * DELETE /api/driver-updates/:tripId/:updateId — driver only (own messages)
 */

import express from "express";
import protect from "../middleware/authMiddleware.js";
import protectDriver from "../middleware/driverAuthMiddleware.js";
import DriverUpdate from "../models/DriverUpdate.js";
import AgentTrip from "../models/AgentTrip.js";

const router = express.Router();

// ─── GET /api/driver-updates/:tripId ─────────────────────────────────────────
// Returns all non-deleted updates for a trip, newest first.
// Access: any authenticated user
router.get("/:tripId", protect, async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip exists
    const trip = await AgentTrip.findById(tripId).select("title driver").lean();
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const updates = await DriverUpdate.find({
      trip: tripId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      updates,
      tripTitle: trip.title,
      hasDriver: !!trip.driver,
    });
  } catch (error) {
    console.error("[DriverUpdates GET] Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ─── POST /api/driver-updates/:tripId ────────────────────────────────────────
// Driver posts a new announcement.
// Access: driver only (protectDriver middleware)
router.post("/:tripId", protectDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { type = "info", message, imageUrl = "", locationData } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    // Verify the trip exists and this driver is assigned to it
    const trip = await AgentTrip.findById(tripId).select("driver title").lean();
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const driverId = req.driver._id.toString();
    if (trip.driver && trip.driver.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned driver for this trip",
      });
    }

    const update = await DriverUpdate.create({
      trip: tripId,
      driver: req.driver._id,
      driverName: req.driver.name || "Driver",
      driverPhoto: req.driver.photo || "",
      type: type.toLowerCase(),
      message: message.trim(),
      imageUrl: imageUrl || "",
      locationData: locationData || {},
    });

    // Emit socket event so travelers receive it instantly
    const io = req.app.get("io");
    if (io) {
      io.to(`trip_${tripId}`).emit("driver-update-posted", {
        tripId,
        update: {
          _id: update._id,
          type: update.type,
          message: update.message,
          driverName: update.driverName,
          driverPhoto: update.driverPhoto,
          createdAt: update.createdAt,
        },
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

// ─── DELETE /api/driver-updates/:tripId/:updateId ────────────────────────────
// Driver deletes one of their own announcements (soft-delete).
// Access: driver only
router.delete("/:tripId/:updateId", protectDriver, async (req, res) => {
  try {
    const { tripId, updateId } = req.params;

    const update = await DriverUpdate.findOne({
      _id: updateId,
      trip: tripId,
      driver: req.driver._id,
    });

    if (!update) {
      return res.status(404).json({ success: false, message: "Update not found or not yours" });
    }

    update.isDeleted = true;
    await update.save();

    // Notify connected clients
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
