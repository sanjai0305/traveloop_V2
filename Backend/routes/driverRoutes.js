import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import protectDriver from "../middleware/driverAuthMiddleware.js";
import Driver from "../models/Driver.js";
import AgentTrip from "../models/AgentTrip.js";
import Booking from "../models/Booking.js";
import { sendOtpEmail } from "../services/emailService.js";
import { triggerNotification } from "../controllers/notificationController.js";

const router = express.Router();

// In-memory driver OTP store
const driverOtps = new Map();

// Helper: generate 6-digit OTP
const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper: sign driver JWT
const signToken = (driver) =>
  jwt.sign(
    { id: driver._id.toString(), role: "driver", email: driver.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// AUTH — Send Email OTP
// POST /api/driver/auth/send-otp
router.post("/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const driver = await Driver.findOne({ email: email.toLowerCase().trim() });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "No driver account found. Please contact your travel agency.",
      });
    }

    const otp = genOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    driverOtps.set(driver.email.toLowerCase().trim(), {
      otp,
      expiry,
      attempts: 0,
    });

    try {
      await sendOtpEmail(driver.email, driver.name, otp);
      console.log("Driver OTP Generated:", otp);
      return res.json({ success: true, message: "OTP sent successfully" });
    } catch (emailErr) {
      console.error("[Driver OTP] Email delivery failed:", emailErr);
      return res.status(500).json({
        success: false,
        message: "Unable to send OTP. Please check email configuration or SMTP credentials.",
      });
    }
  } catch (err) {
    console.error("[Driver send-otp]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// AUTH — Verify Email OTP
// POST /api/driver/auth/verify-otp
router.post("/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP required" });
    }

    const emailKey = email.toLowerCase().trim();
    const otpRecord = driverOtps.get(emailKey);

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not requested or expired" });
    }

    if (new Date() > otpRecord.expiry) {
      driverOtps.delete(emailKey);
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= 5) {
        driverOtps.delete(emailKey);
        return res.status(400).json({ success: false, message: "Too many failed attempts. OTP invalidated." });
      }
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Load driver
    const driver = await Driver.findOne({ email: emailKey });

    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver profile not found" });
    }

    driverOtps.delete(emailKey);

    const token = signToken(driver);

    res.json({
      success: true,
      message: "Authentication successful",
      token,
      driver: {
        id: driver._id.toString(),
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
      },
    });
  } catch (err) {
    console.error("[Driver verify-otp]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/driver/me — Driver profile + today's trip
router.get("/me", protectDriver, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Find today's trip assigned to this driver
    const driverId = req.driver._id || req.driver.id;
    const todayTrip = await AgentTrip.findOne({
      driverId,
      startDate: today,
      status: { $in: ["published", "ongoing"] }
    });

    res.json({
      success: true,
      driver: {
        id:     driverId.toString(),
        name:   req.driver.name,
        email:  req.driver.email,
        phone:  req.driver.phone,
        status: req.driver.status,
        licenseNumber: req.driver.licenseNumber,
        vehicleNumber: req.driver.vehicleNumber,
      },
      todayTrip: todayTrip ? { ...todayTrip.toObject(), _id: todayTrip._id } : null,
    });
  } catch (err) {
    console.error("[Driver me]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/driver/dashboard — Stats for today's trip
router.get("/dashboard", protectDriver, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const driverId = req.driver._id || req.driver.id;

    const trip = await AgentTrip.findOne({
      driverId,
      startDate: today
    });

    if (!trip) {
      return res.json({ success: true, trip: null, stats: null, boardingLog: [] });
    }

    // Get all bookings for this trip
    const bookingsList = await Booking.find({
      tripId: trip._id,
      paymentStatus: { $ne: "Cancelled" }
    });

    const bookings = bookingsList || [];

    const total    = bookings.reduce((s, b) => s + (b.seats || 1), 0);
    const boarded  = bookings.filter(b => b.boardingStatus === "boarded").length;
    const noShow   = bookings.filter(b => b.boardingStatus === "no_show").length;
    const pending  = bookings.filter(b => b.boardingStatus === "not_boarded" || b.boardingStatus === "Pending").length;

    // Boarding timeline
    const boardingLog = bookings
      .filter(b => b.boardingStatus === "boarded")
      .map(b => ({
        bookingId:    b.bookingId,
        travelerName: "",
        seatNumber:   b.assignedSeat,
        boardedAt:    b.updatedAt,
      }));

    res.json({
      success: true,
      trip: {
        _id:           trip._id.toString(),
        title:         trip.title,
        destinations:  trip.destinations,
        startDate:     trip.startDate,
        departureTime: trip.departureTime,
        pickupLocation:trip.pickupLocation,
        busNumber:     trip.busNumber,
        busType:       trip.busType,
        boardingStatus: trip.boardingStatus || "LOCKED",
        boardingOpenedAt: trip.boardingOpenedAt || null,
        boardingClosesAt: trip.boardingClosesAt || null,
      },
      stats: { total, boarded, pending, noShow, occupancyPct: total ? Math.round((boarded / total) * 100) : 0 },
      boardingLog,
    });
  } catch (err) {
    console.error("[Driver dashboard]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/driver/trips/:tripId/manifest
router.get("/trips/:tripId/manifest", protectDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    const trip = await AgentTrip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const bookingsList = await Booking.find({
      tripId,
      paymentStatus: { $ne: "Cancelled" }
    });

    const bookings = bookingsList || [];

    res.json({
      success: true,
      manifest: bookings.map(b => ({
        bookingId:      b.bookingId,
        travelerName:   "",
        seats:          b.seats,
        assignedSeat:   b.assignedSeat,
        boardingStatus: b.boardingStatus,
        paymentStatus:  b.paymentStatus,
      })),
    });
  } catch (err) {
    console.error("[Driver manifest]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/driver/trips/:tripId/open-boarding
router.post("/trips/:tripId/open-boarding", protectDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    const trip = await AgentTrip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const now = new Date();
    // Closes 2 hours from now
    const closesAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const updatedTrip = await AgentTrip.findByIdAndUpdate(
      tripId,
      {
        boardingStatus: "OPEN",
        boardingOpenedAt: now,
        boardingClosesAt: closesAt,
      },
      { new: true }
    );

    const io = req.app.get("io");
    if (io) {
      io.to(tripId).emit("boarding-opened", {
        tripId,
        boardingStatus: "OPEN",
        openedAt: now,
        closedAt: closesAt,
      });
    }

    res.json({
      success: true,
      message: "Boarding window is now open.",
      boardingStatus: "OPEN",
      openedAt: now,
      closedAt: closesAt,
    });
  } catch (err) {
    console.error("[Driver open-boarding]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/driver/trips/:tripId/unlock-boarding
router.post("/trips/:tripId/unlock-boarding", protectDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    const trip = await AgentTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const driverIdStr = req.driver._id.toString();
    const isAssigned = (trip.driverId && trip.driverId.toString() === driverIdStr) || 
                       (trip.driver && trip.driver.toString() === driverIdStr);
    
    if (!isAssigned) {
      return res.status(403).json({ success: false, message: "Only the assigned driver can unlock boarding." });
    }

    const today = new Date().toISOString().split("T")[0];
    if (trip.startDate !== today) {
      return res.status(400).json({ success: false, message: "Boarding can only be unlocked on the departure date." });
    }

    if (trip.status === "cancelled" || trip.status === "completed") {
      return res.status(400).json({ success: false, message: "Cannot unlock boarding for inactive or completed trips." });
    }

    const now = new Date();
    const closesAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    // Update Trip boarding details
    trip.boardingStatus = "OPEN";
    trip.boardingOpenedAt = now;
    trip.boardingClosesAt = closesAt;
    await trip.save();

    // Update all bookings for this trip
    await Booking.updateMany(
      { tripId },
      {
        qrUnlocked: true,
        boardingWindowOpen: true,
        boardingUnlockedAt: now,
        boardingUnlockedBy: req.driver._id,
        boardingStatus: "OPEN"
      }
    );

    // Update driver active trip
    await Driver.findByIdAndUpdate(req.driver._id, { activeBoardingTrip: trip._id });

    const io = req.app.get("io");
    if (io) {
      io.emit("boarding_qr_unlocked", { tripId });
      io.to(tripId.toString()).emit("boarding-opened", {
        tripId,
        boardingStatus: "OPEN",
        openedAt: now,
        closedAt: closesAt,
      });
    }

    res.json({
      success: true,
      message: "Boarding window unlocked successfully.",
      boardingStatus: "OPEN",
      openedAt: now,
      closedAt: closesAt,
    });
  } catch (err) {
    console.error("[Driver unlock-boarding]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/driver/trips/:tripId/close-boarding
router.post("/trips/:tripId/close-boarding", protectDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    const trip = await AgentTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const driverIdStr = req.driver._id.toString();
    const isAssigned = (trip.driverId && trip.driverId.toString() === driverIdStr) || 
                       (trip.driver && trip.driver.toString() === driverIdStr);
    
    if (!isAssigned) {
      return res.status(403).json({ success: false, message: "Only the assigned driver can close boarding." });
    }

    const now = new Date();

    trip.boardingStatus = "CLOSED";
    trip.boardingClosedAt = now;
    trip.boardingClosesAt = now;
    await trip.save();

    // Lock passenger QR codes and mark remaining as no_show
    await Booking.updateMany(
      { tripId },
      {
        qrUnlocked: false,
        boardingWindowOpen: false,
        boardingStatus: "CLOSED"
      }
    );

    // Auto mark remaining Pending/not_boarded as No Show in database for stats
    await Booking.updateMany(
      {
        tripId,
        boardingStatus: { $in: ["LOCKED", "OPEN", "Pending", "not_boarded"] }
      },
      { boardingStatus: "no_show" }
    );

    // Clear active trip for driver
    await Driver.findByIdAndUpdate(req.driver._id, { activeBoardingTrip: null });

    const io = req.app.get("io");
    if (io) {
      io.emit("boarding_closed", { tripId });
      io.to(tripId.toString()).emit("boarding-closed", {
        tripId,
        boardingStatus: "CLOSED",
        closedAt: now,
      });
      io.emit("boarding_completed", { tripId });
    }

    res.json({
      success: true,
      message: "Boarding window is now closed.",
      boardingStatus: "CLOSED",
      closedAt: now,
    });
  } catch (err) {
    console.error("[Driver close-boarding]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/driver/scan-boarding and POST /api/driver/scan
const scanBoardingHandler = async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) {
      return res.status(400).json({ success: false, message: "qrToken required" });
    }

    const qrSecret = process.env.DRIVER_QR_SECRET || process.env.JWT_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(qrToken, qrSecret);
    } catch (err) {
      return res.status(400).json({ success: false, code: "INVALID_QR", message: "Invalid or expired QR code" });
    }

    if (!decoded.bookingId) {
      return res.status(400).json({ success: false, code: "INVALID_QR", message: "Invalid token payload" });
    }

    const booking = await Booking.findById(decoded.bookingId)
      .populate("userId")
      .populate("tripId");

    if (!booking) {
      return res.status(404).json({ success: false, code: "BOOKING_NOT_FOUND", message: "Booking not found" });
    }

    // Verify paymentStatus
    const pStatus = (booking.paymentStatus || "").toUpperCase();
    if (pStatus !== "PAID" && pStatus !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        code: "PAYMENT_PENDING",
        message: "Payment not completed"
      });
    }

    // Check if already boarded
    const bStatus = (booking.boardingStatus || "").toUpperCase();
    if (bStatus === "BOARDED" || bStatus === "BOARDED") {
      return res.status(400).json({
        success: false,
        code: "ALREADY_BOARDED",
        message: `Passenger already boarded\nTime: ${booking.boardedAt ? new Date(booking.boardedAt).toLocaleTimeString("en-IN") : "N/A"}\nSeat: ${booking.assignedSeat || booking.seatNumber || "N/A"}`
      });
    }

    const trip = booking.tripId;
    const user = booking.userId;

    res.json({
      success: true,
      boardingPassId: booking._id.toString(),
      bookingId: booking._id.toString(),
      tripName: trip.title,
      travelerName: booking.travelerName || (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Traveler"),
      phone: booking.contactNumber || (user ? user.phone : ""),
      seatNumber: booking.assignedSeat || booking.seatNumber || "",
      paymentStatus: booking.paymentStatus,
      boardingStatus: booking.boardingStatus,
      passengerCount: booking.seats || 1,
      passengers: booking.travellers || booking.passengers || [],
      departureTime: trip.departureTime,
      vehicle: trip.busNumber,
      bookingAmount: booking.pricePaid || booking.amountPaid || 0,
      passenger: {
        bookingId: booking._id.toString(),
        travelerName: booking.travelerName || (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Traveler"),
        gender: booking.gender || "Male",
        age: booking.age || 25,
        phone: booking.contactNumber || (user ? user.phone : ""),
        seats: booking.seats || 1,
        pickupLocation: booking.pickupLocation || trip.pickupLocation || "",
        assignedSeat: booking.assignedSeat || booking.seatNumber || "",
        boardingStatus: booking.boardingStatus,
        adults: booking.adults || 1,
        children: booking.children || 0,
        paymentStatus: booking.paymentStatus,
        boardedAt: booking.boardedAt,
      },
      trip: {
        _id: trip._id.toString(),
        title: trip.title,
        busNumber: trip.busNumber,
        departureTime: trip.departureTime,
        destinations: trip.destinations,
      }
    });
  } catch (err) {
    console.error("[Driver scan-boarding]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

router.post("/scan-boarding", protectDriver, scanBoardingHandler);
router.post("/scan", protectDriver, scanBoardingHandler);

// POST /api/driver/board/:bookingId
router.post("/board/:bookingId", protectDriver, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { seatNumber } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const now = new Date();
    booking.boardingStatus = "BOARDED";
    booking.boardedAt = now;
    booking.boardedBy = req.driver._id;
    if (seatNumber) {
      booking.assignedSeat = seatNumber;
      booking.seatNumber = seatNumber;
    }
    await booking.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("boarding_scanned", { bookingId, tripId: booking.tripId });
      io.to(booking.tripId.toString()).emit("passenger-boarded", {
        bookingId: booking.bookingId,
        boardingStatus: "BOARDED",
      });
    }

    res.json({
      success: true,
      message: "Passenger successfully marked as boarded.",
      travelerName: booking.travelerName,
      seatNumber: booking.assignedSeat,
      paymentStatus: "PAID",
      boardingStatus: "BOARDED"
    });
  } catch (err) {
    console.error("[Driver board]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/driver/no-show/:bookingId
router.post("/no-show/:bookingId", protectDriver, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { boardingStatus: "no_show" },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, message: "Passenger marked as no show." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/driver/seats/:tripId
router.get("/seats/:tripId", protectDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    const bookings = await Booking.find({
      tripId,
      paymentStatus: { $ne: "Cancelled" },
      assignedSeat: { $ne: "" }
    });
    const occupiedSeats = bookings.map(b => ({
      seat: b.assignedSeat || b.seatNumber,
      status: b.boardingStatus
    }));
    res.json({ success: true, occupiedSeats });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
