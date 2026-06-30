import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import protect from "../middleware/authMiddleware.js";
import Booking from "../models/Booking.js";
import AgentTrip from "../models/AgentTrip.js";
import BoardingPass from "../models/BoardingPass.js";
import { triggerNotification } from "../controllers/notificationController.js";

const router = express.Router();

// ────────────────────────────────────────────────────────────────────────────
// POST /api/boarding/generate-qr
// Traveler generates a signed QR for their booking.
// Only allowed within 24 hours of the trip start date (or on trip day).
// ────────────────────────────────────────────────────────────────────────────
router.post("/generate-qr", protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    console.log("Generate QR Requested Booking ID:", bookingId);

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" });
    }

    // Load booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(400).json({ success: false, message: "Booking not found" });
    }

    // Verify ownership
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Booking ownership mismatch" });
    }

    // Verify payment is completed: Paid or Confirmed (case-insensitive)
    const isPaid = 
      (booking.status && ["paid", "confirmed"].includes(booking.status.toLowerCase())) ||
      (booking.paymentStatus && ["paid", "confirmed"].includes(booking.paymentStatus.toLowerCase()));

    if (!isPaid) {
      return res.status(400).json({ success: false, message: "Booking payment status must be Paid or Confirmed" });
    }

    // Load trip
    const trip = await AgentTrip.findById(booking.agentTrip);
    if (!trip) {
      return res.status(400).json({ success: false, message: "Trip not found" });
    }

    // Verify only active trips
    if (trip.status === "cancelled" || trip.status === "Cancelled" || trip.status === "deleted" || trip.isDeleted) {
      return res.status(400).json({ success: false, message: "Trip is not active or has been cancelled" });
    }

    // Verify travel date eligibility: Only when driver has opened boarding
    if (trip.boardingStatus !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: "Boarding Pass Locked. Waiting for Driver to open boarding.",
      });
    }

    const now = new Date();
    if (trip.boardingClosesAt && now > new Date(trip.boardingClosesAt)) {
      return res.status(400).json({
        success: false,
        message: "Boarding window has closed. Boarding Pass Expired.",
      });
    }

    const tripEndOfDay = new Date(trip.startDate + "T23:59:59");
    const expiry = Math.floor(tripEndOfDay.getTime() / 1000);

    // Sign the QR JWT token with required payload fields
    const qrSecret = process.env.DRIVER_QR_SECRET || process.env.JWT_SECRET;
    const uniqueToken = crypto.randomBytes(16).toString("hex");
    const qrToken = jwt.sign(
      {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        tripId: trip._id.toString(),
        seatNumber: booking.assignedSeat || booking.seatNumbers?.[0] || "Waiting For Driver Assignment",
        tripDate: trip.startDate,
        boardingPoint: booking.pickupLocation || trip.pickupLocation || "",
        pickupLocation: booking.pickupLocation || trip.pickupLocation || "",
        travelerName: booking.travelerName || "",
        timestamp: new Date().toISOString(),
        encryptedToken: uniqueToken,
        expiryTime: expiry,
      },
      qrSecret,
      { expiresIn: "24h" }
    );

    console.log("Generated QR Token:", qrToken);

    // Generate QR Image URL using api.qrserver.com
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrToken)}`;

    // Create/update BoardingPass first to prevent duplicate null key index issues
    const tokenHash = crypto.createHash("sha256").update(qrToken).digest("hex");
    const bp = await BoardingPass.findOneAndUpdate(
      { booking: booking._id, agentTrip: trip._id },
      {
        booking: booking._id,
        bookingId: booking.bookingId,
        agentTrip: trip._id,
        userId: req.user._id,
        qrTokenHash: tokenHash, // FIX: set hash to avoid E11000 duplicate key error on qrTokenHash: null
        qrGeneratedAt: new Date(),
        $setOnInsert: { status: "not_boarded" },
      },
      { upsert: true, new: true }
    );

    // Update Booking fields
    booking.boardingPass = bp._id;
    booking.qrCode = qrImage;
    booking.token = qrToken;
    booking.generatedAt = new Date();
    booking.expiresAt = new Date(expiry * 1000);
    booking.qrToken = qrToken;
    booking.qrExpiry = new Date(expiry * 1000);
    booking.boardingStatus = booking.boardingStatus || "not_boarded";
    booking.boardingPassGenerated = true;
    booking.boardingPassGeneratedAt = new Date();
    await booking.save();

    // Trigger notifications
    if (booking.userId) {
      try {
        await triggerNotification(booking.userId, "QR Activated", `Your Boarding Pass for ${trip.title} is now active!`, "info", trip._id);
        await triggerNotification(booking.userId, "Trip Tomorrow", `Get ready! Your trip ${trip.title} departs tomorrow.`, "info", trip._id);
      } catch (notifErr) {
        console.warn("Notification trigger failed:", notifErr.message);
      }
    }

    res.json({
      success: true,
      qrImage,
      token: qrToken,
      expiresAt: new Date(expiry * 1000),
      boardingId: bp._id.toString(),
      booking,
    });
  } catch (err) {
    console.error("[Boarding generate-qr]", err);
    res.status(400).json({ success: false, message: err.message || "Failed to generate QR" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/boarding/:bookingId
// ────────────────────────────────────────────────────────────────────────────
router.get("/:bookingId", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = await Booking.findById(bookingId).populate("agentTrip");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // Verify ownership
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (err) {
    console.error("[Boarding status]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/boarding/verify
// ────────────────────────────────────────────────────────────────────────────
router.post("/verify", async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ success: false, message: "qrToken required" });

    const qrSecret = process.env.DRIVER_QR_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(qrToken, qrSecret);

    if (!decoded.bookingId) {
      return res.status(400).json({ success: false, message: "Invalid token payload" });
    }

    const booking = await Booking.findById(decoded.bookingId).populate("agentTrip");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (booking.tripDeleted || (booking.agentTrip && booking.agentTrip.isDeleted) || (booking.agentTrip && booking.agentTrip.status === "deleted")) {
      return res.status(400).json({ success: false, message: "This trip has been removed by the agency. Booking is invalid." });
    }

    res.json({
      success: true,
      valid: true,
      booking,
    });
  } catch (err) {
    console.error("[Boarding verify]", err);
    res.status(400).json({ success: false, message: "Invalid or expired QR code" });
  }
});

export default router;
