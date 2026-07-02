import express from "express";
import mongoose from "mongoose";
import protect from "../middleware/authMiddleware.js";
import AgentTrip from "../models/AgentTrip.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Driver from "../models/Driver.js";

const router = express.Router();

// GET /api/trip-members/:agentTripId
router.get("/:agentTripId", protect, async (req, res) => {
  try {
    const { agentTripId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(agentTripId)) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Verify trip exists
    const trip = await AgentTrip.findById(agentTripId);

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Fetch all confirmed bookings for this trip (paid status)
    const bookingsList = await Booking.find({
      tripId: agentTripId,
      paymentStatus: { $in: ["paid", "Paid"] }
    });

    const bookings = bookingsList || [];

    // Fetch traveler user details
    const userIds = bookings.map(b => b.userId).filter(Boolean);
    let usersMap = new Map();
    if (userIds.length > 0) {
      const usersList = await User.find({
        _id: { $in: userIds }
      }).select("firstName lastName email avatar");
      
      if (usersList) {
        usersList.forEach(u => usersMap.set(u._id.toString(), u));
      }
    }

    // Build normalized member list
    const members = bookings.map((b, index) => {
      const user = usersMap.get(b.userId?.toString()) || {};
      const name = (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : null)
        || `Traveler ${index + 1}`;

      const avatar = user.avatar || null;

      return {
        _id: b._id,
        bookingId: b.bookingId,
        userId: user._id || null,
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
      const d = await Driver.findById(trip.driverId);

      if (d) {
        driverInfo = {
          _id: d._id,
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
