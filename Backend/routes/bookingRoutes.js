import express from "express";
import mongoose from "mongoose";
import protect from "../middleware/authMiddleware.js";
import Booking from "../models/Booking.js";
import AgentTrip from "../models/AgentTrip.js";
import Trip from "../models/Trip.js";
import Itinerary from "../models/Itinerary.js";
import Budget from "../models/Budget.js";
import Checklist from "../models/Checklist.js";
import BookingService from "../services/BookingService.js";
import Passenger from "../models/Passenger.js";
import SeatBooking from "../models/SeatBooking.js";
import redisClient from "../config/redis.js";


const router = express.Router();


// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Destination-based smart activity suggestion engine.
 */
const DESTINATION_ACTIVITIES = {
  yercaud: [
    { day: 1, time: "07:00", title: "Sunrise walk at Yercaud Lake", category: "Activity", note: "Serene morning walk around the lake — bring a camera!" },
    { day: 1, time: "08:30", title: "Breakfast at hotel", category: "Food", note: "Start the day with local South Indian breakfast" },
    { day: 1, time: "10:00", title: "Botanical Garden visit", category: "Sightseeing", note: "Over 300 plant species — children will love the orchid section" },
    { day: 1, time: "12:30", title: "Lunch at a local restaurant", category: "Food", note: "Try local Tamil cuisine and fresh hill coffee" },
    { day: 1, time: "14:00", title: "Shevaroy Hills Temple", category: "Sightseeing", note: "Scenic viewpoint and ancient Shevaroy temple at the peak" },
    { day: 1, time: "16:00", title: "Pagoda Point viewpoint", category: "Sightseeing", note: "360° panoramic view of Salem city and valleys" },
    { day: 1, time: "18:00", title: "Campfire & group bonding", category: "Activity", note: "Evening campfire — organized by hotel / group activity" },
    { day: 1, time: "20:00", title: "Group dinner", category: "Food", note: "BBQ or buffet dinner with the group" },
    { day: 2, time: "07:30", title: "Sunrise photography session", category: "Activity", note: "Golden hour photography from the hilltop" },
    { day: 2, time: "09:00", title: "Boating at Yercaud Lake", category: "Activity", note: "Paddle boats and row boats available — book at the lake" },
    { day: 2, time: "11:00", title: "Anna Park & Children's Park", category: "Sightseeing", note: "Beautiful rose gardens and walking tracks" },
    { day: 2, time: "13:00", title: "Farewell lunch", category: "Food", note: "Last meal before departure" },
  ],
  goa: [
    { day: 1, time: "09:00", title: "Calangute Beach morning walk", category: "Activity", note: "Most popular beach in Goa — great for swimming" },
    { day: 1, time: "11:00", title: "Water sports at Baga Beach", category: "Activity", note: "Parasailing, jet ski, banana boat rides" },
    { day: 1, time: "13:30", title: "Seafood lunch at beach shack", category: "Food", note: "Try Goan fish curry, prawn masala, and sol kadhi" },
    { day: 1, time: "16:00", title: "Anjuna Flea Market", category: "Activity", note: "Local handicrafts, clothes, jewelry" },
    { day: 1, time: "18:30", title: "Sunset cruise", category: "Activity", note: "Mandovi River cruise — live music and sunset views" },
    { day: 1, time: "21:00", title: "Nightlife at Tito's Lane", category: "Activity", note: "Pubs and cafes along the famous strip" },
    { day: 2, time: "08:00", title: "Old Goa churches tour", category: "Sightseeing", note: "UNESCO World Heritage — Basilica of Bom Jesus, Se Cathedral" },
    { day: 2, time: "11:00", title: "Dudhsagar Waterfall trip", category: "Sightseeing", note: "Spectacular 4-tiered waterfall — jeep safari from Mollem" },
    { day: 2, time: "14:00", title: "Lunch at Panjim cafes", category: "Food", note: "Portuguese-influenced Goan cuisine in Fontainhas quarter" },
    { day: 2, time: "17:00", title: "Arambol Beach sunset", category: "Activity", note: "Hippie vibe beach — drum circles at sunset" },
  ]
};

const generateAISuggestedActivities = (dest, days) => {
  const norm = (dest || "").toLowerCase().trim();
  let base = DESTINATION_ACTIVITIES[norm];
  if (!base) {
    // Check partial matches
    const key = Object.keys(DESTINATION_ACTIVITIES).find(k => norm.includes(k));
    base = key ? DESTINATION_ACTIVITIES[key] : null;
  }
  if (!base) {
    // generic fallback
    base = [
      { day: 1, time: "09:00", title: `Explore main spots in ${dest}`, category: "Sightseeing", note: "Enjoy the local views and landmarks" },
      { day: 1, time: "13:00", title: "Lunch at highly-rated restaurant", category: "Food", note: "Try local authentic dishes" },
      { day: 1, time: "16:00", title: "Evening walk & market shopping", category: "Activity", note: "Pick up local souvenirs and explore streets" },
      { day: 2, time: "09:00", title: "Local cultural tour", category: "Sightseeing", note: "Visit museums or historical landmarks nearby" },
    ];
  }
  return base.filter(a => a.day <= days);
};

const generatePackingItems = (agentTrip) => {
  const dest = (agentTrip.title || "").toLowerCase();
  const list = [
    { item: "ID Card / Ticket printout", category: "Documents" },
    { item: "Phone Charger & Powerbank", category: "Electronics" },
    { item: "Toiletries Kit", category: "Toiletries" },
    { item: "Comfortable clothes", category: "Clothes" },
  ];
  if (dest.includes("yercaud") || dest.includes("hill") || dest.includes("ooty")) {
    list.push({ item: "Warm jacket / Sweater", category: "Clothes" });
    list.push({ item: "Motion sickness pills", category: "Health" });
  }
  return list;
};

const parseItineraryDescription = (day, desc) => {
  if (!desc) return [];
  const lines = desc.split("\n");
  const events = [];
  lines.forEach(line => {
    const timeMatch = line.match(/^(\d{2}:\d{2})\s*[:-]?\s*(.*)/);
    if (timeMatch) {
      events.push({
        time: timeMatch[1],
        title: timeMatch[2].trim(),
      });
    }
  });
  return events;
};

const cloneAgentTripToUserTrip = async (booking, agentTrip, userId, totalAmount) => {
  const destination = (agentTrip.destinations || [])[0] || agentTrip.title || "Trip";

  const newTrip = await Trip.create({
    userId,
    image: agentTrip.coverImage || "",
    title: agentTrip.title,
    destination,
    startDate: agentTrip.startDate || null,
    endDate: agentTrip.endDate || null,
    budget: totalAmount,
    isPublic: false,
    status: "planning",
  });

  const userTrip = { ...newTrip.toObject(), _id: newTrip._id };

  // Clone itinerary
  await Itinerary.create({
    tripId: userTrip._id,
    day: 1,
    title: `Departure to ${destination}`,
    description: agentTrip.pickupLocation ? `Pickup from: ${agentTrip.pickupLocation}` : "",
  });

  // Seed Budget
  await Budget.create({
    tripId: userTrip._id,
    totalBudget: totalAmount,
    isArchived: false,
    isActive: true,
  });

  // Seed Checklist
  const packingItems = generatePackingItems(agentTrip);
  if (packingItems.length > 0) {
    const checkListInserts = packingItems.map(p => ({
      tripId: userTrip._id,
      userId,
      itemName: p.item,
      item: p.item,
      category: p.category,
      packed: false,
      checked: false,
    }));
    await Checklist.insertMany(checkListInserts);
  }

  // Seed AI suggested activities
  try {
    const daysStr = (agentTrip.duration || "").match(/(\d+)/)?.[1];
    const tripDays = daysStr ? parseInt(daysStr) : 1;
    const aiActivities = generateAISuggestedActivities(destination, tripDays);
    if (aiActivities.length > 0) {
      const aiInserts = aiActivities.map(a => ({
        tripId: userTrip._id,
        day: a.day,
        title: a.title,
        description: a.note || "",
        isAiSuggestion: true,
        aiSource: a.aiSource || "traveloop-destination-engine-v1",
      }));
      await Itinerary.insertMany(aiInserts);
    }
  } catch (aiErr) {
    console.warn("[AI Activities] Failed to seed AI suggestions:", aiErr.message);
  }

  return userTrip;
};

// ─── ENDPOINTS ───────────────────────────────────────────────────────────────

// POST /api/bookings
router.post("/", protect, async (req, res) => {
  const {
    tripId,
    maleCount = 0,
    femaleCount = 0,
    adults = 1,
    children = 0,
    travellers = [],
    totalAmount = 0,
    seatNumbers = [],
    pickupLocation = "",
  } = req.body;

  if (!tripId) {
    return res.status(400).json({ success: false, message: "tripId is required" });
  }

  if (!travellers || travellers.length === 0) {
    return res.status(400).json({ success: false, message: "At least one traveller details required" });
  }

  try {
    const userId = req.user._id || req.user.id;

    // Check if booking already exists for this user and trip (and is not cancelled)
    const existingBooking = await Booking.findOne({
      userId,
      tripId,
      status: { $ne: "cancelled" }
    });

    if (existingBooking) {
      return res.status(200).json({
        success: true,
        action: "UPDATE_EXISTING_BOOKING",
        bookingId: existingBooking._id
      });
    }

    const { booking, userTrip } = await BookingService.createBooking({
      tripId,
      userId,
      travellers,
      seats: travellers.length,
      seatNumbers,
      totalAmount,
      paymentStatus: "Paid",
      bookingStatus: "confirmed",
      paymentVerified: true,
      paymentDate: new Date(),
      maleCount,
      femaleCount,
      adults,
      children,
      pickupLocation,
      contactNumber: travellers[0]?.phone || req.user.phone || req.user.email,
    });

    res.status(201).json({
      success: true,
      bookingId: booking.bookingId,
      booking,
      userTripId: userTrip ? userTrip._id : null,
    });
  } catch (error) {
    console.error("[Create Booking] Error:", error);
    const status = [
      "Bookings closed for this trip",
      "Not enough available seats left on this trip",
      "Trip not found"
    ].includes(error.message) ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || "Server Error processing trip booking" });
  }
});

// GET /api/bookings/my-bookings
router.get("/my-bookings", protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const bookingsList = await Booking.find({ userId }).populate("tripId");

    const bookings = (bookingsList || []).map(b => {
      const obj = b.toObject ? b.toObject() : b;
      const tripDoc = obj.tripId;
      return {
        ...obj,
        _id: b._id,
        agentTrip: {
          _id: tripDoc?._id || b.tripId,
          title: tripDoc?.title || "Yercaud Trip",
          boardingStatus: tripDoc?.boardingStatus || "CLOSED",
        },
      };
    });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("[My Bookings] Error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving bookings" });
  }
});

// PUT /api/bookings/:bookingId/notes
router.put("/:bookingId/notes", protect, async (req, res) => {
  try {
    const { notes } = req.body;
    const { bookingId } = req.params;
    const userId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" });
    }

    const bookingRow = await Booking.findOne({ _id: bookingId, userId });

    if (!bookingRow) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    await Booking.findByIdAndUpdate(bookingId, { assignedSeat: notes || "" });

    res.status(200).json({
      success: true,
      message: "Notes updated successfully",
      personalNotes: notes || "",
    });
  } catch (error) {
    console.error("[Update Notes] Error:", error);
    res.status(500).json({ success: false, message: "Server Error updating notes" });
  }
});

// GET /api/bookings/:bookingId/user-trip
router.get("/:bookingId/user-trip", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" });
    }

    const bookingRow = await Booking.findOne({ _id: bookingId, userId });

    if (!bookingRow) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const trip = await AgentTrip.findById(bookingRow.tripId);

    const booking = {
      ...bookingRow.toObject(),
      _id: bookingRow._id,
      agentTrip: trip ? { ...trip.toObject(), _id: trip._id } : null,
    };

    res.status(200).json({
      success: true,
      booking,
      trip: booking.agentTrip || null,
      driver: null,
      seat: null,
      boardingPass: null,
      agency: null,
      userTrip: null,
      boardingAvailable: booking.agentTrip && booking.agentTrip.boardingStatus === "OPEN",
    });
  } catch (error) {
    console.error("[Booking User Trip] Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// POST /api/bookings/:bookingId/cancel
router.post("/:bookingId/cancel", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.paymentStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: "Cancelled" },
      { returnDocument: "after" }
    );

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking: {
        ...updatedBooking.toObject(),
        _id: updatedBooking._id,
      },
    });
  } catch (error) {
    console.error("[Cancel Booking] Error:", error);
    res.status(500).json({ success: false, message: "Server Error cancelling booking" });
  }
});

// GET /api/bookings/my
router.get("/my", protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const bookingsList = await Booking.find({
      userId,
      paymentStatus: { $ne: "Cancelled" }
    }).populate("tripId");

    const bookings = (bookingsList || []).map(b => {
      const obj = b.toObject ? b.toObject() : b;
      const tripDoc = obj.tripId;
      return {
        ...obj,
        _id: b._id,
        agentTrip: {
          _id: tripDoc?._id || b.tripId,
          title: tripDoc?.title || "Yercaud Weekend Escapade",
          boardingStatus: tripDoc?.boardingStatus || "CLOSED",
        },
      };
    });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("[Get Confirmed Bookings] Error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving bookings" });
  }
});

// GET /api/bookings/ticket/:bookingId
// Returns booking + per-passenger QR payloads for ticket rendering
router.get("/ticket/:bookingId", protect, async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findOne({
      $or: [
        { bookingId },
        { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null },
      ].filter(Boolean),
    }).populate("tripId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const passengers = await Passenger.find({ bookingId: booking._id }).lean();
    const trip = booking.tripId;

    // Synthesize from booking.travellers if no Passenger docs exist (legacy bookings)
    let finalPassengers = passengers;
    if (finalPassengers.length === 0 && booking.travellers?.length > 0) {
      finalPassengers = booking.travellers.map((t, idx) => {
        const seatNum = (booking.seatNumbers || [])[idx] || `S${idx + 1}`;
        const payload = {
          bookingId: booking.bookingId,
          tripId: String(booking.tripId?._id || booking.tripId),
          passenger: t.name,
          seat: seatNum,
          gender: t.gender,
          age: t.age,
        };
        return {
          name: t.name,
          age: t.age,
          gender: t.gender,
          phone: t.phone || "",
          seatNumber: seatNum,
          qrPayload: payload,
          qrString: JSON.stringify(payload),
        };
      });
    }

    res.status(200).json({
      success: true,
      booking: {
        bookingId: booking.bookingId,
        _id: booking._id,
        tripTitle: trip?.title || "Bus Trip",
        startDate: trip?.startDate,
        pickupLocation: booking.pickupLocation || trip?.pickupLocation || "",
        totalAmount: booking.pricePaid || booking.amount || 0,
        paymentStatus: booking.paymentStatus,
        qrUnlocked: booking.qrUnlocked,
      },
      passengers: finalPassengers,
      passengerCount: finalPassengers.length,
    });
  } catch (error) {
    console.error("[Ticket Fetch] Error:", error);
    res.status(500).json({ success: false, message: "Server Error fetching ticket" });
  }
});

/**
 * GET /api/bookings/:bookingId
 * Returns booking details.
 */
router.get("/:bookingId", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({
      $or: [
        { bookingId },
        { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null }
      ].filter(Boolean)
    }).populate("tripId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error("[Booking Fetch] Error:", error);
    res.status(500).json({ success: false, message: "Server Error fetching booking" });
  }
});

/**
 * POST /api/bookings/confirm
 * Confirms all passengers and seats for a booking in one request.
 * Accepts: { bookingId, travellers, tripId }
 */
router.post("/confirm", protect, async (req, res) => {
  const { bookingId, travellers, tripId } = req.body;
  const userId = req.user._id || req.user.id;

  if (!bookingId || !tripId || !travellers) {
    return res.status(400).json({ success: false, message: "bookingId, tripId, and travellers are required" });
  }

  try {
    const booking = await Booking.findOne({
      $or: [
        { bookingId },
        { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null },
      ].filter(Boolean),
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Update booking status
    booking.paymentStatus = "Paid";
    booking.status = "Paid";
    booking.bookingStatus = "confirmed";
    booking.paymentVerified = true;
    booking.paymentDate = new Date();
    await booking.save();

    const createdPassengers = [];

    for (let i = 0; i < travellers.length; i++) {
      const pData = travellers[i];
      const seatNumber = pData.seatNumber;

      if (!seatNumber) continue;

      // 1. Create/update Passenger document
      const passenger = await Passenger.findOneAndUpdate(
        { bookingId: booking._id, seatNumber },
        {
          bookingId: booking._id,
          bookingRef: booking.bookingId,
          tripId,
          userId,
          name: pData.name || "",
          age: Number(pData.age) || 0,
          gender: pData.gender || "Other",
          phone: pData.phone || "",
          emergencyContact: pData.emergencyContact || "",
          seatNumber,
          seatPreference: pData.seatPreference || "No Preference",
          specialRequest: pData.specialRequest || "",
          status: "active",
          paymentStatus: "completed",
          qrPayload: {
            bookingId: booking.bookingId || String(booking._id),
            tripId: String(tripId),
            passenger: pData.name,
            seat: seatNumber,
            gender: pData.gender,
            age: pData.age,
            timestamp: new Date().toISOString(),
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      createdPassengers.push(passenger);

      // 2. Mark SeatBooking as booked
      await SeatBooking.updateOne(
        { tripId, seatNumber },
        {
          status: "booked",
          bookingId: booking._id,
          passengerId: passenger._id,
          passengerName: pData.name || "",
          gender: pData.gender || "Other",
          age: Number(pData.age) || 0,
          paymentStatus: "completed",
          reservedUntil: null,
        }
      );

      // 3. Clear Redis lock if it exists
      if (redisClient) {
        const key = `seat_lock:${tripId}:${seatNumber}`;
        await redisClient.del(key);
      }

      // 4. Emit live seat update
      const io = req.app.get("io");
      if (io) {
        io.to(`trip_${tripId}`).emit("seat_update", {
          tripId,
          seatNumber,
          status: "booked",
          gender: pData.gender || "Other",
          passengerName: pData.name || "",
          age: pData.age || 0,
        });
      }
    }

    res.status(200).json({
      success: true,
      booking,
      passengers: createdPassengers,
      message: "Booking and seat reservations confirmed successfully",
    });
  } catch (error) {
    console.error("[Booking Confirm] Error:", error);
    res.status(500).json({ success: false, message: "Server Error confirming booking" });
  }
});

// Cancellation OTP map storage
const cancelOtps = new Map();

// @route   POST /api/bookings/:bookingId/send-cancel-otp
// @desc    Generate and send cancellation OTPs to mobile and email
// @access  Private (Traveler)
router.post("/:bookingId/send-cancel-otp", protect, async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id || req.user._id;

  try {
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const email = booking.travellers?.[0]?.email || req.user.email;
    const phone = booking.travellers?.[0]?.phone || booking.contactNumber || req.user.phone || "";

    if (!email) {
      return res.status(400).json({ success: false, message: "No email address found for this booking" });
    }

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    cancelOtps.set(bookingId.toString(), {
      emailOtp,
      mobileOtp,
      expiresAt
    });

    console.log(`[Cancellation OTP] Session created for Booking: ${bookingId}`);

    try {
      const { sendOtpEmail } = await import("../services/emailService.js");
      await sendOtpEmail(email, emailOtp);
    } catch (emailErr) {
      console.error("Failed to send cancellation OTP email:", emailErr);
    }

    res.status(200).json({
      success: true,
      message: "Cancellation OTPs sent successfully.",
    });
  } catch (error) {
    console.error("[Send Cancel OTP Error]:", error);
    res.status(500).json({ success: false, message: "Server error sending cancellation OTP" });
  }
});

// @route   POST /api/bookings/:bookingId/verify-cancel-otp
// @desc    Verify cancellation OTPs and process refund
// @access  Private (Traveler)
router.post("/:bookingId/verify-cancel-otp", protect, async (req, res) => {
  const { bookingId } = req.params;
  const { emailOtp, mobileOtp } = req.body;
  const userId = req.user.id || req.user._id;

  if (!emailOtp || !mobileOtp) {
    return res.status(400).json({ success: false, message: "Both email and mobile OTPs are required." });
  }

  try {
    const booking = await Booking.findOne({ _id: bookingId, userId }).populate("tripId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.paymentStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }

    const key = bookingId.toString();
    const record = cancelOtps.get(key);

    if (!record) {
      return res.status(400).json({ success: false, message: "Cancellation OTP not requested or expired." });
    }

    if (Date.now() > record.expiresAt) {
      cancelOtps.delete(key);
      return res.status(400).json({ success: false, message: "Cancellation OTPs expired. Please try again." });
    }

    if (record.emailOtp !== emailOtp || record.mobileOtp !== mobileOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTPs. Please try again." });
    }

    cancelOtps.delete(key);
    
    // 1. Update Booking status
    booking.paymentStatus = "Cancelled";
    booking.bookingStatus = "cancelled";
    booking.status = "Cancelled";
    booking.refundStatus = "Refund Initiated";
    await booking.save();

    // 2. Release seat booking from seat collections
    const SeatBooking = mongoose.model("SeatBooking");
    await SeatBooking.deleteMany({ bookingId: booking._id });

    // 3. Increment trip available seats
    const AgentTrip = mongoose.model("AgentTrip");
    const trip = await AgentTrip.findById(booking.tripId);
    if (trip) {
      trip.bookedSeats = Math.max(0, (trip.bookedSeats || 0) - booking.seats);
      trip.availableSeats = (trip.availableSeats || 0) + booking.seats;
      const totalS = trip.totalSeats || 40;
      trip.occupancy = totalS > 0 ? Math.round((trip.bookedSeats / totalS) * 100) : 0;
      trip.occupancyRate = trip.occupancy;
      await trip.save();
    }

    // 4. Emit live seat updates for all released seats
    const io = req.app.get("io");
    if (io && booking.seatNumbers?.length > 0) {
      booking.seatNumbers.forEach(seatNum => {
        io.to(`trip_${booking.tripId?._id || booking.tripId}`).emit("seat_update", {
          tripId: booking.tripId?._id || booking.tripId,
          seatNumber: seatNum,
          status: "available",
          gender: null,
          passengerName: null,
          age: null
        });
      });
    }

    // 5. Send cancellation email
    const email = booking.travellers?.[0]?.email || req.user.email;
    if (email) {
      try {
        console.log(`[Cancellation Email Sent] Booking ${booking.bookingId} cancelled for ${email}`);
      } catch (emailErr) {
        console.error("Failed to send cancellation confirmation email:", emailErr);
      }
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled and refund initiated successfully.",
      booking
    });
  } catch (error) {
    console.error("[Verify Cancel OTP Error]:", error);
    res.status(500).json({ success: false, message: "Server error during cancellation" });
  }
});

export default router;
