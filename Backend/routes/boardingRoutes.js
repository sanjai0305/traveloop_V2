import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import protect from "../middleware/authMiddleware.js";
import { supabase } from "../config/supabase.js";
import { triggerNotification } from "../controllers/notificationController.js";

const router = express.Router();

const isUUID = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

// POST /api/boarding/generate-qr
router.post("/generate-qr", protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    console.log("Generate QR Requested Booking ID:", bookingId);

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId required" });
    }

    if (!isUUID(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" });
    }

    // Load booking
    const { data: bookingRow } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (!bookingRow) {
      return res.status(400).json({ success: false, message: "Booking not found" });
    }

    const booking = { ...bookingRow, _id: bookingRow.id, agentTrip: bookingRow.tripId };

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
    const { data: tripRow } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", booking.agentTrip)
      .maybeSingle();

    if (!tripRow) {
      return res.status(400).json({ success: false, message: "Trip not found" });
    }

    const trip = { ...tripRow, _id: tripRow.id };

    if (trip.status === "cancelled" || trip.status === "Cancelled" || trip.status === "deleted") {
      return res.status(400).json({ success: false, message: "Trip is not active or has been cancelled" });
    }

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

    const qrSecret = process.env.DRIVER_QR_SECRET || process.env.JWT_SECRET;
    const uniqueToken = crypto.randomBytes(16).toString("hex");
    const qrToken = jwt.sign(
      {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        tripId: trip._id.toString(),
        seatNumber: booking.assignedSeat || "Waiting For Driver Assignment",
        tripDate: trip.startDate,
        boardingPoint: trip.pickupLocation || "",
        pickupLocation: trip.pickupLocation || "",
        travelerName: "",
        timestamp: new Date().toISOString(),
        encryptedToken: uniqueToken,
        expiryTime: expiry,
      },
      qrSecret,
      { expiresIn: "24h" }
    );

    console.log("Generated QR Token:", qrToken);

    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrToken)}`;

    // Update Booking fields in PostgreSQL
    const updatePayload = {
      token: qrToken,
      boardingStatus: "not_boarded",
    };

    const { data: updatedBooking } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId)
      .select()
      .single();

    const resultBooking = {
      ...updatedBooking,
      _id: updatedBooking.id,
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
      expiresAt: new Date(expiry * 1000),
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
    if (!isUUID(bookingId)) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const { data: bookingRow } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (!bookingRow) return res.status(404).json({ success: false, message: "Booking not found" });

    const { data: tripRow } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", bookingRow.tripId)
      .maybeSingle();

    const booking = {
      ...bookingRow,
      _id: bookingRow.id,
      agentTrip: tripRow ? { ...tripRow, _id: tripRow.id } : null,
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

    const { data: bookingRow } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", decoded.bookingId)
      .maybeSingle();

    if (!bookingRow) return res.status(404).json({ success: false, message: "Booking not found" });

    const { data: tripRow } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("id", bookingRow.tripId)
      .maybeSingle();

    const booking = {
      ...bookingRow,
      _id: bookingRow.id,
      agentTrip: tripRow ? { ...tripRow, _id: tripRow.id } : null,
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
