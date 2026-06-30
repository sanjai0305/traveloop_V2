import express from "express";
import protect from "../middleware/authMiddleware.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

const isUUID = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

// GET /api/trip-members/:agentTripId
router.get("/:agentTripId", protect, async (req, res) => {
  try {
    const { agentTripId } = req.params;
    if (!isUUID(agentTripId)) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Verify trip exists
    const { data: trip } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", agentTripId)
      .maybeSingle();

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Fetch all confirmed bookings for this trip (paid status)
    const { data: bookingsList } = await supabase
      .from("bookings")
      .select("*")
      .eq("tripId", agentTripId)
      .in("paymentStatus", ["paid", "Paid"]);

    const bookings = bookingsList || [];

    // Fetch traveler user details
    const userIds = bookings.map(b => b.userId).filter(Boolean);
    let usersMap = new Map();
    if (userIds.length > 0) {
      const { data: usersList } = await supabase
        .from("users")
        .select("id, firstName, lastName, email, avatar")
        .in("id", userIds);
      
      if (usersList) {
        usersList.forEach(u => usersMap.set(u.id, u));
      }
    }

    // Build normalized member list
    const members = bookings.map((b, index) => {
      const user = usersMap.get(b.userId) || {};
      const name = (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : null)
        || `Traveler ${index + 1}`;

      const avatar = user.avatar || null;

      return {
        _id: b.id,
        bookingId: b.bookingId,
        userId: user.id || null,
        name,
        gender: "unknown",
        age: null,
        phone: null,
        seats: b.seats || 1,
        assignedSeat: b.assignedSeat || null,
        avatar,
        boardingStatus: b.boardingStatus || "Pending",
        joinedAt: b.createdAt,
        travellers: [],
        status: "confirmed",
      };
    });

    // Driver info
    let driverInfo = null;
    if (trip.driverId) {
      const { data: d } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", trip.driverId)
        .maybeSingle();

      if (d) {
        driverInfo = {
          _id: d.id,
          name: d.name || trip.driverName || "Driver",
          phone: d.phone || trip.driverPhone || "",
          photo: null,
          email: d.email || "",
          status: d.status || "active",
          role: "driver",
        };
      }
    } else if (trip.driverName) {
      driverInfo = {
        _id: null,
        name: trip.driverName,
        phone: trip.driverPhone || "",
        photo: null,
        email: "",
        status: "active",
        role: "driver",
      };
    }

    res.status(200).json({
      success: true,
      members,
      driver: driverInfo,
      totalMembers: members.length,
      tripTitle: trip.title,
    });
  } catch (error) {
    console.error("[TripMembers GET] Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
