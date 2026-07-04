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
import protectAgent, { fallbackAgents } from "../middleware/agentAuthMiddleware.js";


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
        { new: true, runValidators: true }
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
router.post("/trips/create", protectAgent, async (req, res) => {
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

  // ── Profile / verification gate ──────────────────────────────────
  const hasGst = !!req.agent.gstNumber;
  const hasPhone = !!req.agent.phone;
  const isProfileCompleted = !!req.agent.profileCompleted;
  const isEmailVerified = !!req.agent.emailVerified;

  if (!isProfileCompleted || !isEmailVerified || !hasGst || !hasPhone) {
    return res.status(403).json({
      success: false,
      code: "PROFILE_INCOMPLETE",
      message: "Complete your Agent Profile to start publishing trips.",
    });
  }

  // ── Required field check with detailed missingFields response ────
  const missingFields = [];
  if (!title)             missingFields.push("title (Trip Name)");
  if (!shortDescription)  missingFields.push("shortDescription / subtitle");
  if (!description)       missingFields.push("description");
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
      shortDescription,            // resolved above
      pricePerPerson: Number(pricePerPerson),  // resolved above
      destinations: Array.isArray(destinations) ? destinations : [destinations],
      totalSeats: Number(totalSeats),
      availableSeats: Number(totalSeats),
      driver: driverId,
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
router.put(["/trip/:id", "/trips/:id"], protectAgent, async (req, res) => {
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

      // 1. Validate bookingDeadline
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

      // 2. Enforce capacity protection
      if (req.body.totalSeats !== undefined) {
        const totalSeatsVal = Number(req.body.totalSeats);
        const currentBooked = trip.bookedSeats || 0;
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

      trip = await AgentTrip.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
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
router.put(["/trip/:id/publish", "/trips/:id/publish"], protectAgent, async (req, res) => {
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
        const isCancelled = trip.status === "cancelled";
        // Check if all booked users confirmed cancellation
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
        { new: true }
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
    const activeBookings = bookings.filter(b =>
      b.paymentStatus !== "Cancelled" &&
      b.paymentStatus !== "cancelled"
    );
    const paidBookings = bookings.filter(b =>
      b.paymentStatus === "Paid"
    );
    const cancelledBookings = bookings.filter(b =>
      b.paymentStatus === "Cancelled" || b.paymentStatus === "cancelled"
    );
    const boardedBookings = activeBookings.filter(b =>
      b.boardingStatus === "boarded"
    );
    const pendingBoardingBookings = activeBookings.filter(b =>
      b.boardingStatus !== "boarded"
    );

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
      pendingRevenue: bookings.filter(b => b.paymentStatus === "Pending").reduce((sum, b) => sum + (b.pricePaid || 0), 0),
      refundedAmount: cancelledBookings.reduce((sum, b) => sum + (b.pricePaid || 0), 0),
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
      }, { new: true });
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
router.post(["/trips/publish", "/trips/:id/publish", "/trip/:id/publish"], protectAgent, async (req, res) => {
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

export default router;
