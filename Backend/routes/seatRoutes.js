/**
 * seatRoutes.js — Real-time Seat Reservation API
 *
 * GET    /api/seats/:tripId          → Full seat map with live status + passenger metadata
 * POST   /api/seats/reserve          → Lock seat in Redis (10 min TTL), set status=reserved
 * POST   /api/seats/release          → Release seat lock (called on payment cancel / timeout)
 * POST   /api/seats/confirm          → Mark seat as booked after successful payment
 * GET    /api/seats/ticket/:bookingId → Return booking + per-passenger QR payloads
 */

import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import protect from "../middleware/authMiddleware.js";
import AgentTrip from "../models/AgentTrip.js";
import Booking from "../models/Booking.js";
import SeatBooking from "../models/SeatBooking.js";
import Passenger from "../models/Passenger.js";
import redisClient from "../config/redis.js";

const router = express.Router();

// ─── SEAT LAYOUT GENERATOR ────────────────────────────────────────────────────

/**
 * Generate a seat layout grid for a bus.
 * Layout: rows A–J (up to 10 rows), 4 seats per row (window+aisle × 2 sides)
 * with an aisle gap between col 2 and col 3.
 * e.g. totalSeats=40 → rows A–E, 8 seats/row... adjusted to fit.
 */
const generateSeatLayout = (totalSeats = 40) => {
  const rows = "ABCDEFGHIJ".split("");
  // Standard Volvo sleeper: 2+1 or 2+2 configuration
  // We'll use 2+2 (4 seats per row)
  const seatsPerRow = 4;
  const numRows = Math.ceil(totalSeats / seatsPerRow);
  const layout = [];

  let seatCount = 0;
  for (let r = 0; r < numRows && seatCount < totalSeats; r++) {
    const row = rows[r] || String(r + 1);
    for (let c = 1; c <= seatsPerRow && seatCount < totalSeats; c++) {
      layout.push({
        seatNumber: `${row}${c}`,
        row,
        col: c,
        isLower: c <= 2, // Cols 1–2 are lower berths, 3–4 upper berths (Volvo sleeper style)
      });
      seatCount++;
    }
  }
  return layout;
};

/**
 * Ensure SeatBooking records exist for a trip (idempotent seeding).
 */
const ensureTripSeatsExist = async (tripId, totalSeats) => {
  const existing = await SeatBooking.countDocuments({ tripId });
  if (existing > 0) return;

  const layout = generateSeatLayout(totalSeats);
  const docs = layout.map((s) => ({
    tripId,
    seatNumber: s.seatNumber,
    row: s.row,
    col: s.col,
    isLower: s.isLower,
    status: "available",
    paymentStatus: "none",
  }));

  try {
    await SeatBooking.insertMany(docs, { ordered: false });
  } catch (err) {
    // Ignore duplicate key errors on race conditions
    if (err.code !== 11000) throw err;
  }
};

// ─── REDIS SEAT LOCK HELPERS ──────────────────────────────────────────────────

const SEAT_LOCK_TTL = 300; // 5 minutes in seconds

const seatLockKey = (tripId, seatNumber) =>
  `seat_lock:${tripId}:${seatNumber}`;

/**
 * Acquire Redis lock for a seat.
 * Returns true if lock acquired, false if seat is already locked by someone else.
 */
const acquireSeatLock = async (tripId, seatNumber, userId) => {
  if (!redisClient || redisClient.status !== "ready") return true; // Graceful degradation if Redis is unavailable
  const key = seatLockKey(tripId, seatNumber);

  // Re-entrant lock check: if the current user already owns the lock, refresh TTL and succeed
  const currentLockOwner = await redisClient.get(key);
  if (currentLockOwner === String(userId)) {
    await redisClient.set(key, String(userId), "EX", SEAT_LOCK_TTL);
    return true;
  }

  // NX = only set if not exists, EX = expire in seconds
  const result = await redisClient.set(
    key,
    String(userId),
    "EX",
    SEAT_LOCK_TTL,
    "NX"
  );
  return result === "OK";
};

/**
 * Release Redis lock for a seat.
 * Only releases if the caller owns the lock (prevents accidental unlock by others).
 */
const releaseSeatLock = async (tripId, seatNumber, userId) => {
  if (!redisClient || redisClient.status !== "ready") return;
  const key = seatLockKey(tripId, seatNumber);
  const owner = await redisClient.get(key);
  if (owner === String(userId)) {
    await redisClient.del(key);
  }
};

/**
 * Check if a Redis lock exists for a seat (regardless of owner).
 */
const isSeatLocked = async (tripId, seatNumber) => {
  if (!redisClient || redisClient.status !== "ready") return false;
  const key = seatLockKey(tripId, seatNumber);
  const val = await redisClient.get(key);
  return val !== null;
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Build QR payload JSON for a passenger.
 */
const buildQRPayload = (booking, passenger) => ({
  bookingId: booking.bookingId || String(booking._id),
  tripId: String(booking.tripId),
  passenger: passenger.name,
  seat: passenger.seatNumber,
  gender: passenger.gender,
  age: passenger.age,
  passengerId: passenger.passengerId,
  timestamp: new Date().toISOString(),
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────

/**
 * GET /api/seats/:tripId
 * Returns the complete seat map for a trip.
 * Each seat carries its current status and passenger metadata (for booked seats).
 */
router.get("/:tripId", protect, async (req, res) => {
  const { tripId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid tripId" });
    }

    const trip = await AgentTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Lazily create seat records if they don't exist yet
    await ensureTripSeatsExist(tripId, trip.totalSeats || 40);

    // Fetch all seat records
    const seats = await SeatBooking.find({ tripId }).lean();

    // For each reserved seat, cross-check the Redis lock;
    // if the lock has expired but MongoDB still shows "reserved", auto-heal to "available"
    const now = new Date();
    const healPromises = [];

    const enrichedSeats = seats.map((seat) => {
      if (seat.status === "reserved" && seat.reservedUntil && seat.reservedUntil < now) {
        // Lock expired — auto-heal
        healPromises.push(
          SeatBooking.updateOne(
            { _id: seat._id },
            {
              status: "available",
              reservedUntil: null,
              reservedByUserId: null,
              paymentStatus: "none",
            }
          )
        );
        return { ...seat, status: "available" };
      }
      return seat;
    });

    // Fire heals in background
    if (healPromises.length > 0) {
      Promise.all(healPromises).catch((e) =>
        console.warn("[Seats] Auto-heal error:", e.message)
      );
    }

    // Build counters
    const counters = {
      total: enrichedSeats.length,
      available: enrichedSeats.filter((s) => s.status === "available").length,
      reserved: enrichedSeats.filter((s) => s.status === "reserved").length,
      booked: enrichedSeats.filter((s) => s.status === "booked").length,
      male: enrichedSeats.filter((s) => s.status === "booked" && s.gender === "Male").length,
      female: enrichedSeats.filter((s) => s.status === "booked" && s.gender === "Female").length,
    };

    res.status(200).json({
      success: true,
      tripId,
      seats: enrichedSeats,
      counters,
      layout: {
        seatsPerRow: 4,
        rows: [...new Set(enrichedSeats.map((s) => s.row))].sort(),
      },
    });
  } catch (error) {
    console.error("[Seat Map] Error:", error);
    res.status(500).json({ success: false, message: "Server Error fetching seat map" });
  }
});

/**
 * POST /api/seats/reserve
 * Temporarily reserve a seat during the booking flow.
 * Uses Redis NX lock + MongoDB status update.
 *
 * Body: { tripId, seatNumber }
 */
router.post("/reserve", protect, async (req, res) => {
  const { tripId, seatNumber } = req.body;
  const userId = req.user._id || req.user.id;

  if (!tripId || !seatNumber) {
    return res.status(400).json({ success: false, message: "tripId and seatNumber are required" });
  }

  try {
    const seat = await SeatBooking.findOne({ tripId, seatNumber });
    if (!seat) {
      return res.status(404).json({ success: false, message: "Seat not found" });
    }

    // Already booked — cannot reserve
    if (seat.status === "booked") {
      return res.status(409).json({ success: false, message: "Seat is already booked" });
    }

    // Already reserved by someone else — check Redis lock
    if (seat.status === "reserved") {
      const locked = await isSeatLocked(tripId, seatNumber);
      const expiredInMongo = seat.reservedUntil && seat.reservedUntil < new Date();
      if (locked && !expiredInMongo) {
        // Check if the current user owns this reservation
        if (String(seat.reservedByUserId) !== String(userId)) {
          return res.status(409).json({
            success: false,
            message: "Seat is temporarily reserved by another user",
            reservedUntil: seat.reservedUntil,
          });
        }
        // User re-reserving their own seat — allow (refresh TTL)
      }
    }

    // Acquire Redis lock
    const lockAcquired = await acquireSeatLock(tripId, seatNumber, userId);
    if (!lockAcquired) {
      return res.status(409).json({
        success: false,
        message: "Seat is being reserved by another user. Please try a different seat.",
      });
    }

    const reservedUntil = new Date(Date.now() + SEAT_LOCK_TTL * 1000);

    // Update MongoDB
    await SeatBooking.updateOne(
      { tripId, seatNumber },
      {
        status: "reserved",
        reservedUntil,
        reservedByUserId: userId,
        paymentStatus: "pending",
      }
    );

    // Emit real-time update via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`trip_${tripId}`).emit("seat_update", {
        tripId,
        seatNumber,
        status: "reserved",
        reservedUntil,
      });
    }

    res.status(200).json({
      success: true,
      seatNumber,
      status: "reserved",
      reservedUntil,
      message: `Seat ${seatNumber} reserved for 10 minutes`,
    });
  } catch (error) {
    console.error("[Seat Reserve] Error:", error);
    res.status(500).json({ success: false, message: "Server Error reserving seat" });
  }
});

/**
 * POST /api/seats/release
 * Release a temporarily reserved seat (payment cancelled / timeout).
 *
 * Body: { tripId, seatNumber }
 */
router.post("/release", protect, async (req, res) => {
  const { tripId, seatNumber } = req.body;
  const userId = req.user._id || req.user.id;

  if (!tripId || !seatNumber) {
    return res.status(400).json({ success: false, message: "tripId and seatNumber are required" });
  }

  try {
    const seat = await SeatBooking.findOne({ tripId, seatNumber });
    if (!seat) {
      return res.status(404).json({ success: false, message: "Seat not found" });
    }

    // Only the user who reserved the seat can release it (unless it's booked — never touch booked)
    if (seat.status === "booked") {
      return res.status(400).json({ success: false, message: "Cannot release a booked seat" });
    }

    if (
      seat.status === "reserved" &&
      String(seat.reservedByUserId) !== String(userId)
    ) {
      return res.status(403).json({ success: false, message: "You do not own this reservation" });
    }

    // Release Redis lock
    await releaseSeatLock(tripId, seatNumber, userId);

    // Reset MongoDB
    await SeatBooking.updateOne(
      { tripId, seatNumber },
      {
        status: "available",
        reservedUntil: null,
        reservedByUserId: null,
        paymentStatus: "none",
      }
    );

    // Emit live update
    const io = req.app.get("io");
    if (io) {
      io.to(`trip_${tripId}`).emit("seat_update", {
        tripId,
        seatNumber,
        status: "available",
      });
    }

    res.status(200).json({ success: true, message: `Seat ${seatNumber} released` });
  } catch (error) {
    console.error("[Seat Release] Error:", error);
    res.status(500).json({ success: false, message: "Server Error releasing seat" });
  }
});

/**
 * POST /api/seats/confirm
 * Finalize seat assignment after successful payment.
 * Called internally by payment verification logic, or directly from frontend after UPI success.
 *
 * Body: { tripId, seatNumber, bookingId, passengerData: { name, age, gender, phone, emergencyContact, seatPreference, specialRequest } }
 */
router.post("/confirm", protect, async (req, res) => {
  const { tripId, seatNumber, bookingId, passengerData = {} } = req.body;
  const userId = req.user._id || req.user.id;

  if (!tripId || !seatNumber || !bookingId) {
    return res.status(400).json({ success: false, message: "tripId, seatNumber, and bookingId are required" });
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

    const seat = await SeatBooking.findOne({ tripId, seatNumber });
    if (!seat) {
      return res.status(404).json({ success: false, message: "Seat not found" });
    }

    if (seat.status === "booked") {
      return res.status(409).json({ success: false, message: "Seat is already permanently booked" });
    }

    // Create/update Passenger document
    const passenger = await Passenger.findOneAndUpdate(
      { bookingId: booking._id, seatNumber },
      {
        bookingId: booking._id,
        bookingRef: booking.bookingId,
        tripId,
        userId,
        name: passengerData.name || "",
        age: passengerData.age || 0,
        gender: passengerData.gender || "Other",
        phone: passengerData.phone || "",
        emergencyContact: passengerData.emergencyContact || "",
        seatNumber,
        seatPreference: passengerData.seatPreference || "No Preference",
        specialRequest: passengerData.specialRequest || "",
        status: "active",
        paymentStatus: "completed",
        qrPayload: buildQRPayload(booking, { ...passengerData, seatNumber }),
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Mark seat as booked
    await SeatBooking.updateOne(
      { tripId, seatNumber },
      {
        status: "booked",
        bookingId: booking._id,
        passengerId: passenger._id,
        passengerName: passengerData.name || "",
        gender: passengerData.gender || "Other",
        age: Number(passengerData.age) || 0,
        paymentStatus: "completed",
        reservedUntil: null,
      }
    );

    // Clear Redis lock
    await releaseSeatLock(tripId, seatNumber, userId);

    // Emit live update
    const io = req.app.get("io");
    if (io) {
      io.to(`trip_${tripId}`).emit("seat_update", {
        tripId,
        seatNumber,
        status: "booked",
        gender: passengerData.gender || "Other",
        passengerName: passengerData.name || "",
        age: passengerData.age || 0,
      });
    }

    res.status(200).json({
      success: true,
      seatNumber,
      passenger,
      message: `Seat ${seatNumber} confirmed for ${passengerData.name}`,
    });
  } catch (error) {
    console.error("[Seat Confirm] Error:", error);
    res.status(500).json({ success: false, message: "Server Error confirming seat" });
  }
});

/**
 * GET /api/seats/ticket/:bookingId
 * Returns the booking with all passenger QR payloads for ticket rendering.
 */
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

    // Build per-passenger QR payloads
    const passengersWithQR = passengers.map((p) => ({
      ...p,
      qrPayload: p.qrPayload || buildQRPayload(booking, p),
      qrString: JSON.stringify(p.qrPayload || buildQRPayload(booking, p)),
    }));

    // If no Passenger docs exist yet (legacy bookings), synthesize from booking.travellers
    let finalPassengers = passengersWithQR;
    if (finalPassengers.length === 0 && booking.travellers?.length > 0) {
      finalPassengers = booking.travellers.map((t, idx) => {
        const seatNum = (booking.seatNumbers || [])[idx] || `S${idx + 1}`;
        const qrPayload = buildQRPayload(booking, { ...t, seatNumber: seatNum });
        return {
          name: t.name,
          age: t.age,
          gender: t.gender,
          phone: t.phone,
          seatNumber: seatNum,
          qrPayload,
          qrString: JSON.stringify(qrPayload),
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
      },
      passengers: finalPassengers,
      passengerCount: finalPassengers.length,
    });
  } catch (error) {
    console.error("[Ticket Fetch] Error:", error);
    res.status(500).json({ success: false, message: "Server Error fetching ticket" });
  }
});

export default router;
