import express from "express";
import mongoose from "mongoose";
import AgentTrip from "../models/AgentTrip.js";
import Booking from "../models/Booking.js";
import protectAgent from "../middleware/agentAuthMiddleware.js";

const router = express.Router();

// Helper to check DB connection
const isDbConnected = () => mongoose.connection.readyState === 1;

// @route   GET /api/analytics
// @desc    Get agent dashboard analytics metrics
router.get("/", protectAgent, async (req, res) => {
  try {
    const agentId = req.agent._id;

    // Default response metrics structure
    const analyticsData = {
      metrics: {
        totalTrips: 0,
        activeTrips: 0,
        upcomingTrips: 0,
        totalTravelers: 0,
        revenue: 0,
        pendingBookings: 0,
        occupancyRate: 0,
        maleCount: 0,
        femaleCount: 0,
        otherCount: 0,
      },
      recentActivities: [],
      bookingsGraph: [
        { month: "Jan", Bookings: 0, Revenue: 0 },
        { month: "Feb", Bookings: 0, Revenue: 0 },
        { month: "Mar", Bookings: 0, Revenue: 0 },
      ],
      popularDestinations: [],
      topAgents: [],
    };

    if (!isDbConnected()) {
      console.warn("[Analytics API] Database not connected. Returning default analytics metrics.");
      return res.status(200).json(analyticsData);
    }

    // 1. Fetch Agent's Trips
    const agentTrips = await AgentTrip.find({ agent: agentId });
    const tripIds = agentTrips.map((t) => t._id);
    
    analyticsData.metrics.totalTrips = agentTrips.length;
    
    const now = new Date();
    agentTrips.forEach((trip) => {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      if (now >= startDate && now <= endDate) {
        analyticsData.metrics.activeTrips += 1;
      } else if (startDate > now) {
        analyticsData.metrics.upcomingTrips += 1;
      }
    });

    // 2. Fetch Bookings for Agent's Trips
    let bookings = [];
    if (tripIds.length > 0) {
      bookings = await Booking.find({ agentTrip: { $in: tripIds } });
    }

    // 3. Compute Booking Metrics
    bookings.forEach((booking) => {
      if (booking.paymentStatus === "Paid") {
        analyticsData.metrics.revenue += booking.pricePaid || 0;
        analyticsData.metrics.totalTravelers += booking.seats || 0;

        // Gender split
        const gender = booking.gender ? booking.gender.toLowerCase() : "other";
        if (gender === "male") {
          analyticsData.metrics.maleCount += booking.seats || 0;
        } else if (gender === "female") {
          analyticsData.metrics.femaleCount += booking.seats || 0;
        } else {
          analyticsData.metrics.otherCount += booking.seats || 0;
        }
      } else if (booking.paymentStatus === "Pending") {
        analyticsData.metrics.pendingBookings += 1;
      }
    });

    // Compute Occupancy Rate
    let totalMaxSeats = 0;
    agentTrips.forEach((trip) => {
      totalMaxSeats += trip.totalSeats || trip.maxSeats || 20; // fallback to 20 seats
    });
    if (totalMaxSeats > 0) {
      analyticsData.metrics.occupancyRate = Math.round(
        (analyticsData.metrics.totalTravelers / totalMaxSeats) * 100
      );
    }

    // 4. Populate Popular Destinations
    const destMap = {};
    agentTrips.forEach((trip) => {
      if (trip.destination) {
        destMap[trip.destination] = (destMap[trip.destination] || 0) + 1;
      }
    });
    analyticsData.popularDestinations = Object.entries(destMap)
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Populate Bookings Graph Points (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const graphMap = {};
    
    // Initialize graph points for last 3 months
    for (let i = 2; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = monthNames[d.getMonth()];
      graphMap[mName] = { month: mName, Bookings: 0, Revenue: 0 };
    }

    bookings.forEach((booking) => {
      if (booking.bookingDate && booking.paymentStatus === "Paid") {
        const bDate = new Date(booking.bookingDate);
        const mName = monthNames[bDate.getMonth()];
        if (graphMap[mName]) {
          graphMap[mName].Bookings += booking.seats || 1;
          graphMap[mName].Revenue += booking.pricePaid || 0;
        }
      }
    });
    analyticsData.bookingsGraph = Object.values(graphMap);

    // 6. Recent bookings activity log
    analyticsData.recentActivities = bookings
      .slice(-10)
      .reverse()
      .map((b) => ({
        id: b._id.toString(),
        type: b.paymentStatus.toLowerCase(),
        travelerName: b.travelerName || "Guest Traveler",
        description: `Reserved ${b.seats} seat(s) for Trip`,
        timestamp: b.bookingDate || new Date().toISOString(),
      }));

    // 7. Today's active boarding stats
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTrips = await AgentTrip.find({ agent: agentId, startDate: todayStr });
    const liveBoarding = [];
    for (const trip of todayTrips) {
      const tripBookings = await Booking.find({ agentTrip: trip._id, paymentStatus: "Paid" });
      const total = tripBookings.reduce((s, b) => s + (b.seats || 1), 0);
      const boarded = tripBookings.filter(b => b.boardingStatus === "boarded").length;
      const pending = tripBookings.filter(b => b.boardingStatus === "not_boarded").length;
      liveBoarding.push({
        tripId: trip._id.toString(),
        title: trip.title,
        busNumber: trip.busNumber,
        total,
        boarded,
        pending,
        occupancyPct: total ? Math.round((boarded / total) * 100) : 0
      });
    }
    analyticsData.liveBoarding = liveBoarding;

    return res.status(200).json(analyticsData);
  } catch (err) {
    console.error("[Analytics API] Error computing agent dashboard analytics:", err);
    return res.status(500).json({
      success: false,
      message: "Server error occurred while computing dashboard metrics.",
    });
  }
});

export default router;
