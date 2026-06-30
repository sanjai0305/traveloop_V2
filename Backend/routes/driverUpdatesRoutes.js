import express from "express";
import protect from "../middleware/authMiddleware.js";
import protectDriver from "../middleware/driverAuthMiddleware.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

const isUUID = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

// GET /api/driver-updates/:tripId
router.get("/:tripId", protect, async (req, res) => {
  try {
    const { tripId } = req.params;
    if (!isUUID(tripId)) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const { data: trip } = await supabase
      .from("agent_trips")
      .select("title, driverId")
      .eq("id", tripId)
      .maybeSingle();

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const { data: updatesList } = await supabase
      .from("driver_updates")
      .select("*")
      .eq("tripId", tripId)
      .eq("isDeleted", false)
      .order("createdAt", { ascending: false })
      .limit(50);

    const updates = (updatesList || []).map(u => ({
      ...u,
      _id: u.id,
      trip: u.tripId,
      driver: u.driverId,
    }));

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

    if (!isUUID(tripId)) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const { data: trip } = await supabase
      .from("agent_trips")
      .select("driverId, title")
      .eq("id", tripId)
      .maybeSingle();

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const driverId = req.driver.id;
    if (trip.driverId && trip.driverId !== driverId) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned driver for this trip",
      });
    }

    const { data: updateRow, error } = await supabase
      .from("driver_updates")
      .insert([{
        tripId,
        driverId: req.driver.id,
        driverName: req.driver.name || "Driver",
        type: type.toLowerCase(),
        message: message.trim(),
        isDeleted: false
      }])
      .select()
      .single();

    if (error) throw error;

    const update = {
      ...updateRow,
      _id: updateRow.id,
      trip: updateRow.tripId,
      driver: updateRow.driverId,
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
    if (!isUUID(tripId) || !isUUID(updateId)) {
      return res.status(404).json({ success: false, message: "Update not found or not yours" });
    }

    const { data: update, error } = await supabase
      .from("driver_updates")
      .update({ isDeleted: true })
      .eq("id", updateId)
      .eq("tripId", tripId)
      .eq("driverId", req.driver.id)
      .select()
      .maybeSingle();

    if (error || !update) {
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
