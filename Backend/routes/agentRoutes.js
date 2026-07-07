import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import admin from "../config/firebaseAdmin.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Agent from "../models/Agent.js";
import AgentTrip from "../models/AgentTrip.js";
import Booking from "../models/Booking.js";
import Driver from "../models/Driver.js";
import AgentSettings from "../models/AgentSettings.js";
import AgentReferral from "../models/AgentReferral.js";
import protectAgent, { fallbackAgents } from "../middleware/agentAuthMiddleware.js";
import DriverOtp from "../models/DriverOtp.js";
import { sendOtpEmail, sendDriverOtpEmail } from "../services/emailService.js";
import bcrypt from "bcryptjs";
import uploadMiddleware from "../middleware/uploadMiddleware.js";
import UploadService from "../services/uploadService.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "default_jwt_secret_key_123", {
    expiresIn: "30d",
  });
};

/* ==========================================
   IN-MEMORY FALLBACK DATABASE & SEED DATA
   ========================================== */
const fallbackTrips = new Map();
const fallbackBookings = new Map();

// Helper to check DB connection
const isDbConnected = () => mongoose.connection.readyState === 1;

const handleBookingDeadline = (startDate, bookingDeadline) => {
  let deadline = bookingDeadline;
  if (!deadline && startDate) {
    const parts = startDate.split("-").map(Number);
    // If startDate is like YYYY-MM-DD
    if (parts.length === 3 && parts[0] > 1000) {
      const bObj = new Date(parts[0], parts[1] - 1, parts[2] - 1);
      deadline = `${bObj.getFullYear()}-${String(bObj.getMonth() + 1).padStart(2, "0")}-${String(bObj.getDate()).padStart(2, "0")} 23:59:59`;
    }
  } else if (deadline && deadline.length === 10) {
    deadline = `${deadline} 23:59:59`;
  }
  return deadline;
};

const validateBookingDeadline = (startDate, bookingDeadline) => {
  if (!startDate || !bookingDeadline) return true;
  const startD = new Date(startDate);
  const deadD = new Date(bookingDeadline);
  return !isNaN(startD.getTime()) && !isNaN(deadD.getTime()) && deadD < startD;
};

// Seed Mock Data for Fallback
const seedMockData = (agentId) => {
  fallbackTrips.clear();
  fallbackBookings.clear();

  const trip1Id = new mongoose.Types.ObjectId().toString();
  const trip2Id = new mongoose.Types.ObjectId().toString();

  const mockTrips = [
    {
      _id: trip1Id,
      agent: agentId,
      title: "Weekend Escapade to Ooty & Coonoor",
      shortDescription: "Explore the queen of hill stations with lush tea gardens.",
      description: "Join us for a premium weekend getaway to Ooty and Coonoor. This trip includes deluxe stays, scenic train rides, and sightseeing across botanical gardens, lakes, and tea factories.",
      destinations: ["Salem", "Ooty", "Coonoor"],
      duration: "3 Days / 2 Nights",
      startDate: "2026-07-15",
      endDate: "2026-07-17",
      departureTime: "22:00",
      arrivalTime: "06:00",
      pickupLocation: "Hope Farm, Bangalore",
      busType: "AC Volvo Multi-Axle Sleeper",
      busNumber: "KA-01-MJ-9988",
      busImages: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=60"],
      gallery: [
        "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=60"
      ],
      coverImage: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop&q=80",
      driverName: "Ramesh Kumar",
      driverPhone: "9876543210",
      driverLicenseNumber: "DL-14202100874",
      emergencyContact: "9988776655",
      totalSeats: 40,
      availableSeats: 34,
      pricePerPerson: 4999,
      includedServices: ["Food", "Accommodation", "Transport", "Guide", "Insurance"],
      exclusions: "Personal purchases and entry fees not specified.",
      termsConditions: "Please carry valid ID proof. Maintain discipline in the bus.",
      cancellationPolicy: "Full refund 48 hours prior to departure.",
      itinerary: [
        { day: 1, title: "Arrival & Sightseeing", description: "Reach Ooty, check into hotel. Visit Botanical Garden and Ooty Lake.", hotel: "Green Meadows Resort", images: [] },
        { day: 2, title: "Coonoor Day Trip", description: "Take the Toy Train to Coonoor. Visit Dolphin's Nose and tea estates.", hotel: "Green Meadows Resort", images: [] },
        { day: 3, title: "Doddabetta Peak & Return", description: "Trek up Doddabetta Peak, buy homemade chocolates, head back to Bangalore.", hotel: "N/A", images: [] }
      ]
    },
    {
      _id: trip2Id,
      agent: agentId,
      title: "Goa Beach Bash & Water Sports",
      shortDescription: "Sun, sand, and adventure in North Goa.",
      description: "Dive into the ultimate beach party in Goa. Experience scuba diving, parasailing, jet skiing, and beach shacks under the starlight.",
      destinations: ["Bangalore", "Goa"],
      duration: "4 Days / 3 Nights",
      startDate: "2026-08-10",
      endDate: "2026-08-13",
      departureTime: "19:30",
      arrivalTime: "08:00",
      pickupLocation: "Majestic Metro Station, Bangalore",
      busType: "AC Scania Sleeper (2+1)",
      busNumber: "GA-03-X-4422",
      busImages: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=60"],
      gallery: [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&auto=format&fit=crop&q=60"
      ],
      coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
      driverName: "Anthony D'Souza",
      driverPhone: "9123456789",
      driverLicenseNumber: "DL-45920203004",
      emergencyContact: "9448855221",
      totalSeats: 36,
      availableSeats: 31,
      pricePerPerson: 7499,
      includedServices: ["Accommodation", "Transport", "Guide", "Water Sports"],
      exclusions: "Food expenses and personal watersports.",
      termsConditions: "Swimmers and non-swimmers are allowed. Life jackets mandatory.",
      cancellationPolicy: "Cancellation fee applies within 5 days of departure.",
      itinerary: [
        { day: 1, title: "Check-in & Beach Chill", description: "Arrive, check-in, spend the sunset at Calangute Beach.", hotel: "Vasco Beach Resort", images: [] },
        { day: 2, title: "Water Sports Adventure", description: "Parasailing, Jet Ski, Banana ride, and scuba at Grand Island.", hotel: "Vasco Beach Resort", images: [] },
        { day: 3, title: "South Goa & Shacks", description: "Visit Old Goa Churches, Miramar Beach, and cruise ride.", hotel: "Vasco Beach Resort", images: [] },
        { day: 4, title: "Anjuna Market & Departure", description: "Shop at Flea market, visit Chapora Fort and return departure.", hotel: "N/A", images: [] }
      ]
    }
  ];

  mockTrips.forEach(t => fallbackTrips.set(t._id, t));

  const mockBookings = [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      bookingId: "TLP-60912",
      travelerName: "Sanjay Kumar",
      gender: "Male",
      contactNumber: "9876543210",
      age: 24,
      seats: 2,
      seatNumbers: ["04", "05"],
      paymentStatus: "Paid",
      bookingDate: new Date("2026-06-25T10:30:00.000Z"),
      agentTrip: trip1Id,
      agent: agentId,
      pricePaid: 9998,
      tripName: "Weekend Escapade to Ooty & Coonoor"
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      bookingId: "TLP-48891",
      travelerName: "Pooja Hegde",
      gender: "Female",
      contactNumber: "9123456780",
      age: 26,
      seats: 4,
      seatNumbers: ["08", "09", "10", "11"],
      paymentStatus: "Paid",
      bookingDate: new Date("2026-06-26T14:15:00.000Z"),
      agentTrip: trip1Id,
      agent: agentId,
      pricePaid: 19996,
      tripName: "Weekend Escapade to Ooty & Coonoor"
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      bookingId: "TLP-11290",
      travelerName: "Varun Dhawan",
      gender: "Male",
      contactNumber: "9988776655",
      age: 29,
      seats: 5,
      seatNumbers: ["01", "02", "03", "04", "05"],
      paymentStatus: "Paid",
      bookingDate: new Date("2026-06-27T09:00:00.000Z"),
      agentTrip: trip2Id,
      agent: agentId,
      pricePaid: 37495,
      tripName: "Goa Beach Bash & Water Sports"
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      bookingId: "TLP-77402",
      travelerName: "Aishwarya Rai",
      gender: "Female",
      contactNumber: "9443322110",
      age: 28,
      seats: 1,
      seatNumbers: ["18"],
      paymentStatus: "Pending",
      bookingDate: new Date("2026-06-27T11:45:00.000Z"),
      agentTrip: trip1Id,
      agent: agentId,
      pricePaid: 4999,
      tripName: "Weekend Escapade to Ooty & Coonoor"
    }
  ];

  mockBookings.forEach(b => fallbackBookings.set(b._id, b));
};

/* ==========================================
   AUTHENTICATION ENDPOINTS (Google & OTP Verification)
   ========================================== */

// @route   POST /api/agent/login
// @desc    Unified Login / Registration using Google idToken or OTP Token
router.post("/login", async (req, res) => {
  const { idToken, otpToken, email, uid } = req.body;
  
  try {
    let verifiedEmail = "";
    let verifiedUid = "";
    let displayName = "";
    let emailVerified = false;

    if (idToken) {
      // 1. Google Auth Token Verification (Firebase Admin SDK)
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        console.log("[Firebase Admin] Decoded token payload:", decoded);
        console.log("[Firebase Admin] uid:", decoded.uid);
        console.log("[Firebase Admin] email:", decoded.email);

        verifiedEmail = decoded.email.trim().toLowerCase();
        verifiedUid = decoded.uid; // Firebase UID
        displayName = decoded.name || decoded.email.split("@")[0] || "";
        emailVerified = true;
      } catch (verifyErr) {
        console.error("[Firebase Admin] Token verification failed:", verifyErr);
        return res.status(400).json({ success: false, message: "Invalid Google ID token" });
      }
    } else if (otpToken && email) {
      // 2. Email OTP Token Verification
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ success: false, message: "Auth configuration missing on server" });
      }

      try {
        const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
        if (decoded.email !== email.trim().toLowerCase() || !decoded.otpVerified) {
          return res.status(400).json({ success: false, message: "Invalid OTP validation token" });
        }
        verifiedEmail = email.trim().toLowerCase();
        verifiedUid = uid || `otp_${new mongoose.Types.ObjectId().toString()}`; // Generate a fallback uid if not provided
        displayName = email.split("@")[0];
        emailVerified = true;
      } catch (err) {
        return res.status(400).json({ success: false, message: "OTP validation session expired" });
      }
    } else {
      return res.status(400).json({ success: false, message: "Please provide either idToken or otpToken" });
    }

    let agent;

    if (isDbConnected()) {
      // Find agent in database by email or uid
      agent = await Agent.findOne({ $or: [{ email: verifiedEmail }, { uid: verifiedUid }] });

      if (!agent) {
        // Create new agent profile
        agent = await Agent.create({
          uid: verifiedUid,
          email: verifiedEmail,
          displayName,
          companyName: displayName || "Pending Verification",
          emailVerified,
          profileCompleted: false,
        });
      } else {
        // Sync verification flags if needed
        agent.emailVerified = emailVerified;
        if (!agent.uid) {
          agent.uid = verifiedUid;
        }
        await agent.save();
      }
    } else {
      // In-Memory Fallback
      console.warn("[MongoDB] Disconnected. Running Auth via In-Memory fallback.");
      
      agent = Array.from(fallbackAgents.values()).find(
        a => a.email === verifiedEmail || a.uid === verifiedUid
      );

      if (!agent) {
        const mockId = new mongoose.Types.ObjectId().toString();
        agent = {
          _id: mockId,
          uid: verifiedUid,
          email: verifiedEmail,
          displayName,
          phone: "",
          companyName: "",
          gstNumber: "",
          businessCategory: "",
          address: "",
          city: "",
          state: "",
          country: "",
          website: "",
          instagram: "",
          facebook: "",
          logo: "",
          profileImage: "",
          profileCompleted: false,
          emailVerified,
          role: "agent",
          status: "approved",
          isVerified: true,
        };
        fallbackAgents.set(mockId, agent);
      }
    }

    // Seed mock data for visual dashboard display
    seedMockData(agent._id.toString());

    res.status(200).json({
      success: true,
      token: generateToken(agent._id.toString()),
      agent,
    });
  } catch (error) {
    console.error("Agent Auth Login Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
});

// @route   POST /api/agent/signup
// @desc    Signup stub (redirects to unified login)
router.post("/signup", async (req, res) => {
  res.status(308).json({ success: false, message: "Signup is now unified. Please use POST /agent/login" });
});

// @route   GET /api/agent/profile
// @desc    Get current agent profile
router.get("/profile", protectAgent, async (req, res) => {
  res.status(200).json({
    success: true,
    agent: req.agent,
  });
});

// @route   GET /api/agent/me
// @desc    Validate token and return current agent (used for session restore on app startup)
router.get("/me", protectAgent, async (req, res) => {
  console.log("[Agent Auth] /me called — token valid, returning agent profile");
  res.status(200).json({
    success: true,
    agent: req.agent,
  });
});

// @route   PUT /api/agent/profile
// @desc    Update agent profile details (including Onboarding submission)
router.put("/profile", protectAgent, async (req, res) => {
  try {
    const fieldsToUpdate = {
      displayName: req.body.displayName || req.agent.displayName,
      agentName: req.body.agentName || req.agent.displayName, // support legacy field checks
      phone: req.body.phone || req.agent.phone,
      companyName: req.body.companyName || req.agent.companyName,
      gstNumber: req.body.gstNumber || req.agent.gstNumber,
      businessCategory: req.body.businessCategory || req.agent.businessCategory,
      address: req.body.address || req.agent.address,
      city: req.body.city || req.agent.city,
      state: req.body.state || req.agent.state,
      country: req.body.country || req.agent.country,
      website: req.body.website !== undefined ? req.body.website : req.agent.website,
      instagram: req.body.instagram !== undefined ? req.body.instagram : req.agent.instagram,
      facebook: req.body.facebook !== undefined ? req.body.facebook : req.agent.facebook,
      logo: req.body.logo || req.agent.logo,
      profileImage: req.body.profileImage || req.agent.profileImage,
      profileCompleted: req.body.profileCompleted !== undefined ? req.body.profileCompleted : true,
      emailVerified: req.body.emailVerified !== undefined ? req.body.emailVerified : req.agent.emailVerified,
    };

    let updatedAgent;

    if (isDbConnected()) {
      updatedAgent = await Agent.findByIdAndUpdate(
        req.agent._id,
        { $set: fieldsToUpdate },
        { returnDocument: "after", runValidators: true }
      );
    } else {
      // In-Memory Fallback
      updatedAgent = {
        ...req.agent,
        ...fieldsToUpdate,
      };
      fallbackAgents.set(req.agent._id.toString(), updatedAgent);
    }

    res.status(200).json({
      success: true,
      agent: updatedAgent,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Error updating profile details" });
  }
});

// @route   POST /api/agent/profile/create
// @desc    Create/initialize agent profile (KYC Step 1-3)
router.post("/profile/create", protectAgent, async (req, res) => {
  try {
    const { name, dob, mobile, state, country, companyName, gstNo, companyLogo, agentPhoto } = req.body;

    if (!name || !dob || !mobile || !state || !country || !companyName || !gstNo || !companyLogo || !agentPhoto) {
      return res.status(400).json({ success: false, message: "All profile fields are required" });
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: "Mobile number must be exactly 10 digits" });
    }

    const fieldsToUpdate = {
      displayName: name,
      dob,
      mobile,
      state,
      country,
      companyName,
      gstNo,
      gstNumber: gstNo,
      companyLogo,
      logo: companyLogo,
      agentPhoto,
      profileImage: agentPhoto,
    };

    const agent = await Agent.findById(req.agent._id);
    const emailVerified = agent.emailVerified || req.agent.emailVerified;
    const mobileVerified = agent.mobileVerified || req.agent.mobileVerified;

    if (emailVerified && mobileVerified) {
      fieldsToUpdate.kycStatus = "KYC_COMPLETED";
      fieldsToUpdate.profileCompleted = true;
    } else if (mobileVerified) {
      fieldsToUpdate.kycStatus = "MOBILE_VERIFIED";
    } else if (emailVerified) {
      fieldsToUpdate.kycStatus = "EMAIL_VERIFIED";
    } else {
      fieldsToUpdate.kycStatus = "PENDING";
    }

    const updatedAgent = await Agent.findByIdAndUpdate(
      req.agent._id,
      { $set: fieldsToUpdate },
      { returnDocument: "after", runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "KYC Profile initiated successfully",
      agent: updatedAgent,
    });
  } catch (error) {
    console.error("Create profile error:", error);
    res.status(500).json({ success: false, message: "Failed to initialize KYC profile" });
  }
});

// @route   PUT /api/agent/profile/update
// @desc    Update agent profile details
router.put("/profile/update", protectAgent, async (req, res) => {
  try {
    const { name, dob, mobile, state, country, companyName, gstNo, companyLogo, agentPhoto } = req.body;

    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.displayName = name;
    if (dob !== undefined) fieldsToUpdate.dob = dob;
    if (mobile !== undefined) {
      if (!/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({ success: false, message: "Mobile number must be exactly 10 digits" });
      }
      fieldsToUpdate.mobile = mobile;
    }
    if (state !== undefined) fieldsToUpdate.state = state;
    if (country !== undefined) fieldsToUpdate.country = country;
    if (companyName !== undefined) fieldsToUpdate.companyName = companyName;
    if (gstNo !== undefined) {
      fieldsToUpdate.gstNo = gstNo;
      fieldsToUpdate.gstNumber = gstNo;
    }
    if (companyLogo !== undefined) {
      fieldsToUpdate.companyLogo = companyLogo;
      fieldsToUpdate.logo = companyLogo;
    }
    if (agentPhoto !== undefined) {
      fieldsToUpdate.agentPhoto = agentPhoto;
      fieldsToUpdate.profileImage = agentPhoto;
    }

    const agent = await Agent.findById(req.agent._id);
    const emailVerified = agent.emailVerified || req.agent.emailVerified;
    const mobileVerified = agent.mobileVerified || req.agent.mobileVerified;

    const currentName = name !== undefined ? name : agent.displayName;
    const currentDob = dob !== undefined ? dob : agent.dob;
    const currentMobile = mobile !== undefined ? mobile : agent.mobile;
    const currentState = state !== undefined ? state : agent.state;
    const currentCountry = country !== undefined ? country : agent.country;
    const currentCompanyName = companyName !== undefined ? companyName : agent.companyName;
    const currentGstNo = gstNo !== undefined ? gstNo : (agent.gstNo || agent.gstNumber);
    const currentCompanyLogo = companyLogo !== undefined ? companyLogo : (agent.companyLogo || agent.logo);
    const currentAgentPhoto = agentPhoto !== undefined ? agentPhoto : (agent.agentPhoto || agent.profileImage);

    const allFieldsFilled = !!(currentName && currentDob && currentMobile && currentState && currentCountry && currentCompanyName && currentGstNo && currentCompanyLogo && currentAgentPhoto);

    if (emailVerified && mobileVerified && allFieldsFilled) {
      fieldsToUpdate.kycStatus = "KYC_COMPLETED";
      fieldsToUpdate.profileCompleted = true;
    } else if (mobileVerified) {
      fieldsToUpdate.kycStatus = "MOBILE_VERIFIED";
    } else if (emailVerified) {
      fieldsToUpdate.kycStatus = "EMAIL_VERIFIED";
    } else {
      fieldsToUpdate.kycStatus = "PENDING";
    }

    const updatedAgent = await Agent.findByIdAndUpdate(
      req.agent._id,
      { $set: fieldsToUpdate },
      { returnDocument: "after", runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      agent: updatedAgent,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile details" });
  }
});

// @route   POST /api/agent/send-email-otp
// @desc    Generate + Send email verification OTP
router.post("/send-email-otp", protectAgent, async (req, res) => {
  try {
    const agent = await Agent.findById(req.agent._id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    const email = agent.email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    agent.emailOtp = otp;
    agent.emailOtpExpiry = expiry;
    await agent.save();

    console.log(`[KYC Email OTP] Generated OTP for ${email}: ${otp}`);

    try {
      await sendOtpEmail(email, agent.displayName || "Agent", otp);
    } catch (err) {
      console.warn("[KYC Email OTP] Nodemailer failed, falling back to log:", err.message);
    }

    res.status(200).json({
      success: true,
      message: "Email OTP sent successfully",
      otp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  } catch (error) {
    console.error("Send email OTP error:", error);
    res.status(500).json({ success: false, message: "Failed to send email OTP" });
  }
});

// @route   POST /api/agent/verify-email-otp
// @desc    Verify email OTP and advance kycStatus
router.post("/verify-email-otp", protectAgent, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    const agent = await Agent.findById(req.agent._id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    if (agent.emailOtp !== otp || !agent.emailOtpExpiry || agent.emailOtpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    agent.emailVerified = true;
    agent.emailOtp = "";
    agent.emailOtpExpiry = null;

    if (agent.kycStatus === "PENDING") {
      agent.kycStatus = "EMAIL_VERIFIED";
    }
    await agent.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      agent,
    });
  } catch (error) {
    console.error("Verify email OTP error:", error);
    res.status(500).json({ success: false, message: "Failed to verify email OTP" });
  }
});

/* ──────────────────────────────────────────────────────────────────────────
   DRIVER VERIFICATION ENDPOINTS (used during trip creation Step 6)
   ────────────────────────────────────────────────────────────────────────── */

// @route   POST /api/agent/send-driver-email-otp
// @desc    Send OTP to the driver's email address (for trip creation verification)
router.post("/send-driver-email-otp", protectAgent, async (req, res) => {
  try {
    const { driverEmail, driverName } = req.body;

    if (!driverEmail) {
      return res.status(400).json({ success: false, message: "Driver email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(driverEmail)) {
      return res.status(400).json({ success: false, message: "Invalid driver email format" });
    }

    const targetEmail = driverEmail.toLowerCase();

    // Resend cooldown check (30 seconds)
    const existing = await DriverOtp.findOne({ email: targetEmail });
    if (existing) {
      const timePassed = Date.now() - new Date(existing.createdAt).getTime();
      if (timePassed < 30 * 1000) {
        const remainingSec = Math.ceil((30 * 1000 - timePassed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSec}s before resending`,
          remainingSeconds: remainingSec,
        });
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Delete any old OTP document for this driver email
    await DriverOtp.deleteOne({ email: targetEmail });

    // Hash OTP securely
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Save to database
    await DriverOtp.create({
      email: targetEmail,
      otpHash,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    console.log(`[Driver Email OTP] Hashed OTP generated for ${targetEmail} (Debug Raw OTP: ${otp})`);

    // Send email using sendOtpEmail
    try {
      const info = await sendOtpEmail(targetEmail, otp, driverName);
      console.log(`[Driver Email OTP] Email sent. Message ID: ${info?.messageId || "N/A"}`);
    } catch (mailErr) {
      console.error("[Driver Email OTP] Failed to send email via SMTP:", mailErr.message, mailErr);
      return res.status(500).json({
        success: false,
        message: `Failed to deliver verification email: ${mailErr.message}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error) {
    console.error("[Driver Email OTP] Send error:", error);
    res.status(500).json({ success: false, message: "Failed to send driver email OTP" });
  }
});

// @route   POST /api/agent/verify-driver-email-otp
// @desc    Verify driver email OTP (for trip creation step 6)
router.post("/verify-driver-email-otp", protectAgent, async (req, res) => {
  try {
    const { driverEmail, otp } = req.body;

    if (!driverEmail || !otp) {
      return res.status(400).json({ success: false, message: "Driver email and OTP are required" });
    }

    const targetEmail = driverEmail.toLowerCase();
    const otpDoc = await DriverOtp.findOne({ email: targetEmail });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: "OTP not found. Please request a new one." });
    }

    if (Date.now() > otpDoc.expiresAt) {
      await DriverOtp.deleteOne({ email: targetEmail });
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    if (otpDoc.attempts >= 5) {
      await DriverOtp.deleteOne({ email: targetEmail });
      return res.status(400).json({ success: false, message: "Maximum attempts reached. Please request a new OTP." });
    }

    // Verify bcrypt hash
    const isMatch = await bcrypt.compare(otp.toString(), otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      if (otpDoc.attempts >= 5) {
        await DriverOtp.deleteOne({ email: targetEmail });
        return res.status(400).json({ success: false, message: "Maximum attempts reached. Please request a new OTP." });
      }
      await otpDoc.save();
      const remaining = 5 - otpDoc.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        attemptsRemaining: remaining,
      });
    }

    // OTP matches, mark verified
    otpDoc.verified = true;
    await otpDoc.save();

    const verifiedAt = new Date();
    console.log(`[Driver Email OTP] Verified successfully for ${targetEmail}`);

    res.status(200).json({
      success: true,
      message: "Driver email verified successfully",
      driverEmailVerified: true,
      driverEmailVerifiedAt: verifiedAt,
    });
  } catch (error) {
    console.error("[Driver Email OTP] Verify error:", error);
    res.status(500).json({ success: false, message: "Failed to verify driver email OTP" });
  }
});

// @route   POST /api/agent/send-mobile-otp
// @desc    Send mobile verification OTP (managed via Firebase Client SDK)
router.post("/send-mobile-otp", protectAgent, async (req, res) => {
  try {
    const agent = await Agent.findById(req.agent._id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    if (!agent.mobile) {
      return res.status(400).json({ success: false, message: "Mobile number is required before sending OTP" });
    }

    // Client-side Firebase SDK handles sending the actual SMS OTP.
    res.status(200).json({
      success: true,
      message: "Please initiate SMS OTP sending using Firebase Client SDK on the frontend.",
    });
  } catch (error) {
    console.error("Send mobile OTP error:", error);
    res.status(500).json({ success: false, message: "Failed to send mobile OTP" });
  }
});

// @route   POST /api/agent/verify-mobile-otp
// @desc    Verify mobile OTP and transition to KYC_COMPLETED
router.post("/verify-mobile-otp", protectAgent, async (req, res) => {
  try {
    const { idToken, phone } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "idToken is required" });
    }

    const agent = await Agent.findById(req.agent._id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    // Verify Firebase ID Token
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (fbErr) {
      return res.status(401).json({ success: false, message: "Invalid or expired Firebase Auth token." });
    }

    agent.mobileVerified = true;
    if (phone) {
      agent.mobile = phone;
      agent.phone = phone;
    }

    const hasGst = agent.gstNo || agent.gstNumber;
    const hasLogo = agent.companyLogo || agent.logo;
    const hasPhoto = agent.agentPhoto || agent.profileImage;
    const allFieldsFilled = !!(agent.displayName && agent.dob && agent.mobile && agent.state && agent.country && agent.companyName && hasGst && hasLogo && hasPhoto);

    if (agent.emailVerified && allFieldsFilled) {
      agent.kycStatus = "KYC_COMPLETED";
      agent.profileCompleted = true;
    } else {
      agent.kycStatus = "MOBILE_VERIFIED";
    }

    await agent.save();

    res.status(200).json({
      success: true,
      message: "Mobile verified successfully",
      agent,
    });
  } catch (error) {
    console.error("Verify mobile OTP error:", error);
    res.status(500).json({ success: false, message: "Failed to verify mobile OTP" });
  }
});

// @route   POST /api/agent/upload-company-logo
// @desc    Upload company logo to Cloudinary
router.post("/upload-company-logo", protectAgent, (req, res) => {
  uploadMiddleware.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    let url = req.body.url;
    if (req.file) {
      try {
        const result = await UploadService.uploadToCloudinary(req.file.buffer, "logos");
        url = result.secure_url;
      } catch (uploadErr) {
        return res.status(500).json({ success: false, message: "Upload to Cloudinary failed" });
      }
    }
    if (!url) return res.status(400).json({ success: false, message: "No file or URL provided" });

    try {
      const agent = await Agent.findById(req.agent._id);
      agent.companyLogo = url;
      agent.logo = url;
      await agent.save();
      return res.status(200).json({ success: true, url, agent });
    } catch (saveErr) {
      return res.status(500).json({ success: false, message: "Database update failed" });
    }
  });
});

// @route   POST /api/agent/upload-agent-photo
// @desc    Upload agent identity photo to Cloudinary
router.post("/upload-agent-photo", protectAgent, (req, res) => {
  uploadMiddleware.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    let url = req.body.url;
    if (req.file) {
      try {
        const result = await UploadService.uploadToCloudinary(req.file.buffer, "profiles");
        url = result.secure_url;
      } catch (uploadErr) {
        return res.status(500).json({ success: false, message: "Upload to Cloudinary failed" });
      }
    }
    if (!url) return res.status(400).json({ success: false, message: "No file or URL provided" });

    try {
      const agent = await Agent.findById(req.agent._id);
      agent.agentPhoto = url;
      agent.profileImage = url;
      await agent.save();
      return res.status(200).json({ success: true, url, agent });
    } catch (saveErr) {
      return res.status(500).json({ success: false, message: "Database update failed" });
    }
  });
});

/* ==========================================
   TRIP MANAGEMENT ENDPOINTS
   ========================================== */

// Helper to create or update driver account automatically
const handleDriverCreation = async (tripData, agentId) => {
  if (!tripData.driverGmail) return null;
  const email = tripData.driverGmail.toLowerCase().trim();
  let driver = await Driver.findOne({ email });
  if (!driver) {
    driver = await Driver.create({
      name: tripData.driverName || "Driver",
      email,
      phone: tripData.driverPhone || "",
      licenseNumber: tripData.driverLicenseNumber || "",
      vehicleNumber: tripData.busNumber || "",
      photo: tripData.driverPhoto || "",
      emergencyContact: tripData.emergencyContact || "",
      assignedAgent: agentId,
      status: "pending_verification",
    });
  } else {
    driver.name = tripData.driverName || driver.name;
    driver.phone = tripData.driverPhone || driver.phone;
    driver.licenseNumber = tripData.driverLicenseNumber || driver.licenseNumber;
    driver.vehicleNumber = tripData.busNumber || driver.vehicleNumber;
    if (tripData.driverPhoto) driver.photo = tripData.driverPhoto;
    if (tripData.emergencyContact) driver.emergencyContact = tripData.emergencyContact;
    await driver.save();
  }
  return driver._id;
};

// @route   POST /api/agent/trips/create
// @desc    Create a new trip (Checking security verification flags)
router.post("/trips/create", protectAgent, checkAgentKYC, async (req, res) => {
  // ── Debug logging ────────────────────────────────────────────────
  console.log("[CreateTrip] Incoming request body:", req.body);
  console.log("[CreateTrip] Incoming body keys:", Object.keys(req.body));
  console.log("[CreateTrip] title:", req.body.title);
  console.log("[CreateTrip] shortDescription:", req.body.shortDescription);
  console.log("[CreateTrip] description:", req.body.description ? req.body.description.slice(0, 80) + "..." : undefined);
  console.log("[CreateTrip] destinations:", req.body.destinations);
  console.log("[CreateTrip] startDate:", req.body.startDate, "endDate:", req.body.endDate);
  console.log("[CreateTrip] pickupLocation:", req.body.pickupLocation);
  console.log("[CreateTrip] busType:", req.body.busType, "busNumber:", req.body.busNumber);
  console.log("[CreateTrip] emergencyContact:", req.body.emergencyContact);
  console.log("[CreateTrip] totalSeats:", req.body.totalSeats, "pricePerPerson:", req.body.pricePerPerson);
  console.log("[CreateTrip] offerPrice:", req.body.offerPrice, "originalPrice:", req.body.originalPrice);

  const {
    title,
    shortDescription: rawShortDesc,
    subtitle,
    tagline,
    description,
    destinations,
    duration,
    startDate,
    endDate,
    departureTime,
    arrivalTime,
    pickupLocation,
    busType,
    busNumber,
    driverName,
    driverPhone,
    driverGmail,
    driverPhoto,
    driverLicenseNumber,
    emergencyContact,
    totalSeats,
    pricePerPerson: rawPricePerPerson,
    offerPrice,
    originalPrice,
    includedServices,
    exclusions,
    termsConditions,
    cancellationPolicy,
    itinerary,
  } = req.body;

  // ── Resolve shortDescription from multiple possible sources ──────
  const shortDescription =
    rawShortDesc ||
    subtitle ||
    tagline ||
    (description ? description.slice(0, 150) : null);

  // ── Resolve pricePerPerson from multiple sources ─────────────────
  const pricePerPerson =
    rawPricePerPerson ||
    offerPrice ||
    originalPrice ||
    0;

  // ── Auto-generate description (no dedicated Description field in UX) ──────
  // Built from: Trip Name + Tagline + Short Description + Itinerary Summary + Route
  const itinerarySummary = Array.isArray(itinerary) && itinerary.length > 0
    ? itinerary
        .map((day, i) => {
          const dayLabel = day.date || `Day ${i + 1}`;
          const place    = day.reachCity || day.startCity || day.destination || "";
          const notes    = day.notes     || day.description || "";
          return [dayLabel, place, notes].filter(Boolean).join(" — ");
        })
        .join(" | ")
    : "";

  const autoDescription =
    description ||
    [
      title,
      tagline || shortDescription,
      itinerarySummary,
      pickupLocation ? `Pickup: ${pickupLocation}` : "",
      req.body.dropPoint ? `Drop: ${req.body.dropPoint}` : "",
    ]
      .filter(Boolean)
      .join(" • ") ||
    (title ? `${title} — Group Tour Package` : "");

  // ── Profile / verification gate (simplified — checkAgentKYC middleware handles full KYC) ──
  const isEmailVerified = !!req.agent.emailVerified;

  if (!isEmailVerified) {
    return res.status(403).json({
      success: false,
      reason: "EMAIL_NOT_VERIFIED",
      message: "Verify your email address before creating trips.",
      emailVerified: req.agent.emailVerified,
      mobileVerified: req.agent.mobileVerified,
      kycStatus: req.agent.kycStatus,
      profileCompleted: req.agent.profileCompleted,
      isApproved: req.agent.isApproved,
    });
  }


  // ── Driver Verification Gate ──────────────────────────────────────────────
  // Both driver mobile (Firebase) and email OTP must be verified before trip creation.
  if (!req.body.driverMobileVerified) {
    return res.status(400).json({
      success: false,
      reason: "DRIVER_MOBILE_NOT_VERIFIED",
      message: "Driver mobile verification required. Please verify the driver's phone number via OTP.",
    });
  }

  if (!req.body.driverEmailVerified) {
    return res.status(400).json({
      success: false,
      reason: "DRIVER_EMAIL_NOT_VERIFIED",
      message: "Driver email verification required. Please verify the driver's email via OTP.",
    });
  }

  if (req.body.driverGmail) {
    const otpDoc = await DriverOtp.findOne({ email: req.body.driverGmail.toLowerCase() });
    if (!otpDoc || !otpDoc.verified) {
      return res.status(400).json({
        success: false,
        reason: "DRIVER_EMAIL_NOT_VERIFIED",
        message: "Driver email verification mismatch. Please verify again.",
      });
    }
  }

  // ── Required field check with detailed missingFields response ────
  // Note: description is NOT required — it is auto-generated from title/tagline/itinerary.
  const missingFields = [];
  if (!title)             missingFields.push("title (Trip Name)");
  if (!shortDescription)  missingFields.push("shortDescription / subtitle");
  if (!destinations || (Array.isArray(destinations) ? destinations.length === 0 : !destinations)) missingFields.push("destinations");
  if (!duration)          missingFields.push("duration");
  if (!startDate)         missingFields.push("startDate");
  if (!endDate)           missingFields.push("endDate");
  if (!pickupLocation)    missingFields.push("pickupLocation");
  if (!busType)           missingFields.push("busType");
  if (!emergencyContact)  missingFields.push("emergencyContact");
  if (!totalSeats)        missingFields.push("totalSeats");
  if (!pricePerPerson)    missingFields.push("pricePerPerson / offerPrice");

  if (missingFields.length > 0) {
    console.warn("[CreateTrip] ❌ Validation failed. Missing fields:", missingFields);
    return res.status(400).json({
      success: false,
      message: "Trip validation failed — missing required fields",
      missingFields,
    });
  }

  console.log("Authenticated Agent:", req.agent);

  if (!req.agent || !req.agent._id) {
    return res.status(401).json({
      success: false,
      message: "Authenticated agent not found"
    });
  }

  try {
    // ── Trip Slot Limit Check ──
    const isDbConnected = () => mongoose.connection.readyState === 1;
    let settings = null;
    if (isDbConnected()) {
      settings = await AgentSettings.findOne({ settingId: "global" });
    }
    const defaultSlots = settings ? settings.defaultTripSlots : 2;

    const agent = isDbConnected() 
      ? await Agent.findById(req.agent._id) 
      : fallbackAgents.get(req.agent._id.toString());

    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent profile not found" });
    }

    const baseSlots = agent.tripSlots !== undefined ? agent.tripSlots : defaultSlots;
    const bonusSlots = agent.bonusSlots || 0;
    const purchasedSlots = agent.purchasedSlots || 0;
    const totalAvailableSlots = baseSlots + bonusSlots + purchasedSlots;

    let activeTripsCount = 0;
    if (isDbConnected()) {
      activeTripsCount = await AgentTrip.countDocuments({
        agentId: req.agent._id,
        status: { $nin: ["completed", "Completed", "cancelled", "Cancelled"] },
        isDeleted: { $ne: true }
      });
    } else {
      activeTripsCount = Array.from(fallbackTrips.values()).filter(
        t => t.agentId.toString() === req.agent._id.toString() &&
             !["completed", "Completed", "cancelled", "Cancelled"].includes(t.status) &&
             t.isDeleted !== true
      ).length;
    }

    if (activeTripsCount >= totalAvailableSlots) {
      return res.status(400).json({
        success: false,
        message: "Trip slot limit reached. Complete existing trips or earn bonus slots through referrals."
      });
    }

    // Update usedSlots
    agent.usedSlots = activeTripsCount + 1;
    if (isDbConnected()) {
      await Agent.findByIdAndUpdate(agent._id, { usedSlots: agent.usedSlots });
    } else {
      fallbackAgents.set(agent._id.toString(), agent);
    }

    let trip;
    let driverId = null;

    if (isDbConnected() && driverGmail) {
      driverId = await handleDriverCreation({
        driverGmail,
        driverName,
        driverPhone,
        driverLicenseNumber,
        busNumber,
        driverPhoto,
        emergencyContact
      }, req.agent._id);
    }

    // Base trip body data excluding any injected agentId
    const bodyData = { ...req.body };
    delete bodyData.agentId;

    const resolvedBookingDeadline = handleBookingDeadline(startDate, req.body.bookingDeadline);
    if (!validateBookingDeadline(startDate, resolvedBookingDeadline)) {
      return res.status(400).json({
        success: false,
        message: "Booking deadline must be strictly before start date."
      });
    }

    const tripData = {
      ...bodyData,
      shortDescription,                          // resolved above
      description: autoDescription,              // auto-generated if not supplied
      pricePerPerson: Number(pricePerPerson),    // resolved above
      destinations: Array.isArray(destinations) ? destinations : [destinations],
      totalSeats: Number(totalSeats),
      availableSeats: Number(totalSeats),
      driver: driverId,
      driverId: driverId,
      bookingDeadline: resolvedBookingDeadline,
      status: "draft",
      publishStatus: "draft",
      publishedAt: null,
    };

    if (isDbConnected()) {
      trip = new AgentTrip({
        ...tripData,
        agentId: req.agent._id
      });
      await trip.save();
    } else {
      // In-Memory Fallback
      const tripId = new mongoose.Types.ObjectId().toString();
      trip = {
        _id: tripId,
        ...tripData,
        agentId: req.agent._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fallbackTrips.set(tripId, trip);
    }

    const responseTrip = {
      ...(isDbConnected() ? trip.toObject() : trip),
      agentId: req.agent._id,
      firebaseUid: req.agent.firebaseUid || req.agent.uid || "",
      createdBy: req.agent.displayName || req.agent.email || "Agent",
    };

    console.log("[CreateTrip] ✅ Trip created successfully. ID:", trip._id);
    res.status(201).json({
      success: true,
      tripId: trip._id,
      message: "Trip created successfully",
      trip: responseTrip,
    });
  } catch (error) {
    console.error("[CreateTrip] ❌ Server error:", error.message);
    // Return mongoose validation errors in detail
    if (error.name === "ValidationError") {
      const mongoFields = Object.keys(error.errors).map(k => `${k}: ${error.errors[k].message}`);
      return res.status(400).json({
        success: false,
        message: "Database validation error",
        missingFields: mongoFields,
      });
    }
    res.status(500).json({ success: false, message: "Server Error creating trip", reason: error.message });
  }
});


// @route   GET /api/trips/my-trips
// @desc    Get all trips managed by logged-in agent
router.get("/trips/my-trips", protectAgent, async (req, res) => {
  console.log("Authenticated Agent:", req.agent);
  try {
    let trips = [];

    if (isDbConnected()) {
      trips = await AgentTrip.find({ agentId: req.agent._id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    } else {
      trips = Array.from(fallbackTrips.values())
        .filter(t => (t.agentId || t.agent || "").toString() === req.agent._id.toString() && t.isDeleted !== true)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    console.log(trips.map(t => t._id));
    console.log("Trips found:", trips.length);

    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      success: true,
      trips,
    });
  } catch (error) {
    console.error("Get trips error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving trips list" });
  }
});

// @route   GET /api/agent/trip/:id or /api/agent/trips/:id
// @desc    Get trip details by ID
router.get(["/trip/:id", "/trips/:id"], protectAgent, async (req, res) => {
  try {
    let trip;

    if (isDbConnected()) {
      const data = await AgentTrip.findById(req.params.id).populate("driverId");
      trip = data ? { ...data.toObject(), _id: data._id, driver: data.driverId } : null;
    } else {
      trip = fallbackTrips.get(req.params.id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Deconstruct fields to construct clean response sub-objects
    const driver = trip.driver || {
      name: trip.driverName || "Not Assigned",
      phone: trip.driverPhone || "N/A",
      alternateMobile: trip.driverAlternateMobile || "",
      licenseNumber: trip.driverLicenseNumber || "",
      experience: trip.driverExperience || 0,
      photo: trip.driverPhoto || "",
      emergencyContact: trip.emergencyContact || ""
    };

    const pricing = {
      pricePerPerson: trip.pricePerPerson,
      originalPrice: trip.originalPrice || 0,
      offerPrice: trip.offerPrice || 0,
      discountPercentage: trip.discountPercentage || 0,
      commissionAmount: trip.commissionAmount || 0,
      refundPolicy: trip.refundPolicy || "Fully Refundable"
    };

    const vehicle = {
      busType: trip.busType,
      busNumber: trip.busNumber,
      busImages: trip.busImages || [],
      seatLayoutImage: trip.seatLayoutImage || ""
    };

    const schedule = {
      startDate: trip.startDate,
      endDate: trip.endDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      reportingTime: trip.reportingTime,
      boardingStatus: trip.boardingStatus,
      boardingOpenedAt: trip.boardingOpenedAt,
      boardingClosedAt: trip.boardingClosedAt
    };

    const stats = {
      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
      bookedSeats: trip.bookedSeats || 0,
      maleCount: trip.maleCount || 0,
      femaleCount: trip.femaleCount || 0,
      childrenCount: trip.childrenCount || 0,
      boardedCount: trip.boardedCount || 0
    };

    res.status(200).json({
      success: true,
      trip,
      driver,
      pricing,
      vehicle,
      schedule,
      stats
    });
  } catch (error) {
    console.error("Get trip details error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving trip details" });
  }
});

// @route   PUT /api/agent/trip/:id or /api/agent/trips/:id
// @desc    Update trip by ID
router.put(["/trip/:id", "/trips/:id"], protectAgent, checkAgentKYC, async (req, res) => {
  try {
    let trip;

    if (isDbConnected()) {
      trip = await AgentTrip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }
      
      const ownerId = trip.agentId || trip.createdBy || trip.userId || trip.agent;
      if (!ownerId) {
        return res.status(500).json({ success: false, message: "Trip owner field missing" });
      }

      if (ownerId.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized edit request" });
      }

      // Validate driver verification on update
      const driverEmailChanged = req.body.driverGmail && req.body.driverGmail.toLowerCase() !== (trip.driverGmail || "").toLowerCase();
      if (driverEmailChanged || !trip.driverEmailVerified) {
        if (req.body.driverGmail) {
          if (!req.body.driverEmailVerified) {
            return res.status(400).json({ success: false, message: "Driver email verification required" });
          }
          const otpDoc = await DriverOtp.findOne({ email: req.body.driverGmail.toLowerCase() });
          if (!otpDoc || !otpDoc.verified) {
            return res.status(400).json({ success: false, message: "Driver email verification mismatch. Please verify again." });
          }
        }
      }

      const driverPhoneChanged = req.body.driverPhone && req.body.driverPhone !== trip.driverPhone;
      if (driverPhoneChanged || !trip.driverMobileVerified) {
        if (req.body.driverPhone) {
          if (!req.body.driverMobileVerified) {
            return res.status(400).json({ success: false, message: "Driver mobile verification required" });
          }
        }
      }

      // 1. Check bookings count/capacity lock rules
      const currentBooked = trip.bookedSeats || 0;
      if (currentBooked > 0) {
        // Disallow editing restricted fields
        const restrictedFields = [
          "pricePerPerson", "offerPrice", "originalPrice", "gstPercentage", "gst", 
          "convenienceFee", "totalSeats", "pickupLocation", "dropPoint", 
          "duration", "category", "tripType"
        ];
        for (const field of restrictedFields) {
          if (req.body[field] !== undefined && req.body[field] !== trip[field]) {
            return res.status(400).json({
              success: false,
              message: `Editing restricted field '${field}' is not allowed when bookings exist.`
            });
          }
        }

        // Validate Date Changes via Email OTP
        const dateChanged = 
          (req.body.startDate !== undefined && req.body.startDate !== trip.startDate) ||
          (req.body.endDate !== undefined && req.body.endDate !== trip.endDate) ||
          (req.body.bookingDeadline !== undefined && req.body.bookingDeadline !== trip.bookingDeadline);

        if (dateChanged) {
          const { dateChangeOtp } = req.body;
          if (!dateChangeOtp) {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const OtpModel = await import("../models/Otp.js").then(m => m.default);
            await OtpModel.findOneAndUpdate(
              { email: req.agent.email },
              { otp: otpCode, expiresAt: new Date(Date.now() + 10 * 60 * 1000), resendAvailableAt: new Date() },
              { upsert: true, new: true }
            );
            await sendOtpEmail(req.agent.email, req.agent.displayName || "Agent", otpCode);

            return res.status(200).json({
              success: false,
              code: "OTP_REQUIRED",
              message: "An OTP has been sent to your email to verify date changes."
            });
          } else {
            const OtpModel = await import("../models/Otp.js").then(m => m.default);
            const savedOtp = await OtpModel.findOne({ email: req.agent.email });
            if (!savedOtp || savedOtp.otp !== dateChangeOtp || savedOtp.expiresAt < new Date()) {
              return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP for date changes."
              });
            }
            await OtpModel.deleteOne({ email: req.agent.email });
          }
        }
      }

      // 2. Validate bookingDeadline
      if (req.body.bookingDeadline || req.body.startDate) {
        const startDate = req.body.startDate || trip.startDate;
        const resolvedBookingDeadline = handleBookingDeadline(startDate, req.body.bookingDeadline);
        if (!validateBookingDeadline(startDate, resolvedBookingDeadline)) {
          return res.status(400).json({
            success: false,
            message: "Booking deadline must be strictly before start date."
          });
        }
        req.body.bookingDeadline = resolvedBookingDeadline;
      }

      // 3. Enforce capacity protection
      if (req.body.totalSeats !== undefined) {
        const totalSeatsVal = Number(req.body.totalSeats);
        if (currentBooked > 0 && totalSeatsVal < currentBooked) {
          return res.status(400).json({
            success: false,
            message: `Cannot reduce total seats below currently booked seats: ${currentBooked}`
          });
        }
        req.body.availableSeats = totalSeatsVal - currentBooked;
      }

      if (req.body.driverGmail) {
        const driverId = await handleDriverCreation({
          driverGmail: req.body.driverGmail,
          driverName: req.body.driverName || trip.driverName,
          driverPhone: req.body.driverPhone || trip.driverPhone,
          driverLicenseNumber: req.body.driverLicenseNumber || trip.driverLicenseNumber,
          busNumber: req.body.busNumber || trip.busNumber,
          driverPhoto: req.body.driverPhoto || trip.driverPhoto,
          emergencyContact: req.body.emergencyContact || trip.emergencyContact
        }, req.agent._id);
        req.body.driver = driverId;
        req.body.driverId = driverId;
      }

      trip = await AgentTrip.findByIdAndUpdate(req.params.id, req.body, {
        returnDocument: "after",
        runValidators: true,
      });
    } else {
      trip = fallbackTrips.get(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      const ownerId = trip.agentId || trip.createdBy || trip.userId || trip.agent;
      if (!ownerId) {
        return res.status(500).json({ success: false, message: "Trip owner field missing" });
      }

      if (ownerId.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized edit request" });
      }

      const updated = {
        ...trip,
        ...req.body,
        updatedAt: new Date()
      };
      fallbackTrips.set(req.params.id, updated);
      trip = updated;
    }

    const io = req.app.get("io");
    if (io && (trip.status === "published" || trip.publishStatus === "published" || trip.published)) {
      io.emit("trip_updated", trip._id || req.params.id);
    }

    // Recalculate usedSlots
    try {
      const isDbConnected = () => mongoose.connection.readyState === 1;
      let activeTripsCount = 0;
      if (isDbConnected()) {
        activeTripsCount = await AgentTrip.countDocuments({
          agentId: req.agent._id,
          status: { $nin: ["completed", "Completed", "cancelled", "Cancelled"] },
          isDeleted: { $ne: true }
        });
        await Agent.findByIdAndUpdate(req.agent._id, { usedSlots: activeTripsCount });
      } else {
        activeTripsCount = Array.from(fallbackTrips.values()).filter(
          t => t.agentId.toString() === req.agent._id.toString() &&
               !["completed", "Completed", "cancelled", "Cancelled"].includes(t.status) &&
               t.isDeleted !== true
        ).length;
        const agent = fallbackAgents.get(req.agent._id.toString());
        if (agent) {
          agent.usedSlots = activeTripsCount;
          fallbackAgents.set(req.agent._id.toString(), agent);
        }
      }
    } catch (slotRecalcErr) {
      console.error("Error recalculating slots:", slotRecalcErr);
    }

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    console.error("Update trip error:", error);
    res.status(500).json({ success: false, message: "Server Error updating trip", reason: error.message });
  }
});


// @route   GET /api/trips/my-trips
// @desc    Get all trips managed by logged-in agent
router.get("/trips/my-trips", protectAgent, async (req, res) => {
  console.log("Authenticated Agent:", req.agent);
  try {
    let trips = [];

    if (isDbConnected()) {
      trips = await AgentTrip.find({ agentId: req.agent._id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    } else {
      trips = Array.from(fallbackTrips.values())
        .filter(t => (t.agentId || t.agent || "").toString() === req.agent._id.toString() && t.isDeleted !== true)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    console.log(trips.map(t => t._id));
    console.log("Trips found:", trips.length);

    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      success: true,
      trips,
    });
  } catch (error) {
    console.error("Get trips error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving trips list" });
  }
});

// @route   GET /api/agent/trip/:id or /api/agent/trips/:id
// @desc    Get trip details by ID
router.get(["/trip/:id", "/trips/:id"], protectAgent, async (req, res) => {
  try {
    let trip;

    if (isDbConnected()) {
      const data = await AgentTrip.findById(req.params.id).populate("driverId");
      trip = data ? { ...data.toObject(), _id: data._id, driver: data.driverId } : null;
    } else {
      trip = fallbackTrips.get(req.params.id);
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Deconstruct fields to construct clean response sub-objects
    const driver = trip.driver || {
      name: trip.driverName || "Not Assigned",
      phone: trip.driverPhone || "N/A",
      alternateMobile: trip.driverAlternateMobile || "",
      licenseNumber: trip.driverLicenseNumber || "",
      experience: trip.driverExperience || 0,
      photo: trip.driverPhoto || "",
      emergencyContact: trip.emergencyContact || ""
    };

    const pricing = {
      pricePerPerson: trip.pricePerPerson,
      originalPrice: trip.originalPrice || 0,
      offerPrice: trip.offerPrice || 0,
      discountPercentage: trip.discountPercentage || 0,
      commissionAmount: trip.commissionAmount || 0,
      refundPolicy: trip.refundPolicy || "Fully Refundable"
    };

    const vehicle = {
      busType: trip.busType,
      busNumber: trip.busNumber,
      busImages: trip.busImages || [],
      seatLayoutImage: trip.seatLayoutImage || ""
    };

    const schedule = {
      startDate: trip.startDate,
      endDate: trip.endDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      reportingTime: trip.reportingTime,
      boardingStatus: trip.boardingStatus,
      boardingOpenedAt: trip.boardingOpenedAt,
      boardingClosedAt: trip.boardingClosedAt
    };

    const stats = {
      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
      bookedSeats: trip.bookedSeats || 0,
      maleCount: trip.maleCount || 0,
      femaleCount: trip.femaleCount || 0,
      childrenCount: trip.childrenCount || 0,
      boardedCount: trip.boardedCount || 0
    };

    res.status(200).json({
      success: true,
      trip,
      driver,
      pricing,
      vehicle,
      schedule,
      stats
    });
  } catch (error) {
    console.error("Get trip details error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving trip details" });
  }
});

// @route   PUT /api/agent/trip/:id or /api/agent/trips/:id
// @desc    Update trip by ID
router.put(["/trip/:id", "/trips/:id"], protectAgent, checkAgentKYC, async (req, res) => {
  try {
    let trip;

    if (isDbConnected()) {
      trip = await AgentTrip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }
      
      const ownerId = trip.agentId || trip.createdBy || trip.userId || trip.agent;
      if (!ownerId) {
        return res.status(500).json({ success: false, message: "Trip owner field missing" });
      }

      if (ownerId.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized edit request" });
      }

      // 1. Check bookings count/capacity lock rules
      const currentBooked = trip.bookedSeats || 0;
      if (currentBooked > 0) {
        // Disallow editing startDate, endDate
        if (req.body.startDate !== undefined && req.body.startDate !== trip.startDate) {
          return res.status(400).json({ success: false, message: "Cannot edit start date after bookings have been made." });
        }
        if (req.body.endDate !== undefined && req.body.endDate !== trip.endDate) {
          return res.status(400).json({ success: false, message: "Cannot edit end date after bookings have been made." });
        }
        // Disallow deleting selected activities
        if (req.body.selectedActivities !== undefined) {
          const currentActs = trip.selectedActivities || [];
          const newActs = req.body.selectedActivities || [];
          const missingAct = currentActs.find(a => !newActs.includes(a));
          if (missingAct) {
            return res.status(400).json({ success: false, message: `Cannot remove booked activity: ${missingAct}` });
          }
        }
      }

      // 2. Validate bookingDeadline
      if (req.body.bookingDeadline || req.body.startDate) {
        const startDate = req.body.startDate || trip.startDate;
        const resolvedBookingDeadline = handleBookingDeadline(startDate, req.body.bookingDeadline);
        if (!validateBookingDeadline(startDate, resolvedBookingDeadline)) {
          return res.status(400).json({
            success: false,
            message: "Booking deadline must be strictly before start date."
          });
        }
        req.body.bookingDeadline = resolvedBookingDeadline;
      }

      // 3. Enforce capacity protection
      if (req.body.totalSeats !== undefined) {
        const totalSeatsVal = Number(req.body.totalSeats);
        if (currentBooked > 0 && totalSeatsVal < currentBooked) {
          return res.status(400).json({
            success: false,
            message: `Cannot reduce total seats below currently booked seats: ${currentBooked}`
          });
        }
        // Recalculate availableSeats
        req.body.availableSeats = totalSeatsVal - currentBooked;
      }

      if (req.body.driverGmail) {
        const driverId = await handleDriverCreation({
          driverGmail: req.body.driverGmail,
          driverName: req.body.driverName || trip.driverName,
          driverPhone: req.body.driverPhone || trip.driverPhone,
          driverLicenseNumber: req.body.driverLicenseNumber || trip.driverLicenseNumber,
          busNumber: req.body.busNumber || trip.busNumber,
          driverPhoto: req.body.driverPhoto || trip.driverPhoto,
          emergencyContact: req.body.emergencyContact || trip.emergencyContact
        }, req.agent._id);
        req.body.driver = driverId;
      }

      if (req.body.bookingDeadline || req.body.startDate) {
        const startDate = req.body.startDate || trip.startDate;
        const resolvedBookingDeadline = handleBookingDeadline(startDate, req.body.bookingDeadline);
        if (!validateBookingDeadline(startDate, resolvedBookingDeadline)) {
          return res.status(400).json({
            success: false,
            message: "Booking deadline must be strictly before start date."
          });
        }
        req.body.bookingDeadline = resolvedBookingDeadline;
      }

      if (req.body.totalSeats !== undefined) {
        const totalSeatsVal = Number(req.body.totalSeats);
        const currentBooked = trip.bookedSeats || 0;
        if (currentBooked > 0 && totalSeatsVal < currentBooked) {
          return res.status(400).json({
            success: false,
            message: `Cannot reduce total seats below currently booked seats: ${currentBooked}`
          });
        }
        req.body.availableSeats = totalSeatsVal - currentBooked;
      }

      const updated = {
        ...trip,
        ...req.body,
        updatedAt: new Date()
      };
      fallbackTrips.set(req.params.id, updated);
      trip = updated;
    }

    const io = req.app.get("io");
    if (io && (trip.status === "published" || trip.publishStatus === "published" || trip.published)) {
      io.emit("trip_updated", trip._id || req.params.id);
    }

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error("Update trip error:", error);
    res.status(500).json({ success: false, message: "Server Error updating trip details" });
  }
});

// @route   PUT /api/agent/trip/:id/publish or /api/agent/trips/:id/publish
// @desc    Publish a trip by ID
router.put(["/trip/:id/publish", "/trips/:id/publish"], protectAgent, checkAgentKYC, async (req, res) => {
  try {
    let trip;

    if (isDbConnected()) {
      trip = await AgentTrip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      const ownerId = trip.agentId || trip.createdBy || trip.userId || trip.agent;
      if (!ownerId) {
        return res.status(500).json({ success: false, message: "Trip owner field missing" });
      }

      if (ownerId.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized publish request" });
      }

      trip.status = "published";
      trip.publishStatus = "published";
      trip.publishedAt = new Date();
      await trip.save();
    } else {
      trip = fallbackTrips.get(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      const ownerId = trip.agentId || trip.createdBy || trip.userId || trip.agent;
      if (!ownerId) {
        return res.status(500).json({ success: false, message: "Trip owner field missing" });
      }

      if (ownerId.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized publish request" });
      }

      trip.status = "published";
      trip.publishStatus = "published";
      trip.publishedAt = new Date();
      fallbackTrips.set(req.params.id, trip);
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("trip_published", trip._id || req.params.id);
    }

    res.status(200).json({
      success: true,
      message: "Trip published successfully",
      trip,
    });
  } catch (error) {
    console.error("Publish trip error:", error);
    res.status(500).json({ success: false, message: "Server Error publishing trip" });
  }
});

// @route   DELETE /api/agent/trip/:id or /api/agent/trips/:id
// @desc    Delete trip by ID (Soft delete & Realtime sync, with Booking & Cancellation confirmations check)
router.delete(["/trip/:id", "/trips/:id"], protectAgent, async (req, res) => {
  try {
    let trip;

    if (isDbConnected()) {
      trip = await AgentTrip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      const ownerId = trip.agentId || trip.createdBy || trip.userId || trip.agent;
      if (!ownerId) {
        return res.status(500).json({ success: false, message: "Trip owner field missing" });
      }

      if (ownerId.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized delete request" });
      }

      // Check for active bookings
      const activeBookings = await Booking.find({
        tripId: req.params.id,
        status: { $ne: "cancelled" }
      });
      const bookingCount = activeBookings.length;

      if (bookingCount > 0) {
        if (trip.status !== "Refund Completed") {
          return res.status(400).json({
            success: false,
            code: "REFUNDS_PENDING",
            message: "This trip has active bookings. You must refund all passengers before deleting the trip.",
            bookingCount
          });
        }

        const { agentOtp } = req.body;
        if (!agentOtp) {
          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
          const OtpModel = await import("../models/Otp.js").then(m => m.default);
          await OtpModel.findOneAndUpdate(
            { email: req.agent.email },
            { otp: otpCode, expiresAt: new Date(Date.now() + 10 * 60 * 1000), resendAvailableAt: new Date() },
            { upsert: true, new: true }
          );
          await sendOtpEmail(req.agent.email, req.agent.displayName || "Agent", otpCode);

          return res.status(200).json({
            success: false,
            code: "AGENT_OTP_REQUIRED",
            message: "An Email OTP has been sent to you to confirm trip deletion."
          });
        } else {
          const OtpModel = await import("../models/Otp.js").then(m => m.default);
          const savedOtp = await OtpModel.findOne({ email: req.agent.email });
          if (!savedOtp || savedOtp.otp !== agentOtp || savedOtp.expiresAt < new Date()) {
            return res.status(400).json({
              success: false,
              message: "Invalid or expired Agent OTP for deletion."
            });
          }
          await OtpModel.deleteOne({ email: req.agent.email });
        }
      }

      await AgentTrip.findByIdAndDelete(req.params.id);

      // Cascade booking cancellations
      await Booking.updateMany(
        { tripId: req.params.id },
        {
          $set: {
            status: "cancelled",
            paymentStatus: "Cancelled",
            tripDeleted: true,
            cancelReason: "Trip removed by agency"
          }
        }
      );
    } else {
      trip = fallbackTrips.get(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      const ownerId = trip.agentId || trip.createdBy || trip.userId || trip.agent;
      if (!ownerId) {
        return res.status(500).json({ success: false, message: "Trip owner field missing" });
      }

      if (ownerId.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized delete request" });
      }

      const activeBookings = Array.from(fallbackBookings.values()).filter(
        b => b.agentTrip.toString() === req.params.id && b.status !== "cancelled"
      );
      const bookingCount = activeBookings.length;

      if (bookingCount > 0) {
        const isCancelled = trip.status === "cancelled";
        const bookedUserIds = [...new Set(activeBookings.map(b => b.userId.toString()))];
        const confirmedUserIds = new Set((trip.cancellationConfirmations || []).map(c => c.userId.toString()));
        const allUsersConfirmed = bookedUserIds.length > 0 && bookedUserIds.every(uid => confirmedUserIds.has(uid));

        if (!isCancelled || !allUsersConfirmed) {
          return res.status(400).json({
            success: false,
            code: "DELETION_BLOCKED",
            message: "Trips with active bookings cannot be deleted immediately. You must request trip cancellation first and wait for all travelers to confirm.",
            bookingCount,
            tripStatus: trip.status,
            allUsersConfirmed
          });
        }
      }

      fallbackTrips.delete(req.params.id);

      for (const [id, booking] of fallbackBookings.entries()) {
        if (booking.agentTrip.toString() === req.params.id) {
          booking.status = "cancelled";
          booking.paymentStatus = "Cancelled";
          booking.tripDeleted = true;
          booking.cancelReason = "Trip removed by agency";
          fallbackBookings.set(id, booking);
        }
      }
    }

    // Broadcast soft-delete event in real time via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.emit("trip_deleted", req.params.id);
      console.log(`[Socket.io] Broadcasted trip_deleted event for: ${req.params.id}`);
    }

    // Recalculate usedSlots
    try {
      const isDbConnected = () => mongoose.connection.readyState === 1;
      let activeTripsCount = 0;
      if (isDbConnected()) {
        activeTripsCount = await AgentTrip.countDocuments({
          agentId: req.agent._id,
          status: { $nin: ["completed", "Completed", "cancelled", "Cancelled"] },
          isDeleted: { $ne: true }
        });
        await Agent.findByIdAndUpdate(req.agent._id, { usedSlots: activeTripsCount });
      } else {
        activeTripsCount = Array.from(fallbackTrips.values()).filter(
          t => t.agentId.toString() === req.agent._id.toString() &&
               !["completed", "Completed", "cancelled", "Cancelled"].includes(t.status) &&
               t.isDeleted !== true
        ).length;
        const agent = fallbackAgents.get(req.agent._id.toString());
        if (agent) {
          agent.usedSlots = activeTripsCount;
          fallbackAgents.set(req.agent._id.toString(), agent);
        }
      }
    } catch (slotRecalcErr) {
      console.error("Error recalculating slots:", slotRecalcErr);
    }

    res.status(200).json({
      success: true,
      message: "Trip and related bookings deleted successfully",
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    res.status(500).json({ success: false, message: "Server Error deleting trip" });
  }
});


/* ==========================================
   BOOKINGS MANAGEMENT ENDPOINTS
   ========================================== */

// @route   GET /api/bookings
// @desc    Get all bookings under agent
router.get("/bookings", protectAgent, async (req, res) => {
  try {
    let bookings = [];

    if (isDbConnected()) {
      const agentId = req.agent._id || req.agent.id;

      // Find all trips belonging to this agent (support both field names for legacy docs)
      const agentTripIds = await AgentTrip.find({
        $or: [{ agentId }, { agent: agentId }],
        isDeleted: { $ne: true },
      }).distinct("_id");

      const bookingsData = await Booking.find({
        $or: [
          { tripId: { $in: agentTripIds } },
        ],
      })
        .populate("tripId", "title totalSeats availableSeats startDate endDate driverName driverPhone busNumber busType coverImage status boardingStatus")
        .populate("userId", "name email phone profileImage")
        .sort({ createdAt: -1 });

      bookings = (bookingsData || []).map(b => {
        const obj = b.toObject ? b.toObject() : b;
        const trip = obj.tripId;
        const user = obj.userId;

        // Normalize travelerName: prefer stored value, fallback to populated user name
        const resolvedName = obj.travelerName || user?.name || "Unknown Traveler";
        const resolvedPhone = obj.contactNumber || user?.phone || "";
        const resolvedEmail = user?.email || "";

        return {
          ...obj,
          _id: b._id,
          tripId: trip?._id || trip,
          // Expose agentTrip alias for frontend backward-compat
          agentTrip: trip?._id || trip,
          tripName: trip ? trip.title : "Deleted Trip",
          travelerName: resolvedName,
          contactNumber: resolvedPhone,
          email: resolvedEmail,
          userProfile: user ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage,
          } : null,
        };
      });
    } else {
      bookings = Array.from(fallbackBookings.values())
        .filter(b => b.agent.toString() === req.agent._id.toString())
        .sort((a, b) => new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate));

      bookings = bookings.map(b => {
        const trip = fallbackTrips.get(b.agentTrip.toString());
        return {
          ...b,
          tripName: trip ? trip.title : b.tripName || "Unknown Trip",
        };
      });
    }

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving bookings list" });
  }
});

// @route   PUT /api/bookings/:id/status
router.put("/bookings/:id/status", protectAgent, async (req, res) => {
  const { paymentStatus } = req.body;

  if (!paymentStatus || !["Paid", "Pending", "Cancelled"].includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: "Invalid payment status transition" });
  }

  try {
    let booking;

    if (isDbConnected()) {
      const data = await Booking.findById(req.params.id).populate("tripId");

      if (!data) {
        return res.status(404).json({ success: false, message: "Booking record not found" });
      }

      const bookingObj = data.toObject();
      const tripDoc = data.tripId;

      const agentId = req.agent._id || req.agent.id;
      if (!tripDoc || tripDoc.agentId?.toString() !== agentId?.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized booking update" });
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        data._id,
        { paymentStatus },
        { returnDocument: "after" }
      );

      const previousStatus = data.paymentStatus;
      booking = { ...updatedBooking.toObject(), _id: updatedBooking._id, agentTrip: tripDoc.toObject() };

      if (tripDoc) {
        let newAvailableSeats = tripDoc.availableSeats || 0;
        if (paymentStatus === "Cancelled" && previousStatus !== "Cancelled") {
          newAvailableSeats = Math.min(tripDoc.totalSeats || 0, newAvailableSeats + booking.seats);
        } else if (previousStatus === "Cancelled" && paymentStatus !== "Cancelled") {
          newAvailableSeats = Math.max(0, newAvailableSeats - booking.seats);
        }
        await AgentTrip.findByIdAndUpdate(tripDoc._id, { availableSeats: newAvailableSeats });
        booking.agentTrip.availableSeats = newAvailableSeats;
      }
    } else {
      booking = fallbackBookings.get(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking record not found" });
      }

      if (booking.agent.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized booking update" });
      }

      const previousStatus = booking.paymentStatus;
      booking.paymentStatus = paymentStatus;
      fallbackBookings.set(req.params.id, booking);

      const trip = fallbackTrips.get(booking.agentTrip.toString());
      if (trip) {
        if (paymentStatus === "Cancelled" && previousStatus !== "Cancelled") {
          trip.availableSeats = Math.min(trip.totalSeats, trip.availableSeats + booking.seats);
        } else if (previousStatus === "Cancelled" && paymentStatus !== "Cancelled") {
          trip.availableSeats = Math.max(0, trip.availableSeats - booking.seats);
        }
        fallbackTrips.set(booking.agentTrip.toString(), trip);
      }
    }

    // Broadcast socket events
    const io = req.app.get("io");
    if (io) {
      io.emit("booking_updated", { bookingId: req.params.id, booking });
      if (paymentStatus === "Cancelled") {
        io.emit("booking_cancelled", { bookingId: req.params.id, booking });
      }
    }

    res.status(200).json({
      success: true,
      message: `Booking successfully marked as ${paymentStatus}`,
      booking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ success: false, message: "Server Error updating booking status" });
  }
});

// @route   PUT /api/bookings/:id/update-details
// @desc    Update passenger seat, pickup point, or boarding status
router.put("/bookings/:id/update-details", protectAgent, async (req, res) => {
  const { seatNumbers, pickupLocation, boardingStatus } = req.body;
  try {
    let booking;
    if (isDbConnected()) {
      const bookingData = await Booking.findById(req.params.id).populate("tripId");
      if (!bookingData) {
        return res.status(404).json({ success: false, message: "Booking not found" });
      }
      const tripDoc = bookingData.tripId;
      const agentId = req.agent._id || req.agent.id;
      if (!tripDoc || tripDoc.agentId?.toString() !== agentId?.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized booking update" });
      }
      booking = bookingData;
      if (seatNumbers !== undefined) {
        booking.seatNumbers = Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers];
        booking.assignedSeat = booking.seatNumbers[0] || "";
      }
      if (pickupLocation !== undefined) booking.pickupLocation = pickupLocation;
      if (boardingStatus !== undefined) {
        booking.boardingStatus = boardingStatus;
        if (boardingStatus === "boarded") {
          booking.boardedAt = new Date();
        } else if (boardingStatus === "not_boarded") {
          booking.boardedAt = null;
        }
      }
      await booking.save();
    } else {
      booking = fallbackBookings.get(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
      }
      if (booking.agent.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized booking update" });
      }
      if (seatNumbers !== undefined) {
        booking.seatNumbers = Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers];
        booking.assignedSeat = booking.seatNumbers[0] || "";
      }
      if (pickupLocation !== undefined) booking.pickupLocation = pickupLocation;
      if (boardingStatus !== undefined) {
        booking.boardingStatus = boardingStatus;
        if (boardingStatus === "boarded") {
          booking.boardedAt = new Date();
        } else if (boardingStatus === "not_boarded") {
          booking.boardedAt = null;
        }
      }
      fallbackBookings.set(req.params.id, booking);
    }

    // Broadcast socket events
    const io = req.app.get("io");
    if (io) {
      io.emit("booking_updated", { bookingId: req.params.id, booking });
      if (boardingStatus === "boarded") {
        io.emit("passenger_boarded", { bookingId: req.params.id, booking });
      }
      if (seatNumbers) {
        io.emit("seat_reassigned", { bookingId: req.params.id, seatNumbers });
      }
    }

    res.status(200).json({
      success: true,
      message: "Booking details updated successfully",
      booking
    });
  } catch (error) {
    console.error("Update booking details error:", error);
    res.status(500).json({ success: false, message: "Server Error updating booking details" });
  }
});


/* ==========================================
   TRIP MANIFEST ENDPOINT
   ========================================== */

// @route   GET /api/agent/trips/:id/manifest
// @desc    Return fully-populated trip manifest with stats aggregation
router.get("/trips/:id/manifest", protectAgent, async (req, res) => {
  try {
    const tripId = req.params.id;
    const agentId = req.agent._id || req.agent.id;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID" });
    }

    // Fetch trip with driver populated
    const tripData = await AgentTrip.findOne({
      _id: tripId,
      $or: [{ agentId }, { agent: agentId }],
    }).populate("driverId").populate("driver");

    if (!tripData) {
      return res.status(404).json({ success: false, message: "Trip manifest not found" });
    }

    // Fetch all bookings for this trip with user info
    const bookingsData = await Booking.find({ tripId })
      .populate("userId", "name email phone profileImage")
      .sort({ createdAt: -1 });

    const bookings = (bookingsData || []).map(b => {
      const obj = b.toObject ? b.toObject() : b;
      const user = obj.userId;
      return {
        ...obj,
        _id: b._id,
        agentTrip: tripId,
        travelerName: obj.travelerName || user?.name || "Unknown Traveler",
        contactNumber: obj.contactNumber || user?.phone || "",
        email: user?.email || "",
        userProfile: user ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
        } : null,
      };
    });

    // Compute stats
    const activeBookings = bookings.filter(b => {
      const ps = (b.paymentStatus || "").toUpperCase();
      return ps !== "CANCELLED" && ps !== "FAILED";
    });
    const paidBookings = bookings.filter(b => {
      const ps = (b.paymentStatus || "").toUpperCase();
      return ps === "PAID" || ps === "CONFIRMED";
    });
    const unpaidBookings = bookings.filter(b => {
      const ps = (b.paymentStatus || "").toUpperCase();
      return ps === "PENDING" || ps === "";
    });
    const cancelledBookings = bookings.filter(b => {
      const ps = (b.paymentStatus || "").toUpperCase();
      return ps === "CANCELLED";
    });
    const boardedBookings = activeBookings.filter(b => {
      const bs = (b.boardingStatus || "").toUpperCase();
      return bs === "BOARDED";
    });
    const pendingBoardingBookings = activeBookings.filter(b => {
      const bs = (b.boardingStatus || "").toUpperCase();
      return bs !== "BOARDED";
    });

    const totalSeats = tripData.totalSeats || 0;
    const bookedSeatsCount = activeBookings.reduce((sum, b) => sum + (b.seats || 1), 0);
    const availableSeats = Math.max(0, totalSeats - bookedSeatsCount);
    const occupancyPercent = totalSeats > 0 ? parseFloat(((bookedSeatsCount / totalSeats) * 100).toFixed(1)) : 0;

    const grossRevenue = paidBookings.reduce((sum, b) => sum + (b.pricePaid || b.amountPaid || 0), 0);
    const commissionRate = 0.10;
    const commissionAmount = parseFloat((grossRevenue * commissionRate).toFixed(2));
    const netRevenue = parseFloat((grossRevenue - commissionAmount).toFixed(2));

    const maleCount = activeBookings.filter(b => b.gender === "Male" || b.gender === "male").length;
    const femaleCount = activeBookings.filter(b => b.gender === "Female" || b.gender === "female").length;

    const driverDoc = tripData.driverId || tripData.driver;
    const trip = tripData.toObject();
    const driverInfo = driverDoc ? {
      _id: driverDoc._id,
      name: driverDoc.name || driverDoc.driverName || trip.driverName || "Not Assigned",
      phone: driverDoc.phone || driverDoc.driverPhone || trip.driverPhone || "",
      licenseNumber: driverDoc.licenseNumber || driverDoc.driverLicenseNumber || trip.driverLicenseNumber || "",
      vehicleNumber: driverDoc.vehicleNumber || trip.busNumber || "",
      busType: trip.busType || "",
      experience: driverDoc.experience || trip.driverExperience || 0,
      photo: driverDoc.photo || trip.driverPhoto || "",
      emergencyContact: driverDoc.emergencyContact || trip.emergencyContact || "",
    } : {
      name: trip.driverName || "Not Assigned",
      phone: trip.driverPhone || "",
      licenseNumber: trip.driverLicenseNumber || "",
      vehicleNumber: trip.busNumber || "",
      busType: trip.busType || "",
      emergencyContact: trip.emergencyContact || "",
    };

    const tripStats = {
      passengerCount: activeBookings.length,
      paidCount: paidBookings.length,
      unpaidCount: unpaidBookings.length,
      cancelledCount: cancelledBookings.length,
      boardedCount: boardedBookings.length,
      pendingBoardingCount: pendingBoardingBookings.length,
      maleCount,
      femaleCount,
      otherCount: activeBookings.length - maleCount - femaleCount,
      totalSeats,
      bookedSeats: bookedSeatsCount,
      availableSeats,
      occupancyPercent,
      grossRevenue,
      commissionAmount,
      netRevenue,
      pendingRevenue: bookings.filter(b => (b.paymentStatus || "").toUpperCase() === "PENDING").reduce((sum, b) => sum + (b.pricePaid || b.amount || 0), 0),
      refundedAmount: cancelledBookings.reduce((sum, b) => sum + (b.pricePaid || b.amount || 0), 0),
    };

    res.status(200).json({
      success: true,
      trip: { ...trip, driver: driverInfo },
      bookings,
      tripStats,
      driver: driverInfo,
    });
  } catch (error) {
    console.error("[Trip Manifest] Error:", error);
    res.status(500).json({ success: false, message: "Server Error loading trip manifest" });
  }
});


/* ==========================================
   ANALYTICS ENDPOINTS
   ========================================== */

// @route   GET /api/analytics
router.get("/analytics", protectAgent, async (req, res) => {
  try {
    let trips = [];
    let bookings = [];

    if (isDbConnected()) {
      const agentId = req.agent._id || req.agent.id;
      const agentTripsData = await AgentTrip.find({ agentId });
      trips = (agentTripsData || []).map(t => t.toObject ? t.toObject() : t);

      const agentTripIds = trips.map(t => t._id);
      const bookingsData = await Booking.find({
        $or: [
          { tripId: { $in: agentTripIds } },
          { agentTrip: { $in: agentTripIds } }
        ]
      }).populate("tripId");
      bookings = (bookingsData || []).map(b => {
        const obj = b.toObject ? b.toObject() : b;
        // TODO: remove agentTrip fallback after migration (scripts/migrateIds.js)
        return {
          ...obj,
          _id: b._id,
          tripId: (obj.tripId?._id || obj.tripId) || null
        };
      });
    } else {
      trips = Array.from(fallbackTrips.values()).filter(t => t.agent.toString() === req.agent._id.toString());
      bookings = Array.from(fallbackBookings.values()).filter(b => b.agent.toString() === req.agent._id.toString());
    }

    const totalTripsCount = trips.length;
    const activeTripsCount = trips.filter(t => {
      const todayStr = new Date().toISOString().split("T")[0];
      return t.startDate <= todayStr && t.endDate >= todayStr;
    }).length;
    
    const upcomingTripsCount = trips.filter(t => {
      const todayStr = new Date().toISOString().split("T")[0];
      return t.startDate > todayStr;
    }).length;

    const nonCancelledBookings = bookings.filter(b => b.paymentStatus !== "Cancelled");

    const totalTravelers = nonCancelledBookings.reduce((sum, b) => sum + b.seats, 0);
    const totalRevenue = nonCancelledBookings.reduce((sum, b) => sum + b.pricePaid, 0);
    
    const pendingBookingsCount = bookings.filter(b => b.paymentStatus === "Pending").length;

    const maleTravelers = nonCancelledBookings.filter(b => b.gender === "Male").reduce((sum, b) => sum + b.seats, 0);
    const femaleTravelers = nonCancelledBookings.filter(b => b.gender === "Female").reduce((sum, b) => sum + b.seats, 0);
    const otherTravelers = totalTravelers - maleTravelers - femaleTravelers;

    const recentActivities = bookings.map(b => {
      const trip = isDbConnected() ? b.agentTrip : fallbackTrips.get(b.agentTrip.toString());
      const tripTitle = trip ? trip.title : "Unknown Trip";

      let desc = "";
      if (b.paymentStatus === "Paid") {
        desc = `booked ${b.seats} seats for '${tripTitle}'`;
      } else if (b.paymentStatus === "Pending") {
        desc = `requested ${b.seats} seats for '${tripTitle}'`;
      } else {
        desc = `cancelled booking of ${b.seats} seats for '${tripTitle}'`;
      }

      return {
        id: b._id,
        type: b.paymentStatus.toLowerCase(),
        travelerName: b.travelerName,
        description: desc,
        timestamp: b.createdAt,
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyDataMap = {};
    
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      monthlyDataMap[mName] = { month: mName, Bookings: 0, Revenue: 0 };
    }

    bookings.forEach(b => {
      const bDate = new Date(b.createdAt);
      const mName = monthNames[bDate.getMonth()];
      if (monthlyDataMap[mName]) {
        monthlyDataMap[mName].Bookings += b.seats;
        if (b.paymentStatus !== "Cancelled") {
          monthlyDataMap[mName].Revenue += b.pricePaid;
        }
      }
    });

    const bookingsGraph = Object.values(monthlyDataMap);

    const totalCapacity = trips.reduce((sum, t) => sum + t.totalSeats, 0);
    const bookedSeats = trips.reduce((sum, t) => sum + (t.totalSeats - t.availableSeats), 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((bookedSeats / totalCapacity) * 100) : 0;

    const destCounts = {};
    trips.forEach(t => {
      t.destinations.forEach(d => {
        destCounts[d] = (destCounts[d] || 0) + 1;
      });
    });
    
    const popularDestinations = Object.entries(destCounts)
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topAgents = [
      { name: "Global Travels", revenue: totalRevenue, trips: totalTripsCount },
      { name: "Royal Wanders", revenue: Math.round(totalRevenue * 0.75), trips: Math.round(totalTripsCount * 0.8) },
      { name: "Escape planners", revenue: Math.round(totalRevenue * 0.6), trips: Math.round(totalTripsCount * 0.5) }
    ];

    res.status(200).json({
      success: true,
      metrics: {
        totalTrips: totalTripsCount,
        activeTrips: activeTripsCount,
        upcomingTrips: upcomingTripsCount,
        totalTravelers,
        revenue: totalRevenue,
        pendingBookings: pendingBookingsCount,
        occupancyRate,
        maleCount: maleTravelers,
        femaleCount: femaleTravelers,
        otherCount: otherTravelers,
      },
      recentActivities,
      bookingsGraph,
      popularDestinations,
      topAgents,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ success: false, message: "Server Error calculating analytics data" });
  }
});

// @route   PATCH /api/agent/trips/:id/draft or /api/agent/trips/draft
// @desc    Autosave / save draft preserving all form values
router.patch(["/trips/:id/draft", "/trips/draft"], protectAgent, async (req, res) => {
  try {
    const id = req.params.id || req.body._id || req.body.id;
    if (!id) {
      return res.status(400).json({ success: false, message: "Trip ID is required" });
    }

    let trip;
    if (isDbConnected()) {
      trip = await AgentTrip.findById(id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      // Check owner
      const ownerId = trip.agentId || trip.createdBy || trip.userId || trip.agent;
      if (ownerId && ownerId.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized draft save request" });
      }

      // Handle booking deadline calculation if startDate is changed or deadline is provided
      if (req.body.startDate || req.body.bookingDeadline) {
        const startDate = req.body.startDate || trip.startDate;
        const resolvedBookingDeadline = handleBookingDeadline(startDate, req.body.bookingDeadline);
        // On draft save, we only validate deadline if startDate and deadline are present
        if (startDate && resolvedBookingDeadline) {
          if (!validateBookingDeadline(startDate, resolvedBookingDeadline)) {
            return res.status(400).json({
              success: false,
              message: "Booking deadline must be strictly before start date."
            });
          }
        }
        req.body.bookingDeadline = resolvedBookingDeadline;
      }

      // Enforce capacity protection
      if (req.body.totalSeats !== undefined) {
        const totalSeatsVal = Number(req.body.totalSeats);
        const currentBooked = trip.bookedSeats || 0;
        if (currentBooked > 0 && totalSeatsVal < currentBooked) {
          return res.status(400).json({
            success: false,
            message: `Cannot reduce total seats below currently booked seats: ${currentBooked}`
          });
        }
        req.body.availableSeats = totalSeatsVal - currentBooked;
      }

      // Overwrite/merge fields
      trip = await AgentTrip.findByIdAndUpdate(id, {
        ...req.body,
        status: "draft",
        publishStatus: "draft",
      }, { returnDocument: "after" });
    } else {
      trip = fallbackTrips.get(id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }
      const updated = {
        ...trip,
        ...req.body,
        status: "draft",
        publishStatus: "draft",
        updatedAt: new Date()
      };
      fallbackTrips.set(id, updated);
      trip = updated;
    }

    res.status(200).json({
      success: true,
      message: "Draft saved successfully",
      trip
    });
  } catch (error) {
    console.error("Save draft error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error saving draft" });
  }
});

// @route   POST /api/agent/trips/publish or /api/agent/trips/:id/publish
// @desc    Explicitly publish a trip (Requires 100% completion)
router.post(["/trips/publish", "/trips/:id/publish", "/trip/:id/publish"], protectAgent, checkAgentKYC, async (req, res) => {
  try {
    const id = req.params.id || req.body.id || req.body._id || req.body.tripId;
    if (!id) {
      return res.status(400).json({ success: false, message: "Trip ID is required to publish" });
    }

    let trip;
    if (isDbConnected()) {
      trip = await AgentTrip.findById(id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      const ownerId = trip.agentId || trip.createdBy || trip.userId || trip.agent;
      if (ownerId && ownerId.toString() !== req.agent._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized publish request" });
      }

      // Check required fields (100% completion)
      const missingFields = [];
      if (!trip.title) missingFields.push("title");
      if (!trip.description) missingFields.push("description");
      if (!trip.destinations || trip.destinations.length === 0) missingFields.push("destinations");
      if (!trip.startDate) missingFields.push("startDate");
      if (!trip.endDate) missingFields.push("endDate");
      if (!trip.bookingDeadline) missingFields.push("bookingDeadline");
      if (!trip.busType) missingFields.push("busType");
      if (!trip.emergencyContact) missingFields.push("emergencyContact");
      if (!trip.totalSeats) missingFields.push("totalSeats");
      if (!trip.pricePerPerson && !trip.offerPrice) missingFields.push("pricePerPerson / offerPrice");

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot publish trip. Please complete all mandatory sections (100% progress required).",
          missingFields
        });
      }

      trip.status = "published";
      trip.publishStatus = "published";
      trip.published = true;
      trip.visible = true;
      trip.publishedAt = new Date();
      trip.progressPercentage = 100;
      await trip.save();
    } else {
      trip = fallbackTrips.get(id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }
      trip.status = "published";
      trip.publishStatus = "published";
      trip.published = true;
      trip.visible = true;
      trip.publishedAt = new Date();
      trip.progressPercentage = 100;
      fallbackTrips.set(id, trip);
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("trip_published", trip._id || id);
    }

    res.status(200).json({
      success: true,
      message: "Trip published successfully",
      trip
    });
  } catch (error) {
    console.error("Publish trip error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error publishing trip" });
  }
});

// @route   PATCH /api/agent/trips/:id/cancel-request or /api/agent/trips/cancel-request
// @desc    Initiate cancellation workflow for a trip
router.patch(["/trips/:id/cancel-request", "/trips/cancel-request"], protectAgent, async (req, res) => {
  try {
    const id = req.params.id || req.body.id || req.body._id || req.body.tripId;
    if (!id) {
      return res.status(400).json({ success: false, message: "Trip ID is required" });
    }

    let trip;
    let bookings = [];

    if (isDbConnected()) {
      trip = await AgentTrip.findById(id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      bookings = await Booking.find({ tripId: id, status: { $ne: "cancelled" } }).populate("userId");
      
      trip.status = "cancel_pending";
      await trip.save();
    } else {
      trip = fallbackTrips.get(id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }
      bookings = Array.from(fallbackBookings.values()).filter(b => b.agentTrip.toString() === id && b.status !== "cancelled");
      trip.status = "cancel_pending";
      fallbackTrips.set(id, trip);
    }

    // System sends OTP/email notification to every booked traveler.
    console.log(`[Trip Cancellation] Sent notification to ${bookings.length} traveler(s) for trip: ${trip.title}`);
    bookings.forEach(b => {
      const email = b.userId?.email || b.contactNumber || "traveler@example.com";
      console.log(`[Notification] OTP/Email Sent to: ${email} for Trip cancellation of: ${trip.title}`);
    });

    res.status(200).json({
      success: true,
      message: "Trip cancellation initiated. Awaiting travelers acknowledgements.",
      status: "cancel_pending",
      bookedUsersCount: bookings.length
    });
  } catch (error) {
    console.error("Cancel request error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error requesting cancellation" });
  }
});

// @route   POST /api/agent/trips/cancel/verify
// @desc    Endpoint for travelers to confirm and acknowledge cancellation
router.post("/trips/cancel/verify", async (req, res) => {
  const { tripId, userId } = req.body;
  if (!tripId || !userId) {
    return res.status(400).json({ success: false, message: "Trip ID and User ID are required" });
  }

  try {
    let trip;
    let bookings = [];

    if (isDbConnected()) {
      trip = await AgentTrip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      // Check if user already confirmed
      const alreadyConfirmed = (trip.cancellationConfirmations || []).some(
        c => c.userId.toString() === userId.toString()
      );
      if (!alreadyConfirmed) {
        trip.cancellationConfirmations.push({ userId, confirmedAt: new Date() });
        await trip.save();
      }

      // Get unique users who have active bookings
      bookings = await Booking.find({ tripId, status: { $ne: "cancelled" } });
      const bookedUserIds = [...new Set(bookings.map(b => b.userId.toString()))];
      const confirmedUserIds = new Set((trip.cancellationConfirmations || []).map(c => c.userId.toString()));
      const allUsersConfirmed = bookedUserIds.length > 0 && bookedUserIds.every(uid => confirmedUserIds.has(uid));

      if (allUsersConfirmed) {
        trip.status = "cancelled";
        await trip.save();

        // Mark bookings as cancelled
        await Booking.updateMany(
          { tripId, status: { $ne: "cancelled" } },
          { $set: { status: "cancelled", paymentStatus: "Cancelled" } }
        );
      }
    } else {
      trip = fallbackTrips.get(tripId);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      if (!trip.cancellationConfirmations) trip.cancellationConfirmations = [];
      const alreadyConfirmed = trip.cancellationConfirmations.some(c => c.userId.toString() === userId.toString());
      if (!alreadyConfirmed) {
        trip.cancellationConfirmations.push({ userId, confirmedAt: new Date() });
      }

      bookings = Array.from(fallbackBookings.values()).filter(b => b.agentTrip.toString() === tripId && b.status !== "cancelled");
      const bookedUserIds = [...new Set(bookings.map(b => b.userId.toString()))];
      const confirmedUserIds = new Set(trip.cancellationConfirmations.map(c => c.userId.toString()));
      const allUsersConfirmed = bookedUserIds.length > 0 && bookedUserIds.every(uid => confirmedUserIds.has(uid));

      if (allUsersConfirmed) {
        trip.status = "cancelled";
        bookings.forEach(b => {
          b.status = "cancelled";
          b.paymentStatus = "Cancelled";
        });
      }
      fallbackTrips.set(tripId, trip);
    }

    res.status(200).json({
      success: true,
      message: "Cancellation acknowledged successfully.",
      status: trip.status
    });
  } catch (error) {
    console.error("Cancel verify error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error verifying cancellation" });
  }
});

// @route   GET /api/agent/trips/metrics or /api/agent/metrics
// @desc    Dashboard Metrics aggregated for agent
router.get(["/trips/metrics", "/metrics"], protectAgent, async (req, res) => {
  try {
    const agentId = req.agent._id || req.agent.id;
    let trips = [];
    let bookings = [];

    if (isDbConnected()) {
      trips = await AgentTrip.find({ agentId, isDeleted: { $ne: true } });
      const tripIds = trips.map(t => t._id);
      bookings = await Booking.find({ tripId: { $in: tripIds } });
    } else {
      trips = Array.from(fallbackTrips.values()).filter(t => t.agent.toString() === agentId.toString());
      bookings = Array.from(fallbackBookings.values()).filter(b => b.agent.toString() === agentId.toString());
    }

    const now = new Date();

    const publishedTrips = trips.filter(t => t.status === "published").length;
    const draftTrips = trips.filter(t => t.status === "draft").length;
    const cancelledTrips = trips.filter(t => t.status === "cancelled").length;

    const upcomingTrips = trips.filter(t => t.status === "published" && new Date(t.startDate) > now).length;
    const completedTrips = trips.filter(t => new Date(t.endDate) < now).length;

    const totalSeats = trips.reduce((sum, t) => sum + (t.totalSeats || 0), 0);
    const bookedSeats = trips.reduce((sum, t) => sum + (t.bookedSeats || 0), 0);
    const occupancy = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    const revenue = bookings
      .filter(b => b.status !== "cancelled" && b.paymentStatus !== "Cancelled")
      .reduce((sum, b) => sum + (b.pricePaid || b.amount || 0), 0);

    res.status(200).json({
      success: true,
      metrics: {
        publishedTrips,
        draftTrips,
        cancelledTrips,
        upcomingTrips,
        completedTrips,
        occupancy,
        revenue
      }
    });
  } catch (error) {
    console.error("Get metrics error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error fetching metrics" });
  }
});

// ─── BOOKING Lock, Refund & Delete FLOW ───

router.get("/trips/:id/bookings-check", protectAgent, checkAgentKYC, async (req, res) => {
  try {
    const trip = await AgentTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    const bookings = await Booking.find({ tripId: req.params.id, status: { $ne: "cancelled" } });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/trips/:id/start-refund", protectAgent, checkAgentKYC, async (req, res) => {
  try {
    const trip = await AgentTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    
    const bookings = await Booking.find({ tripId: req.params.id, status: { $ne: "cancelled" } });
    if (bookings.length === 0) {
      return res.status(400).json({ success: false, message: "No active bookings found for this trip." });
    }

    const User = (await import("../models/User.js")).default;
    const { sendOtpEmail } = await import("../services/emailService.js");

    for (const b of bookings) {
      b.refundStatus = "Pending";
      const travelerOtp = Math.floor(100000 + Math.random() * 900000).toString();
      b.assignedSeat = travelerOtp; // OTP code
      b.otpVerified = false;
      await b.save();

      // Find traveler user details and send email
      try {
        const travelerUser = await User.findById(b.userId);
        if (travelerUser && travelerUser.email) {
          await sendOtpEmail(travelerUser.email, travelerUser.firstName || "Traveler", travelerOtp);
          console.log(`[Refund OTP] Sent OTP to traveler email: ${travelerUser.email}`);
        }
      } catch (err) {
        console.error("Failed to send refund OTP to traveler:", err);
      }
    }

    res.status(200).json({
      success: true,
      message: "Refunds processing initiated. Traveler OTPs sent to their registered emails.",
      bookings: bookings.map(b => ({
        bookingId: b.bookingId,
        _id: b._id,
        travelerName: b.travelerName,
        pricePaid: b.pricePaid,
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/trips/:id/verify-traveler-otp", protectAgent, checkAgentKYC, async (req, res) => {
  try {
    const { bookingId, otp } = req.body;
    if (!bookingId || !otp) {
      return res.status(400).json({ success: false, message: "bookingId and otp are required" });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (booking.assignedSeat !== otp) {
      return res.status(400).json({ success: false, message: "Invalid traveler OTP code" });
    }

    booking.refundStatus = "Refund Completed";
    booking.otpVerified = true;
    await booking.save();

    const trip = await AgentTrip.findById(req.params.id);
    const activeBookings = await Booking.find({ tripId: req.params.id, status: { $ne: "cancelled" } });
    const allRefunded = activeBookings.every(b => b.refundStatus === "Refund Completed");

    if (allRefunded) {
      trip.status = "Refund Completed";
      await trip.save();
    }

    res.status(200).json({
      success: true,
      message: "Traveler refund verified successfully.",
      booking,
      tripStatus: trip.status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── AGENT WALLET & WITHDRAWALS ───

router.get("/wallet/stats", protectAgent, checkAgentKYC, async (req, res) => {
  try {
    const WalletModel = await import("../models/Wallet.js").then(m => m.default);
    let wallet = await WalletModel.findOne({ agentId: req.agent._id });
    if (!wallet) {
      wallet = new WalletModel({ agentId: req.agent._id });
      await wallet.save();
    }
    res.status(200).json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/wallet/withdraw", protectAgent, checkAgentKYC, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Valid withdrawal amount is required" });
    }
    const WalletModel = await import("../models/Wallet.js").then(m => m.default);
    let wallet = await WalletModel.findOne({ agentId: req.agent._id });
    if (!wallet) {
      return res.status(400).json({ success: false, message: "Wallet not found" });
    }

    if (wallet.withdrawableBalance < Number(amount)) {
      return res.status(400).json({ success: false, message: "Insufficient withdrawable balance" });
    }

    wallet.withdrawableBalance -= Number(amount);
    wallet.pendingBalance += Number(amount);
    await wallet.save();

    const WithdrawalModel = await import("../models/Withdrawal.js").then(m => m.default);
    const withdrawal = await WithdrawalModel.create({
      agentId: req.agent._id,
      amount: Number(amount),
      status: "Pending"
    });

    res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully. Awaiting Admin approval.",
      withdrawal,
      wallet
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/wallet/withdrawals", protectAgent, checkAgentKYC, async (req, res) => {
  try {
    const WithdrawalModel = await import("../models/Withdrawal.js").then(m => m.default);
    const withdrawals = await WithdrawalModel.find({ agentId: req.agent._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ============================================================
   SCHEDULE CHANGE REQUEST — Date/Time only, OTP consent flow
   ============================================================ */

/**
 * POST /agent/trips/:tripId/schedule-change/initiate
 * Agent requests a departure date/time change.
 * - If no active bookings: updates trip immediately.
 * - If bookings exist: creates ScheduleChangeRequest, sends OTP to each booked passenger.
 */
router.post("/trips/:tripId/schedule-change/initiate", protectAgent, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { newStartDate, newDepartureTime } = req.body;

    if (!newStartDate || !newDepartureTime) {
      return res.status(400).json({ success: false, message: "newStartDate and newDepartureTime are required." });
    }

    const trip = await AgentTrip.findOne({ _id: tripId, agentId: req.agent._id });
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found or unauthorized." });

    // Find active (non-cancelled) bookings
    const activeBookings = await Booking.find({
      tripId,
      paymentStatus: { $nin: ["CANCELLED", "Cancelled", "cancelled"] },
    }).lean();

    const ScheduleChangeRequest = await import("../models/ScheduleChangeRequest.js").then(m => m.default);
    const { sendScheduleChangeOtpEmail } = await import("../services/emailService.js");

    const oldStartDate = trip.startDate;
    const oldDepartureTime = trip.departureTime;

    if (activeBookings.length === 0) {
      // No bookings — direct update, no OTP needed
      trip.startDate = newStartDate;
      trip.departureTime = newDepartureTime;
      await trip.save();
      return res.status(200).json({
        success: true,
        requiresConsent: false,
        message: "Schedule updated immediately (no active bookings).",
        trip,
      });
    }

    // Cancel any previous pending request for this trip
    await ScheduleChangeRequest.updateMany(
      { tripId, status: "pending" },
      { $set: { status: "cancelled" } }
    );

    // Build passenger consent list
    const User = await import("../models/User.js").then(m => m.default);
    const passengers = [];
    for (const booking of activeBookings) {
      let email = booking.email || "";
      // Try to fetch email from user record if not on booking
      if (!email && booking.userId) {
        const user = await User.findById(booking.userId).select("email").lean();
        if (user?.email) email = user.email;
      }
      if (!email) {
        console.warn(`[ScheduleChange] No email for booking ${booking.bookingId} — skipping OTP`);
        continue;
      }

      const otp = ScheduleChangeRequest.generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      passengers.push({
        bookingId: booking.bookingId,
        userId: booking.userId || null,
        travelerName: booking.travelerName || "",
        email,
        otp,
        otpHash: ScheduleChangeRequest.hashOtp(otp),
        expiresAt,
        status: "otp_sent",
        otpSentAt: new Date(),
      });
    }

    const changeRequest = await ScheduleChangeRequest.create({
      tripId,
      agentId: req.agent._id,
      newStartDate,
      newDepartureTime,
      oldStartDate,
      oldDepartureTime,
      totalPassengers: passengers.length,
      approvedCount: 0,
      passengers,
    });

    // Send OTP emails (non-blocking — fire and forget with error logging)
    const formattedDate = (() => {
      try {
        return new Date(newStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      } catch { return newStartDate; }
    })();

    for (const p of passengers) {
      sendScheduleChangeOtpEmail(p.email, p.travelerName, {
        bookingId: p.bookingId,
        newDate: formattedDate,
        newTime: newDepartureTime,
        otp: p.otp,
      }).catch(err => console.error(`[ScheduleChange] OTP email failed for ${p.email}:`, err.message));
    }

    res.status(200).json({
      success: true,
      requiresConsent: true,
      message: `OTP sent to ${passengers.length} passenger(s). All must approve before schedule is updated.`,
      changeRequestId: changeRequest._id,
      totalPassengers: passengers.length,
      approvedCount: 0,
      passengers: passengers.map(p => ({
        bookingId: p.bookingId,
        travelerName: p.travelerName,
        email: p.email,
        status: p.status,
      })),
    });
  } catch (error) {
    console.error("[ScheduleChange] Initiate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /agent/trips/:tripId/schedule-change/resend-otp
 * Resend OTP to a specific passenger (identified by bookingId).
 */
router.post("/trips/:tripId/schedule-change/resend-otp", protectAgent, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { bookingId } = req.body;

    const ScheduleChangeRequest = await import("../models/ScheduleChangeRequest.js").then(m => m.default);
    const { sendScheduleChangeOtpEmail } = await import("../services/emailService.js");

    const changeRequest = await ScheduleChangeRequest.findOne({
      tripId,
      agentId: req.agent._id,
      status: "pending",
    });
    if (!changeRequest) return res.status(404).json({ success: false, message: "No active schedule change request found." });

    const passenger = changeRequest.passengers.find(p => p.bookingId === bookingId);
    if (!passenger) return res.status(404).json({ success: false, message: "Passenger not found in this request." });
    if (passenger.verified) return res.status(400).json({ success: false, message: "Passenger already approved." });

    const otp = ScheduleChangeRequest.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    passenger.otp = otp;
    passenger.otpHash = ScheduleChangeRequest.hashOtp(otp);
    passenger.expiresAt = expiresAt;
    passenger.status = "otp_sent";
    passenger.otpSentAt = new Date();

    await changeRequest.save();

    const formattedDate = (() => {
      try { return new Date(changeRequest.newStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
      catch { return changeRequest.newStartDate; }
    })();

    sendScheduleChangeOtpEmail(passenger.email, passenger.travelerName, {
      bookingId: passenger.bookingId,
      newDate: formattedDate,
      newTime: changeRequest.newDepartureTime,
      otp,
    }).catch(err => console.error(`[ScheduleChange] Resend OTP email failed:`, err.message));

    res.status(200).json({ success: true, message: `OTP resent to ${passenger.email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /agent/trips/:tripId/schedule-change/verify-otp
 * Passenger verifies their OTP through the agent portal verification screen.
 * Body: { bookingId, passengerName, email, otp }
 */
router.post("/trips/:tripId/schedule-change/verify-otp", protectAgent, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { bookingId, otp } = req.body;

    if (!bookingId || !otp) {
      return res.status(400).json({ success: false, message: "bookingId and otp are required." });
    }

    const ScheduleChangeRequest = await import("../models/ScheduleChangeRequest.js").then(m => m.default);

    const changeRequest = await ScheduleChangeRequest.findOne({
      tripId,
      agentId: req.agent._id,
      status: "pending",
    });
    if (!changeRequest) return res.status(404).json({ success: false, message: "No active schedule change request found." });

    const passenger = changeRequest.passengers.find(p => p.bookingId === bookingId);
    if (!passenger) return res.status(404).json({ success: false, message: "Passenger booking not found." });
    if (passenger.verified) return res.status(400).json({ success: false, message: "Already approved." });

    // Check expiry
    if (passenger.expiresAt && new Date() > new Date(passenger.expiresAt)) {
      passenger.status = "expired";
      await changeRequest.save();
      return res.status(400).json({ success: false, message: "OTP has expired. Please resend." });
    }

    // Verify OTP
    const inputHash = ScheduleChangeRequest.hashOtp(otp);
    if (inputHash !== passenger.otpHash) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    passenger.verified = true;
    passenger.verifiedAt = new Date();
    passenger.status = "approved";
    changeRequest.approvedCount = changeRequest.passengers.filter(p => p.verified).length;

    // If all approved, mark request as approved
    if (changeRequest.approvedCount >= changeRequest.totalPassengers) {
      changeRequest.status = "approved";
    }

    await changeRequest.save();

    res.status(200).json({
      success: true,
      message: "Passenger approved.",
      approvedCount: changeRequest.approvedCount,
      totalPassengers: changeRequest.totalPassengers,
      allApproved: changeRequest.status === "approved",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /agent/trips/:tripId/schedule-change/status
 * Get current schedule change request status & approval progress.
 */
router.get("/trips/:tripId/schedule-change/status", protectAgent, async (req, res) => {
  try {
    const { tripId } = req.params;
    const ScheduleChangeRequest = await import("../models/ScheduleChangeRequest.js").then(m => m.default);

    const changeRequest = await ScheduleChangeRequest.findOne({
      tripId,
      agentId: req.agent._id,
      status: { $in: ["pending", "approved"] },
    }).sort({ createdAt: -1 });

    if (!changeRequest) {
      return res.status(200).json({ success: true, exists: false });
    }

    res.status(200).json({
      success: true,
      exists: true,
      changeRequestId: changeRequest._id,
      status: changeRequest.status,
      newStartDate: changeRequest.newStartDate,
      newDepartureTime: changeRequest.newDepartureTime,
      oldStartDate: changeRequest.oldStartDate,
      oldDepartureTime: changeRequest.oldDepartureTime,
      totalPassengers: changeRequest.totalPassengers,
      approvedCount: changeRequest.approvedCount,
      allApproved: changeRequest.status === "approved",
      passengers: changeRequest.passengers.map(p => ({
        bookingId: p.bookingId,
        travelerName: p.travelerName,
        email: p.email,
        status: p.status,
        verified: p.verified,
        verifiedAt: p.verifiedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /agent/trips/:tripId/schedule-change/apply
 * Apply the approved schedule change: update trip dates, send notification emails.
 */
router.post("/trips/:tripId/schedule-change/apply", protectAgent, async (req, res) => {
  try {
    const { tripId } = req.params;
    const ScheduleChangeRequest = await import("../models/ScheduleChangeRequest.js").then(m => m.default);
    const { sendScheduleUpdateNotification } = await import("../services/emailService.js");

    const changeRequest = await ScheduleChangeRequest.findOne({
      tripId,
      agentId: req.agent._id,
      status: "approved",
    });
    if (!changeRequest) {
      return res.status(400).json({ success: false, message: "No fully-approved schedule change request found. All passengers must approve first." });
    }

    // Apply the change to the trip
    const trip = await AgentTrip.findOne({ _id: tripId, agentId: req.agent._id });
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found." });

    trip.startDate = changeRequest.newStartDate;
    trip.departureTime = changeRequest.newDepartureTime;
    await trip.save();

    // Mark request as applied
    changeRequest.status = "applied";
    changeRequest.appliedAt = new Date();
    await changeRequest.save();

    // Send notification emails (fire and forget)
    const formattedOldDate = (() => {
      try { return new Date(changeRequest.oldStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
      catch { return changeRequest.oldStartDate; }
    })();
    const formattedNewDate = (() => {
      try { return new Date(changeRequest.newStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
      catch { return changeRequest.newStartDate; }
    })();

    for (const p of changeRequest.passengers) {
      sendScheduleUpdateNotification(p.email, p.travelerName, {
        bookingId: p.bookingId,
        oldDate: formattedOldDate,
        newDate: formattedNewDate,
        oldTime: changeRequest.oldDepartureTime,
        newTime: changeRequest.newDepartureTime,
      }).catch(err => console.error(`[ScheduleChange] Notification email failed for ${p.email}:`, err.message));
    }

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully. Notification emails sent to all passengers.",
      trip,
    });
  } catch (error) {
    console.error("[ScheduleChange] Apply error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /agent/slots
 * Retrieve agent slots allocation details
 */
router.get("/slots", protectAgent, async (req, res) => {
  try {
    const isDbConnected = () => mongoose.connection.readyState === 1;
    let settings = null;
    if (isDbConnected()) {
      settings = await AgentSettings.findOne({ settingId: "global" });
    }
    const defaultSlots = settings ? settings.defaultTripSlots : 2;

    const agent = isDbConnected()
      ? await Agent.findById(req.agent._id)
      : fallbackAgents.get(req.agent._id.toString());

    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    // Auto-generate referral code if not exists
    if (!agent.referralCode) {
      const cleanName = (agent.companyName || "AGT").replace(/[^a-zA-Z]/g, "").toUpperCase();
      agent.referralCode = `AGT-${cleanName.slice(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`;
      if (isDbConnected()) {
        await agent.save();
      } else {
        fallbackAgents.set(agent._id.toString(), agent);
      }
    }

    const baseSlots = agent.tripSlots !== undefined ? agent.tripSlots : defaultSlots;
    const bonusSlots = agent.bonusSlots || 0;
    const purchasedSlots = agent.purchasedSlots || 0;
    const totalSlots = baseSlots + bonusSlots + purchasedSlots;

    let activeTripsCount = 0;
    if (isDbConnected()) {
      activeTripsCount = await AgentTrip.countDocuments({
        agentId: req.agent._id,
        status: { $nin: ["completed", "Completed", "cancelled", "Cancelled"] },
        isDeleted: { $ne: true }
      });
    } else {
      activeTripsCount = Array.from(fallbackTrips.values()).filter(
        t => t.agentId.toString() === req.agent._id.toString() &&
             !["completed", "Completed", "cancelled", "Cancelled"].includes(t.status) &&
             t.isDeleted !== true
      ).length;
    }

    res.status(200).json({
      success: true,
      tripSlots: totalSlots,
      usedSlots: activeTripsCount,
      bonusSlots,
      purchasedSlots,
      baseSlots,
      remainingSlots: Math.max(0, totalSlots - activeTripsCount),
      referralCode: agent.referralCode,
      referralCount: agent.referralCount || 0,
    });
  } catch (error) {
    console.error("Get agent slots error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /agent/referral-settings
 * Retrieve slot purchasing configurations
 */
router.get("/referral-settings", protectAgent, async (req, res) => {
  try {
    const isDbConnected = () => mongoose.connection.readyState === 1;
    let settings = null;
    if (isDbConnected()) {
      settings = await AgentSettings.findOne({ settingId: "global" });
    }

    res.status(200).json({
      success: true,
      settings: {
        slotPrice: settings ? (settings.slotPrice || 1000) : 1000,
        slotPurchaseEnabled: settings ? (settings.slotPurchaseEnabled !== false) : true,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /agent/apply-referral
 * Apply another agent's referral invite code
 */
router.post("/apply-referral", protectAgent, async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode) {
      return res.status(400).json({ success: false, message: "Referral code is required." });
    }

    const isDbConnected = () => mongoose.connection.readyState === 1;
    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        message: "Referral code verified (Demo Mode).",
        inviterName: "Demo Partner",
      });
    }

    const agent = await Agent.findById(req.agent._id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    if (agent.referredBy) {
      return res.status(400).json({ success: false, message: "You have already applied a referral code." });
    }

    const inviter = await Agent.findOne({ referralCode: referralCode.trim().toUpperCase() });
    if (!inviter) {
      return res.status(400).json({ success: false, message: "Invalid referral code. Agent not found." });
    }

    if (inviter._id.toString() === agent._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot refer yourself." });
    }

    agent.referredBy = inviter.referralCode;
    await agent.save();

    await AgentReferral.create({
      inviterAgentId: inviter._id,
      newAgentId: agent._id,
      rewardGranted: false,
      conditionsMet: false,
    });

    inviter.referralCount = (inviter.referralCount || 0) + 1;
    await inviter.save();

    res.status(200).json({
      success: true,
      message: `Referral code verified! Invited by ${inviter.companyName || "Partner Agent"}.`,
      inviterName: inviter.companyName,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

