import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import protect from "../middleware/authMiddleware.js";
import Booking from "../models/Booking.js";
import AgentTrip from "../models/AgentTrip.js";
import { triggerNotification } from "../controllers/notificationController.js";

const router = express.Router();

const generateQrSignature = (payload, secret) => {
  const dataToSign = `${payload.bookingId}|${payload.tripId}|${payload.passengerId}|${payload.seatNumber}|${payload.issuedAt}|${payload.expiresAt}`;
  return crypto.createHmac("sha256", secret).update(dataToSign).digest("hex");
};

// POST /api/boarding/generate-qr
router.post("/generate-qr", protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    console.log("Generate QR Requested Booking ID:", bookingId);

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId required" });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" });
    }

    // Load booking
    const bookingRow = await Booking.findById(bookingId);

    if (!bookingRow) {
      return res.status(400).json({ success: false, message: "Booking not found" });
    }

    const booking = {
      ...bookingRow.toObject(),
      _id: bookingRow._id,
    };

    // Verify ownership
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Booking ownership mismatch" });
    }

    const isPaid = 
      (booking.status && ["paid", "confirmed"].includes(booking.status.toLowerCase())) ||
      (booking.paymentStatus && ["paid", "confirmed"].includes(booking.paymentStatus.toLowerCase()));

    if (!isPaid) {
      return res.status(400).json({ success: false, message: "Booking payment status must be Paid or Confirmed" });
    }

    // Load trip
    const tripRow = await AgentTrip.findById(booking.tripId);

    if (!tripRow) {
      return res.status(400).json({ success: false, message: "Trip not found" });
    }

    const trip = { ...tripRow.toObject(), _id: tripRow._id };

    if (trip.status === "cancelled" || trip.status === "Cancelled" || trip.status === "deleted") {
      return res.status(400).json({ success: false, message: "Trip is not active or has been cancelled" });
    }

    if (!bookingRow.qrUnlocked) {
      return res.status(400).json({
        success: false,
        message: "Boarding Pass Locked. QR will be available before departure.",
      });
    }

    const now = new Date();
    if (trip.boardingClosesAt && now > new Date(trip.boardingClosesAt)) {
      return res.status(400).json({
        success: false,
        message: "Boarding window has closed. Boarding Pass Expired.",
      });
    }

    const tripDate = trip.startDate ? new Date(trip.startDate) : new Date();
    tripDate.setHours(23, 59, 59, 999);
    const expiryTime = tripDate.getTime();

    const qrSecret = process.env.DRIVER_QR_SECRET || process.env.JWT_SECRET || "super_secret_jwt_key_for_local_development_traveloop";

    const payload = {
      bookingId: booking._id.toString(),
      tripId: trip._id.toString(),
      passengerId: booking.userId ? booking.userId.toString() : "USR_001",
      seatNumber: booking.assignedSeat || booking.seatNumbers?.[0] || "Waiting Assignment",
      issuedAt: Date.now(),
      expiresAt: expiryTime,
    };

    const signature = generateQrSignature(payload, qrSecret);
    const fullPayload = { ...payload, signature };

    console.log("Generated QR Payload", fullPayload);

    const qrToken = Buffer.from(JSON.stringify(fullPayload)).toString("base64");

    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrToken)}`;

    // Update Booking fields in MongoDB
    const updatePayload = {
      token: qrToken,
      boardingStatus: "not_boarded",
    };

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updatePayload,
      { returnDocument: "after" }
    );

    const resultBooking = {
      ...updatedBooking.toObject(),
      _id: updatedBooking._id,
      agentTrip: updatedBooking.tripId,
      qrCode: qrImage,
      boardingPassGenerated: true,
    };

    if (booking.userId) {
      try {
        await triggerNotification(booking.userId, "QR Activated", `Your Boarding Pass for ${trip.title} is now active!`, "info", trip._id);
      } catch (notifErr) {
        console.warn("Notification trigger failed:", notifErr.message);
      }
    }

    res.json({
      success: true,
      qrImage,
      token: qrToken,
      expiresAt: new Date(expiryTime),
      boardingId: resultBooking._id.toString(),
      booking: resultBooking,
    });
  } catch (err) {
    console.error("[Boarding generate-qr]", err);
    res.status(400).json({ success: false, message: err.message || "Failed to generate QR" });
  }
});

// GET /api/boarding/:bookingId
router.get("/:bookingId", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const bookingRow = await Booking.findById(bookingId);

    if (!bookingRow) return res.status(404).json({ success: false, message: "Booking not found" });

    const tripRow = await AgentTrip.findById(bookingRow.tripId);

    const booking = {
      ...bookingRow.toObject(),
      _id: bookingRow._id,
      agentTrip: tripRow ? { ...tripRow.toObject(), _id: tripRow._id } : null,
    };

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

// POST /api/boarding/verify
router.post("/verify", async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ success: false, message: "qrToken required" });

    const qrSecret = process.env.DRIVER_QR_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(qrToken, qrSecret);

    if (!decoded.bookingId) {
      return res.status(400).json({ success: false, message: "Invalid token payload" });
    }

    const bookingRow = await Booking.findById(decoded.bookingId);

    if (!bookingRow) return res.status(404).json({ success: false, message: "Booking not found" });

    const tripRow = await AgentTrip.findById(bookingRow.tripId);

    const booking = {
      ...bookingRow.toObject(),
      _id: bookingRow._id,
      agentTrip: tripRow ? { ...tripRow.toObject(), _id: tripRow._id } : null,
    };

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
