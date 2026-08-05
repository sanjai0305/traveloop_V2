import express from "express";
import protectAgent from "../middleware/agentAuthMiddleware.js";
import supabase from "../config/supabase.js";

const router = express.Router();

router.get("/", protectAgent, async (req, res) => {
  try {
    const agentId = req.agent.id;

    const { data: agentTrips } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("agent_id", agentId);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("agent_id", agentId);

    const analyticsData = {
      metrics: {
        totalTrips: agentTrips?.length || 0,
        activeTrips: agentTrips?.filter((t) => t.status === "ACTIVE")?.length || 0,
        upcomingTrips: agentTrips?.filter((t) => t.status === "UPCOMING")?.length || 0,
        totalTravelers: bookings?.length || 0,
        revenue: (bookings || []).reduce((acc, b) => acc + Number(b.final_amount || 0), 0),
        pendingBookings: 0,
        occupancyRate: 85,
      },
      recentActivities: [],
      bookingsGraph: [
        { month: "Jan", Bookings: 5, Revenue: 50000 },
        { month: "Feb", Bookings: 8, Revenue: 80000 },
        { month: "Mar", Bookings: 12, Revenue: 120000 },
      ],
      popularDestinations: [],
      topAgents: [],
    };

    return res.status(200).json(analyticsData);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
