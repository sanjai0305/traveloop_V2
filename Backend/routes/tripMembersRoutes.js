import express from "express";
import supabase from "../config/supabase.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/trip-members/:agentTripId
router.get("/:agentTripId", protect, async (req, res) => {
  try {
    const { agentTripId } = req.params;

    const { data: trip } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", agentTripId)
      .maybeSingle();

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("agent_trip_id", agentTripId);

    const members = (bookings || []).map((b, index) => ({
      _id: b.id,
      id: b.id,
      bookingId: b.booking_code || b.id,
      name: b.passengers?.[0]?.name || `Traveler ${index + 1}`,
      status: "confirmed",
    }));

    res.status(200).json({
      success: true,
      members,
      driver: null,
      totalMembers: members.length,
      tripTitle: trip.title,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
