import User from "../models/User.js";
import Agent from "../models/Agent.js";
import AgentTrip from "../models/AgentTrip.js";
import Booking from "../models/Booking.js";
import { addSyncJob } from "../config/bullmq.js";

/** Daily sync/reconciliation job to ensure graph remains fully consistent with MongoDB */
export const runReconciliationJob = async () => {
  console.log("[Reconciliation Job] Checking database sync levels between MongoDB and Neo4j...");
  try {
    // 1. Sync all Users
    const users = await User.find({});
    for (const u of users) {
      await addSyncJob("USER_SYNC", {
        userId: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
      });
    }

    // 2. Sync all Agents
    const agents = await Agent.find({});
    for (const a of agents) {
      await addSyncJob("AGENT_SYNC", {
        agentId: a._id,
        displayName: a.displayName || a.companyName,
        email: a.email,
      });
    }

    // 3. Sync all Trips
    const trips = await AgentTrip.find({ isDeleted: { $ne: true } });
    for (const t of trips) {
      await addSyncJob("TRIP_SYNC", {
        tripId: t._id,
        title: t.title,
        originCity: t.originCity,
        destinations: t.destinations,
        startDate: t.startDate,
        duration: t.duration,
      });
    }

    // 4. Sync all Bookings
    const bookings = await Booking.find({});
    for (const b of bookings) {
      await addSyncJob("BOOKING_SYNC", {
        userId: b.userId,
        tripId: b.tripId,
        bookingId: b.bookingId,
        seatNumbers: b.seatNumbers,
        pricePaid: b.pricePaid,
        paymentStatus: b.paymentStatus,
      });
    }

    console.log(`[Reconciliation Job] Completed. Enqueued sync checks for ${users.length} users, ${agents.length} agents, ${trips.length} trips, and ${bookings.length} bookings.`);
  } catch (error) {
    console.error("[Reconciliation Job] Failed:", error.message);
  }
};

export default runReconciliationJob;
