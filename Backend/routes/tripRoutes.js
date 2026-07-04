import express from "express";

import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  generateShareToken,
  getSharedTrip,
  cloneTrip,
  getActivitiesRecommendations,
  getDestinationsAutocomplete,
  getDestinationDetails,
  getNearbyDestinations,
  inviteCollaborator,
  getCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
  acceptInvite,
  declineInvite,
  getActivityLogs,
  addExpense,
  deleteExpense,
  addSettlement,
  getExchangeRates,
  exportTripPDF,
} from "../controllers/tripController.js";
import protect from "../middleware/authMiddleware.js";
import AgentTrip from "../models/AgentTrip.js";
import Booking from "../models/Booking.js";
import Agent from "../models/Agent.js";

const router = express.Router();

// ── Published Marketplace Routes ───────────────────────────────────────────

// 1. Get all published trips
router.get("/published", async (req, res) => {
  try {
    const data = await AgentTrip.find({
      isDeleted: { $ne: true },
      $or: [{ status: "published" }, { publishStatus: "published" }]
    }).populate("agentId", "companyName email").sort({ createdAt: -1 });

    const now = new Date();
    const trips = (data || [])
      .map(t => {
        const mapped = { ...t.toObject(), _id: t._id };
        if (mapped.agentId) {
          // Flatten companyName/email to match client assumptions if needed
          mapped.agent = {
            _id: mapped.agentId._id,
            displayName: mapped.agentId.companyName,
            companyName: mapped.agentId.companyName,
            email: mapped.agentId.email,
            logo: "",
            profileImage: "",
            phone: ""
          };
        }
        return mapped;
      })
      .filter(t => {
        if (t.bookingDeadline) {
          const deadline = new Date(t.bookingDeadline);
          if (!isNaN(deadline.getTime()) && deadline < now) return false;
        }
        if (t.startDate) {
          const start = new Date(t.startDate);
          if (!isNaN(start.getTime()) && start < now) return false;
        }
        return true;
      });

    res.status(200).json({
      success: true,
      trips,
    });
  } catch (error) {
    console.error("[Published Trips] Fetch error:", error);
    res.status(500).json({ success: false, message: "Error retrieving published trips" });
  }
});

// 1b. Publish trip (user / general auth)
router.put("/:id/publish", protect, async (req, res) => {
  try {
    const trip = await AgentTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    trip.status = "published";
    trip.publishStatus = "published";
    trip.publishedAt = new Date();
    await trip.save();

    res.status(200).json({
      success: true,
      message: "Trip published successfully",
      trip,
    });
  } catch (error) {
    console.error("[Published Trips] Publish error:", error);
    res.status(500).json({ success: false, message: "Error publishing trip" });
  }
});

// 2. Get specific published trip detail
router.get("/published/:id", async (req, res) => {
  try {
    const tripData = await AgentTrip.findById(req.params.id).populate("agentId", "companyName email");

    if (!tripData) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = { ...tripData.toObject(), _id: tripData._id };
    if (trip.agentId) {
      trip.agent = {
        _id: trip.agentId._id,
        displayName: trip.agentId.companyName,
        companyName: trip.agentId.companyName,
        email: trip.agentId.email,
        logo: "",
        profileImage: "",
        phone: ""
      };
    }

    // Fetch all bookings for this trip to extract booked seat numbers
    const bookingsData = await Booking.find({
      tripId: trip._id,
      paymentStatus: { $ne: "Cancelled" }
    });

    const bookings = (bookingsData || []).map(b => ({ ...b.toObject(), _id: b._id }));
    const bookedSeatNumbers = bookings.reduce((seats, b) => {
      if (b.assignedSeat) {
        seats.push(b.assignedSeat);
      }
      return seats;
    }, []);


    res.status(200).json({
      success: true,
      trip,
      bookedSeatNumbers,
    });
  } catch (error) {
    console.error("[Published Trips] Detail error:", error);
    res.status(500).json({ success: false, message: "Error retrieving trip details" });
  }
});

// 3. Book a published trip
router.post("/published/:id/book", protect, async (req, res) => {
  const { travelerName, gender, contactNumber, age, seats, maleCount, femaleCount } = req.body;

  if (!travelerName || !gender || !contactNumber || !age || !seats) {
    return res.status(400).json({ success: false, message: "All booking details are required" });
  }

  try {
    const trip = await AgentTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (trip.availableSeats < seats) {
      return res.status(400).json({ success: false, message: "Not enough available seats left" });
    }

    const price = trip.offerPrice || trip.pricePerPerson || 0;
    const pricePaid = price * seats;
    const bookingId = `TLP-${Math.floor(10000 + Math.random() * 90000)}`;

    const booking = await Booking.create({
      bookingId,
      travelerName,
      gender,
      contactNumber,
      age: Number(age),
      seats: Number(seats),
      agentTrip: trip._id,
      agent: trip.agent,
      pricePaid,
      paymentStatus: "Paid", // Automatically marked paid for marketplace flow
    });

    // Update trip seat counters
    trip.availableSeats -= seats;
    trip.bookedSeats = (trip.bookedSeats || 0) + seats;
    if (maleCount) trip.maleCount = (trip.maleCount || 0) + Number(maleCount);
    if (femaleCount) trip.femaleCount = (trip.femaleCount || 0) + Number(femaleCount);

    await trip.save();

    res.status(201).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("[Published Trips] Booking error:", error);
    res.status(500).json({ success: false, message: "Error processing trip booking" });
  }
});

router.post(
  "/create",
  protect,
  createTrip
);

router.get(
  "/",
  protect,
  getTrips
);

router.get(
  "/destinations/autocomplete",
  protect,
  getDestinationsAutocomplete
);

router.get(
  "/destinations/details",
  protect,
  getDestinationDetails
);

// V1.6 Smart Explore — nearby tourist attractions
router.get(
  "/destinations/nearby",
  protect,
  getNearbyDestinations
);

router.get(
  "/exchange-rates",
  protect,
  getExchangeRates
);

router.get(
  "/shared/:token",
  getSharedTrip
);

router.get(
  "/:id/pdf",
  protect,
  exportTripPDF
);

router.get(
  "/:id",
  protect,
  getTripById
);

router.put(
  "/:id",
  protect,
  updateTrip
);

router.delete(
  "/:id",
  protect,
  deleteTrip
);

router.post(
  "/:id/expenses",
  protect,
  addExpense
);

router.delete(
  "/:id/expenses/:expenseId",
  protect,
  deleteExpense
);

router.post(
  "/:id/settlements",
  protect,
  addSettlement
);

router.post(
  "/:id/share",
  protect,
  generateShareToken
);

router.post(
  "/:id/clone",
  protect,
  cloneTrip
);

router.get(
  "/:id/recommendations",
  protect,
  getActivitiesRecommendations
);

// V1.4 Collaboration routes
router.post("/:id/invite", protect, inviteCollaborator);
router.get("/:id/collaborators", protect, getCollaborators);
router.delete("/:id/collaborators/:userId", protect, removeCollaborator);
router.put("/:id/collaborators/:userId", protect, updateCollaboratorRole);
router.post("/invite/:notificationId/accept", protect, acceptInvite);
router.post("/invite/:notificationId/decline", protect, declineInvite);
router.get("/:id/activity-log", protect, getActivityLogs);

export default router;