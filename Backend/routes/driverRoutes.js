import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import Driver from "../models/Driver.js";
import AgentTrip from "../models/AgentTrip.js";
import Booking from "../models/Booking.js";
import BoardingPass from "../models/BoardingPass.js";
import protectDriver from "../middleware/driverAuthMiddleware.js";
import { sendOtpEmail } from "../services/emailService.js";
import { triggerNotification } from "../controllers/notificationController.js";

const router = express.Router();

// ── Email transporter ───────────────────────────────────────────────────────
const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

// ── Helper: generate 6-digit OTP ───────────────────────────────────────────
const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Helper: sign driver JWT ─────────────────────────────────────────────────
const signToken = (driver) =>
  jwt.sign(
    { id: driver._id.toString(), role: "driver", email: driver.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// ────────────────────────────────────────────────────────────────────────────
// AUTH — Send Email OTP
// POST /api/driver/auth/send-otp
// ────────────────────────────────────────────────────────────────────────────
router.post("/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const driver = await Driver.findOne({ email: email.toLowerCase().trim() });
    if (!driver) {
      console.log("email:", email);
      console.log("otp: null");
      console.log("driver: null");
      console.log("mailStatus: failed");
      return res.status(404).json({
        success: false,
        message: "No driver account found. Please contact your travel agency.",
      });
    }

    const otp    = genOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    driver.emailOtp        = otp;
    driver.emailOtpExpiry  = expiry;
    driver.emailOtpAttempts = 0;
    await driver.save();

    // Send OTP email
    try {
      await sendOtpEmail(driver.email, driver.name, otp);
      console.log("OTP Generated", otp);
      console.log("Mail Sent");
      console.log("email:", email);
      console.log("otp:", otp);
      console.log("driver:", driver);
      console.log("mailStatus: success");

      return res.json({ success: true, message: "OTP sent successfully" });
    } catch (emailErr) {
      console.error("[Driver OTP] Email delivery failed:", emailErr);
      console.log("email:", email);
      console.log("otp:", otp);
      console.log("driver:", driver);
      console.log("mailStatus: failed");
      
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

// ────────────────────────────────────────────────────────────────────────────
// AUTH — Verify Email OTP
// POST /api/driver/auth/verify-otp
// ────────────────────────────────────────────────────────────────────────────
router.post("/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP required" });
    }

    const driver = await Driver.findOne({ email: email.toLowerCase().trim() });
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // Check expiry
    if (!driver.emailOtp || !driver.emailOtpExpiry || new Date() > driver.emailOtpExpiry) {
      return res.status(400).json({ success: false, message: "OTP expired. Request a new one." });
    }

    // Brute-force guard
    if (driver.emailOtpAttempts >= 5) {
      return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
    }

    if (driver.emailOtp !== otp.toString().trim()) {
      driver.emailOtpAttempts += 1;
      await driver.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Success — clear OTP, mark verified, activate
    driver.emailOtp        = null;
    driver.emailOtpExpiry  = null;
    driver.emailOtpAttempts = 0;
    driver.emailVerified   = true;
    if (driver.status === "pending_verification") driver.status = "active";
    driver.lastLogin = new Date();
    await driver.save();

    const token = signToken(driver);
    res.json({
      success: true,
      token,
      driver: {
        id:     driver._id,
        name:   driver.name,
        email:  driver.email,
        phone:  driver.phone,
        photo:  driver.photo,
        status: driver.status,
        licenseNumber: driver.licenseNumber,
        vehicleNumber: driver.vehicleNumber,
      },
    });
  } catch (err) {
    console.error("[Driver verify-otp]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// AUTH — Google Sign-In
// POST /api/driver/auth/google
// Body: { googleUid, email, name, photo }
// ────────────────────────────────────────────────────────────────────────────
router.post("/auth/google", async (req, res) => {
  try {
    const { googleUid, email, name, photo } = req.body;
    if (!googleUid || !email) {
      return res.status(400).json({ success: false, message: "googleUid and email required" });
    }

    let driver = await Driver.findOne({ email: email.toLowerCase().trim() });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "No driver account found for this Google account. Contact your travel agency.",
      });
    }

    // Link Google UID if not set
    if (!driver.googleUid) {
      driver.googleUid = googleUid;
    }
    driver.emailVerified = true;
    if (driver.status === "pending_verification") driver.status = "active";
    if (name && !driver.name)   driver.name  = name;
    if (photo && !driver.photo) driver.photo = photo;
    driver.lastLogin = new Date();
    await driver.save();

    const token = signToken(driver);
    res.json({
      success: true,
      token,
      driver: {
        id:     driver._id,
        name:   driver.name,
        email:  driver.email,
        phone:  driver.phone,
        photo:  driver.photo,
        status: driver.status,
      },
    });
  } catch (err) {
    console.error("[Driver google-auth]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/driver/me — Driver profile + today's trip
// ────────────────────────────────────────────────────────────────────────────
router.get("/me", protectDriver, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Find today's trip assigned to this driver
    const todayTrip = await AgentTrip.findOne({
      driver: req.driver._id,
      startDate: today,
      status: { $in: ["published", "ongoing"] },
      isDeleted: { $ne: true },
    }).populate("agent", "companyName phone email");

    res.json({
      success: true,
      driver: {
        id:     req.driver._id,
        name:   req.driver.name,
        email:  req.driver.email,
        phone:  req.driver.phone,
        photo:  req.driver.photo,
        status: req.driver.status,
        licenseNumber: req.driver.licenseNumber,
        vehicleNumber: req.driver.vehicleNumber,
        emergencyContact: req.driver.emergencyContact,
      },
      todayTrip: todayTrip || null,
    });
  } catch (err) {
    console.error("[Driver me]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/driver/dashboard — Stats for today's trip
// ────────────────────────────────────────────────────────────────────────────
router.get("/dashboard", protectDriver, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const trip = await AgentTrip.findOne({
      driver: req.driver._id,
      startDate: today,
      isDeleted: { $ne: true },
    });

    if (!trip) {
      return res.json({ success: true, trip: null, stats: null, boardingLog: [] });
    }

    // Get all bookings for this trip
    const bookings = await Booking.find({
      agentTrip: trip._id,
      paymentStatus: { $ne: "Cancelled" },
    }).populate("userId", "displayName email");

    const total    = bookings.reduce((s, b) => s + (b.seats || 1), 0);
    const boarded  = bookings.filter(b => b.boardingStatus === "boarded").length;
    const noShow   = bookings.filter(b => b.boardingStatus === "no_show").length;
    const pending  = bookings.filter(b => b.boardingStatus === "not_boarded").length;

    // Boarding timeline — most recent first
    const boardingLog = bookings
      .filter(b => b.boardingStatus === "boarded" && b.boardedAt)
      .sort((a, b) => new Date(b.boardedAt) - new Date(a.boardedAt))
      .slice(0, 20)
      .map(b => ({
        bookingId:    b.bookingId,
        travelerName: b.travelerName,
        seatNumber:   b.assignedSeat,
        boardedAt:    b.boardedAt,
        gender:       b.gender,
      }));

    res.json({
      success: true,
      trip: {
        _id:           trip._id,
        title:         trip.title,
        destinations:  trip.destinations,
        startDate:     trip.startDate,
        departureTime: trip.departureTime,
        pickupLocation:trip.pickupLocation,
        dropPoint:     trip.dropPoint,
        busNumber:     trip.busNumber,
        busType:       trip.busType,
        totalSeats:    trip.totalSeats,
        availableSeats:trip.availableSeats,
        bookedSeats:   trip.bookedSeats,
        emergencyContact: trip.emergencyContact,
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

// ────────────────────────────────────────────────────────────────────────────
// GET /api/driver/trip/:tripId/manifest — Full passenger manifest
// ────────────────────────────────────────────────────────────────────────────
router.get("/trip/:tripId/manifest", protectDriver, async (req, res) => {
  try {
    const trip = await AgentTrip.findOne({ _id: req.params.tripId, isDeleted: { $ne: true } });
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    // Verify driver is assigned to this trip
    if (!trip.driver || trip.driver.toString() !== req.driver._id.toString()) {
      return res.status(403).json({ success: false, message: "Not assigned to this trip" });
    }

    const bookings = await Booking.find({
      agentTrip: trip._id,
      paymentStatus: { $ne: "Cancelled" },
    });

    const passengers = bookings.map(b => ({
      bookingId:     b.bookingId,
      travelerName:  b.travelerName,
      gender:        b.gender,
      age:           b.age,
      phone:         b.contactNumber,
      seats:         b.seats,
      boardingStatus:b.boardingStatus,
      assignedSeat:  b.assignedSeat,
      pickupLocation:b.pickupLocation || trip.pickupLocation,
      boardedAt:     b.boardedAt,
    }));

    res.json({ success: true, trip, passengers });
  } catch (err) {
    console.error("[Driver manifest]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/driver/trips/:tripId/open-boarding — Open boarding for a trip
// ────────────────────────────────────────────────────────────────────────────
router.post("/trips/:tripId/open-boarding", protectDriver, async (req, res) => {
  try {
    const trip = await AgentTrip.findOne({
      _id: req.params.tripId,
      driver: req.driver._id,
      isDeleted: { $ne: true }
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found or not assigned to you" });
    }

    trip.boardingStatus = "OPEN";
    trip.boardingOpenedAt = new Date();

    // Calculate boardingClosedAt as departureTime minus 15 minutes
    let closedAt = new Date();
    if (trip.startDate && trip.departureTime) {
      const [hours, minutes] = trip.departureTime.split(":").map(Number);
      const departureDateTime = new Date(trip.startDate);
      departureDateTime.setHours(hours, minutes, 0, 0);
      closedAt = new Date(departureDateTime.getTime() - 15 * 60 * 1000);
    } else {
      // fallback to 1 hour from now
      closedAt = new Date(Date.now() + 60 * 60 * 1000);
    }
    
    trip.boardingClosedAt = closedAt;
    trip.boardingClosesAt = closedAt;
    await trip.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("boarding-opened", { 
        tripId: trip._id, 
        status: "OPEN"
      });
      console.log(`[Socket] Broadcasted boarding-opened for trip ${trip._id}`);
    }

    res.json({
      success: true,
      boardingStatus: trip.boardingStatus,
      openedAt: trip.boardingOpenedAt,
      closedAt: trip.boardingClosedAt
    });
  } catch (err) {
    console.error("[Driver open-boarding]", err);
    res.status(500).json({ success: false, message: "Server error opening boarding" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/driver/trips/:tripId/close-boarding — Close boarding for a trip
// ────────────────────────────────────────────────────────────────────────────
router.post("/trips/:tripId/close-boarding", protectDriver, async (req, res) => {
  try {
    const trip = await AgentTrip.findOne({
      _id: req.params.tripId,
      driver: req.driver._id,
      isDeleted: { $ne: true }
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found or not assigned to you" });
    }

    trip.boardingStatus = "CLOSED";
    trip.boardingClosedAt = new Date();
    await trip.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("boarding-closed", { 
        tripId: trip._id, 
        status: "CLOSED" 
      });
      console.log(`[Socket] Broadcasted boarding-closed for trip ${trip._id}`);
    }

    res.json({
      success: true,
      boardingStatus: trip.boardingStatus,
      closedAt: trip.boardingClosedAt
    });
  } catch (err) {
    console.error("[Driver close-boarding]", err);
    res.status(500).json({ success: false, message: "Server error closing boarding" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/driver/scan — Validate QR and return passenger info
// Body: { qrToken }
// ────────────────────────────────────────────────────────────────────────────
router.post("/scan", protectDriver, async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ success: false, message: "QR token required" });

    // 1. Verify JWT signature
    let payload;
    try {
      payload = jwt.verify(qrToken, process.env.DRIVER_QR_SECRET || process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(400).json({
        success: false,
        code: "INVALID_QR",
        message: jwtErr.name === "TokenExpiredError" ? "QR code has expired" : "Invalid QR code",
      });
    }

    const { bookingId, tripId, userId, encryptedToken, expiryTime } = payload;

    // Validate token parameters
    if (!bookingId || !tripId || !userId || !encryptedToken || !expiryTime) {
      return res.status(400).json({ success: false, message: "Invalid QR code contents" });
    }

    // Verify expiration time
    const nowSecs = Math.floor(Date.now() / 1000);
    if (nowSecs > expiryTime) {
      return res.status(400).json({
        success: false,
        code: "INVALID_QR",
        message: "QR code has expired",
      });
    }

    // Find booking
    const booking = await Booking.findOne({ _id: bookingId }).populate("userId", "displayName email photo");
    if (!booking) {
      return res.status(404).json({ success: false, code: "BOOKING_NOT_FOUND", message: "Booking not found" });
    }

    // Find trip
    const trip = await AgentTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, code: "TRIP_NOT_FOUND", message: "Trip not found" });
    }

    // Verify driver is assigned to this trip
    if (!trip.driver || trip.driver.toString() !== req.driver._id.toString()) {
      return res.status(403).json({
        success: false,
        code: "WRONG_DRIVER",
        message: "You are not assigned to this trip",
      });
    }

    // Verify user ownership
    if (booking.userId && booking.userId._id.toString() !== userId) {
      return res.status(400).json({ success: false, message: "User ID mismatch" });
    }

    // Verify trip date
    const today = new Date().toISOString().split("T")[0];
    if (trip.startDate !== today) {
      return res.status(400).json({
        success: false,
        code: "WRONG_DATE",
        message: `QR is valid only on ${trip.startDate}. Today is ${today}.`,
      });
    }

    // Compute token hash for reuse check
    const tokenHash = crypto.createHash("sha256").update(qrToken).digest("hex");
    const existingPass = await BoardingPass.findOne({ qrTokenHash: tokenHash });
    if (existingPass && existingPass.status === "boarded") {
      const alreadyBooking = await Booking.findById(existingPass.booking);
      const seat = alreadyBooking?.assignedSeat || "N/A";
      const bTime = alreadyBooking?.boardedAt ? new Date(alreadyBooking.boardedAt).toLocaleTimeString("en-IN", {hour: "2-digit", minute:"2-digit"}) : "N/A";
      return res.status(400).json({
        success: false,
        code: "ALREADY_BOARDED",
        message: `Passenger Already Boarded\nSeat Number: ${seat}\nBoarded Time: ${bTime}`,
      });
    }

    // Check if already boarded in Booking record
    if (booking.boardingStatus === "Boarded") {
      const seat = booking.assignedSeat || "N/A";
      const bTime = booking.boardedAt ? new Date(booking.boardedAt).toLocaleTimeString("en-IN", {hour: "2-digit", minute:"2-digit"}) : "N/A";
      return res.status(400).json({
        success: false,
        code: "ALREADY_BOARDED",
        message: `Passenger Already Boarded\nSeat Number: ${seat}\nBoarded Time: ${bTime}`,
      });
    }

    // Get or create BoardingPass
    let boardingPass = await BoardingPass.findOne({ booking: booking._id, agentTrip: trip._id });
    if (!boardingPass) {
      boardingPass = await BoardingPass.create({
        booking:      booking._id,
        bookingId:    booking.bookingId,
        agentTrip:    trip._id,
        userId:       booking.userId,
        driver:       req.driver._id,
        qrTokenHash:  tokenHash,
        qrGeneratedAt:new Date(payload.iat * 1000),
      });
    }

    // Update booking directly to Boarded upon successful scan
    booking.boardingStatus = "Boarded";
    booking.boardedAt      = new Date();
    booking.checkedIn      = true;
    booking.boarded        = true;
    booking.seatAssigned   = true;
    booking.driverId       = req.driver._id;
    if (!booking.assignedSeat && booking.seatNumbers?.length > 0) {
      booking.assignedSeat = booking.seatNumbers[0];
    }
    await booking.save();

    // Update BoardingPass status
    boardingPass.status = "boarded";
    boardingPass.boardedAt = new Date();
    boardingPass.seatNumber = booking.assignedSeat || "";
    boardingPass.driver = req.driver._id;
    await boardingPass.save();

    // Update trip boardedCount
    trip.boardedCount = (trip.boardedCount || 0) + 1;
    await trip.save();

    // Emit Socket event: booking-boarded
    const io = req.app.get("io");
    if (io) {
      io.emit("booking-boarded", {
        bookingId: booking._id.toString(),
        tripId: trip._id.toString(),
        status: "Boarded",
        boardedAt: booking.boardedAt
      });
      console.log(`[Socket] Broadcasted booking-boarded for booking ${booking._id}`);
    }

    // Trigger seat notification
    if (booking.userId) {
      try {
        await triggerNotification(
          booking.userId._id,
          "Seat Assigned",
          `Welcome aboard! You have been verified for seat ${booking.assignedSeat || "N/A"} for your trip ${trip.title}.`,
          "success",
          trip._id
        );
      } catch (notifErr) {
        console.error("Failed to trigger seat assigned notification:", notifErr);
      }
    }

    res.json({
      success:    true,
      valid:      true,
      boardingPassId: boardingPass._id,
      passenger: {
        bookingId:     booking.bookingId,
        travelerName:  booking.travelerName,
        gender:        booking.gender,
        age:           booking.age,
        phone:         booking.contactNumber,
        seats:         booking.seats,
        pickupLocation:booking.pickupLocation || trip.pickupLocation,
        assignedSeat:  booking.assignedSeat,
        boardingStatus:booking.boardingStatus,
        adults:        booking.adults || 1,
        children:      booking.children || 0,
        photo:         booking.userId?.photo || "",
        paymentStatus: booking.paymentStatus || "Paid",
        boardedAt:     booking.boardedAt,
      },
      trip: {
        _id:           trip._id,
        title:         trip.title,
        busNumber:     trip.busNumber,
        departureTime: trip.departureTime,
        destinations:  trip.destinations,
      },
    });
  } catch (err) {
    console.error("[Driver scan]", err);
    res.status(500).json({ success: false, message: "Server error during scan" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/driver/board/:bookingId — Mark boarded + assign seat
// Body: { seatNumber, boardingPassId }
// ────────────────────────────────────────────────────────────────────────────
router.post("/board/:bookingId", protectDriver, async (req, res) => {
  try {
    const { seatNumber, boardingPassId } = req.body;

    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const trip = await AgentTrip.findById(booking.agentTrip);
    if (!trip || !trip.driver || trip.driver.toString() !== req.driver._id.toString()) {
      return res.status(403).json({ success: false, message: "Not assigned to this trip" });
    }

    // Update booking
    booking.boardingStatus = "Boarded";
    booking.assignedSeat   = seatNumber || booking.assignedSeat || "";
    booking.boardedAt      = new Date();
    booking.checkedIn      = true;
    booking.boarded        = true;
    booking.seatAssigned   = true;
    booking.driverId       = req.driver._id;
    await booking.save();

    // Update BoardingPass
    if (boardingPassId) {
      await BoardingPass.findByIdAndUpdate(boardingPassId, {
        status:     "boarded",
        boardedAt:  new Date(),
        seatNumber: seatNumber || "",
        driver:     req.driver._id,
      });
    }

    // Emit Socket event: booking-boarded
    const io = req.app.get("io");
    if (io) {
      io.emit("booking-boarded", {
        bookingId: booking._id.toString(),
        tripId: trip._id.toString(),
        status: "Boarded",
        boardedAt: booking.boardedAt
      });
      console.log(`[Socket] Broadcasted booking-boarded for booking ${booking._id}`);
    }

    // Trigger Seat Assigned notification for current traveler
    if (booking.userId) {
      try {
        await triggerNotification(
          booking.userId,
          "Seat Assigned",
          `Welcome aboard! You have been assigned seat ${seatNumber || "N/A"} for your trip ${trip.title}.`,
          "success",
          trip._id
        );
      } catch (notifErr) {
        console.error("Failed to trigger seat assigned notification:", notifErr);
      }
    }

    res.json({
      success: true,
      message: "Passenger boarded successfully",
      assignedSeat: seatNumber,
      boardedAt: booking.boardedAt,
    });
  } catch (err) {
    console.error("[Driver board]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/driver/no-show/:bookingId — Mark as no-show
// ────────────────────────────────────────────────────────────────────────────
router.post("/no-show/:bookingId", protectDriver, async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    booking.boardingStatus = "no_show";
    await booking.save();

    const trip = await AgentTrip.findById(booking.agentTrip);
    if (trip) {
      trip.noShowCount = (trip.noShowCount || 0) + 1;
      await trip.save();
    }

    res.json({ success: true, message: "Marked as no-show" });
  } catch (err) {
    console.error("[Driver no-show]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/driver/seats/:tripId — Get occupied seats for a trip
// ────────────────────────────────────────────────────────────────────────────
router.get("/seats/:tripId", protectDriver, async (req, res) => {
  try {
    const bookings = await Booking.find({
      agentTrip: req.params.tripId,
      paymentStatus: { $ne: "Cancelled" },
    }).select("assignedSeat boardingStatus bookingId travelerName");

    const occupiedSeats = bookings
      .filter(b => b.assignedSeat)
      .map(b => ({
        seat:         b.assignedSeat,
        bookingId:    b.bookingId,
        travelerName: b.travelerName,
        status:       b.boardingStatus,
      }));

    res.json({ success: true, occupiedSeats });
  } catch (err) {
    console.error("[Driver seats]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
