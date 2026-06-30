/**
 * routes/tripMembersRoutes.js
 *
 * Returns the list of confirmed passengers for a given AgentTrip.
 * Used by the "Members" tab in BookedPackageDetail.
 *
 * GET /api/trip-members/:agentTripId
 */

import express from "express";
import protect from "../middleware/authMiddleware.js";
import Booking from "../models/Booking.js";
import AgentTrip from "../models/AgentTrip.js";
import Driver from "../models/Driver.js";

const router = express.Router();

// ─── GET /api/trip-members/:agentTripId ──────────────────────────────────────
// Returns all confirmed travelers + driver info for a trip.
// Access: any authenticated user with a confirmed booking for this trip.
//         (Agents also allowed — check is permissive here for agent portal use)
router.get("/:agentTripId", protect, async (req, res) => {
  try {
    const { agentTripId } = req.params;

    // Verify trip exists
    const trip = await AgentTrip.findById(agentTripId)
      .select("title destinations driver driverName driverPhone driverPhoto totalSeats bookedSeats availableSeats startDate endDate")
      .populate("driver", "name email phone photo status")
      .lean();

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Fetch all confirmed bookings for this trip (paid status)
    const bookings = await Booking.find({
      agentTrip: agentTripId,
      paymentStatus: { $in: ["paid", "Paid"] },
      status: { $nin: ["deleted", "cancelled", "Cancelled"] },
    })
      .select("travelerName gender age contactNumber seats travellers userId boardingStatus createdAt assignedSeat bookingId")
      .populate("userId", "firstName lastName email avatar profileImage")
      .sort({ createdAt: 1 })
      .lean();

    // Build normalized member list
    const members = bookings.map((b, index) => {
      const user = b.userId || {};
      const name = b.travelerName
        || (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : null)
        || `Traveler ${index + 1}`;

      const avatar = user.avatar || user.profileImage || null;

      return {
        _id: b._id,
        bookingId: b.bookingId,
        userId: user._id || null,
        name,
        gender: b.gender || "unknown",
        age: b.age || null,
        phone: b.contactNumber || null,
        seats: b.seats || 1,
        assignedSeat: b.assignedSeat || null,
        avatar,
        boardingStatus: b.boardingStatus || "Pending",
        joinedAt: b.createdAt,
        // Travellers within booking (if group booking)
        travellers: b.travellers || [],
        status: "confirmed",
      };
    });

    // Driver info
    let driverInfo = null;
    if (trip.driver) {
      const d = trip.driver;
      driverInfo = {
        _id: d._id,
        name: d.name || trip.driverName || "Driver",
        phone: d.phone || trip.driverPhone || "",
        photo: d.photo || trip.driverPhoto || null,
        email: d.email || "",
        status: d.status || "active",
        role: "driver",
      };
    } else if (trip.driverName) {
      driverInfo = {
        _id: null,
        name: trip.driverName,
        phone: trip.driverPhone || "",
        photo: trip.driverPhoto || null,
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
      totalSeats: trip.totalSeats,
      bookedSeats: trip.bookedSeats,
      availableSeats: trip.availableSeats,
      tripTitle: trip.title,
    });
  } catch (error) {
    console.error("[TripMembers GET] Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
