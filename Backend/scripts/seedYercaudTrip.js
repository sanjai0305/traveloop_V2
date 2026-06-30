/**
 * seedYercaudTrip.js
 * 
 * Directly inserts the YERCAUD WEEKEND ESCAPADE trip into MongoDB.
 * Run from backend/ directory: node scripts/seedYercaudTrip.js
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// ─── Models ──────────────────────────────────────────────────────────────────
// Import the real compiled models from the project
import Agent from "../models/Agent.js";
import AgentTrip from "../models/AgentTrip.js";
import Driver from "../models/Driver.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/traveloop";
const DRIVER_EMAIL = "sanjaim0940r@gmail.com";
const AGENT_EMAIL  = "sanjaim0940r@gmail.com";

// ─── Connect ─────────────────────────────────────────────────────────────────
await mongoose.connect(MONGO_URI);
console.log("✅ MongoDB Connected:", mongoose.connection.host);

// ─── 1. Upsert Agent ─────────────────────────────────────────────────────────
let agent = await Agent.findOne({ email: AGENT_EMAIL });

if (!agent) {
  agent = await Agent.create({
    uid: `local_${Date.now()}`,
    email: AGENT_EMAIL,
    displayName: "Sanjai Agent",
    phone: "9876543210",
    companyName: "Sanjai Tours & Travels",
    gstNumber: "33AABCU9603R1ZV",
    businessCategory: "Travel Agency",
    address: "No 12, Salem Main Road",
    city: "Salem",
    state: "Tamil Nadu",
    country: "India",
    profileCompleted: true,
    emailVerified: true,
    status: "approved",
  });
  console.log("✅ New agent created:", agent._id);
} else {
  // Ensure all profile fields are set so trip creation is not blocked
  const updates = {};
  if (!agent.phone)             updates.phone             = "9876543210";
  if (!agent.gstNumber)         updates.gstNumber         = "33AABCU9603R1ZV";
  if (!agent.companyName)       updates.companyName       = "Sanjai Tours & Travels";
  if (!agent.profileCompleted)  updates.profileCompleted  = true;
  if (!agent.emailVerified)     updates.emailVerified     = true;
  if (!agent.status)            updates.status            = "approved";

  if (Object.keys(updates).length > 0) {
    await Agent.findByIdAndUpdate(agent._id, { $set: updates });
    console.log("✅ Agent profile updated with missing fields:", updates);
  } else {
    console.log("✅ Existing agent found and ready:", agent._id);
  }
  agent = await Agent.findById(agent._id);
}

// ─── 2. Upsert Driver ────────────────────────────────────────────────────────
let driver = await Driver.findOne({ email: DRIVER_EMAIL });

if (!driver) {
  driver = await Driver.create({
    name: "Sanjai",
    email: DRIVER_EMAIL,
    phone: "9876543210",
    licenseNumber: "TN01-DL-2025-001",
    vehicleNumber: "TN-01-BB7383",
    photo: "",
    emergencyContact: "9876543210",
    assignedAgent: agent._id,
    status: "active",
  });
  console.log("✅ New driver created:", driver._id);
} else {
  // Update driver info
  driver.name = "Sanjai";
  driver.phone = "9876543210";
  driver.vehicleNumber = "TN-01-BB7383";
  driver.assignedAgent = agent._id;
  driver.status = "active";
  await driver.save();
  console.log("✅ Existing driver found and updated:", driver._id);
}

// ─── 3. Create Trip ──────────────────────────────────────────────────────────
const tripPayload = {
  agent: agent._id,
  driver: driver._id,

  // Basic Info
  title: "YERCAUD WEEKEND ESCAPADE",
  subtitle: "Happy Journey",
  tagline: "Happy Journey",
  shortDescription: "A weekend hill station group escape from Salem to the scenic hills of Yercaud.",
  description:
    "Experience the scenic beauty of Yercaud in this amazing weekend group tour. Depart from Five Roads, Salem at 6 AM and reach Yercaud by 9:30 AM. Enjoy the cool breeze, lush greenery, waterfalls, and memorable experiences. Stay at a comfortable 3-star hotel and return refreshed the next day. Perfect for families, friends, and group travelers.",
  category: "Hill Station",
  tripType: "Group Tour",

  // Route
  destinations: ["Yercaud"],
  originCity: "Salem",
  pickupLocation: "Five Roads",
  pickupPoint: "Five Roads",
  meetingPoint: "Five Roads Junction",
  dropPoint: "Yercaud Bus Stand",
  intermediateStops: ["Salem New Bus Stand", "Pagoda Point"],
  googleMapsUrl: "https://maps.google.com",

  // Schedule
  duration: "2 Days / 1 Night",
  startDate: "2026-07-01",
  endDate: "2026-07-02",
  departureTime: "06:00",
  arrivalTime: "09:30",
  reportingTime: "05:30",
  bookingDeadline: "2026-06-30",
  cancellationDeadline: "2026-06-30",
  cancellationUntilDate: "2026-06-30",
  cancellationUntilTime: "04:00",

  // Vehicle
  busType: "Mini Bus",
  busNumber: "TN-01-BB7383",
  totalSeats: 40,
  availableSeats: 40,

  // Driver info (denormalized for quick display)
  driverName: "Sanjai",
  driverPhone: "9876543210",
  driverGmail: DRIVER_EMAIL,
  emergencyContact: "9876543210",

  // Pricing
  pricePerPerson: 3999,
  originalPrice: 4500,
  offerPrice: 3999,
  discountPercentage: Math.round(((4500 - 3999) / 4500) * 100),
  gstPercentage: 5,
  convenienceFee: 150,

  // Inclusions
  mealsIncluded: ["Breakfast", "Lunch"],
  includedServices: ["Food", "Accommodation", "Transport"],
  hotelName: "Yercaud Summit Hotel",
  hotelRating: 3,
  roomType: "Standard Double",

  // Itinerary
  itinerary: [
    {
      day: 1,
      title: "Departure & Exploration",
      description:
        "Depart from Five Roads, Salem at 6:00 AM. Arrive Yercaud by 9:30 AM. Check in to hotel. Explore local attractions — Yercaud Lake, Shevaroys Temple, and Anna Park. Evening bonfire and group dinner.",
      hotel: "Yercaud Summit Hotel",
      images: [],
    },
    {
      day: 2,
      title: "Return Journey",
      description:
        "Morning breakfast at hotel. Visit Pagoda Point for scenic views. Departure from Yercaud at 11:00 AM. Arrive Salem Five Roads by 2:00 PM.",
      hotel: "",
      images: [],
    },
  ],

  // Terms & Cancellation
  allowCancellation: true,
  refundPolicy: "Fully Refundable",
  cancellationPolicy: "Full refund if cancelled before 30 June 2026 04:00 AM. No refund after the cut-off time.",
  termsConditions:
    "1. Departure is from Five Roads, Salem sharp at 6:00 AM. Be at the meeting point by 5:30 AM.\n2. Meals included: Breakfast and Lunch on Day 1 & 2.\n3. Hotel check-out by 10:00 AM on Day 2.\n4. Carry a valid photo ID.\n5. Trip is not transferable.",
  exclusions: "Personal expenses, souvenirs, entry fees to attractions not listed in itinerary",

  // Status & Boarding
  status: "published",
  publishStatus: "published",
  publishedAt: new Date(),
  boardingStatus: "CLOSED",
  boardingOpenedAt: null,
  boardingClosedAt: null,
  approvalStatus: "approved",

  // Counters
  bookedSeats: 0,
  maleCount: 0,
  femaleCount: 0,
  childrenCount: 0,
  boardedCount: 0,
  noShowCount: 0,

  isDeleted: false,
  isFeatured: false,

  // Cover image — a scenic Yercaud placeholder
  coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80",
  gallery: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop&q=60",
  ],
};

// Check for existing trip to avoid duplicates
const existingTrip = await AgentTrip.findOne({
  agent: agent._id,
  title: "YERCAUD WEEKEND ESCAPADE",
  isDeleted: { $ne: true },
});

let trip;
if (existingTrip) {
  console.log("⚠️  Trip already exists. Updating with latest data...");
  trip = await AgentTrip.findByIdAndUpdate(
    existingTrip._id,
    { $set: tripPayload },
    { new: true, runValidators: false }
  );
  console.log("✅ Trip updated:", trip._id);
} else {
  trip = await AgentTrip.create(tripPayload);
  console.log("✅ Trip created:", trip._id);
}

// ─── 4. Print Summary ─────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
console.log("  TRIP CREATED SUCCESSFULLY");
console.log("=".repeat(60));
console.log("  Trip ID        :", trip._id.toString());
console.log("  Title          :", trip.title);
console.log("  Status         :", trip.status);
console.log("  Agent          :", agent.email, "(" + agent._id + ")");
console.log("  Driver         :", driver.name, "(" + driver.email + ")");
console.log("  Destinations   :", trip.destinations.join(", "));
console.log("  Start Date     :", trip.startDate);
console.log("  End Date       :", trip.endDate);
console.log("  Departure      :", trip.departureTime);
console.log("  Seats          :", trip.totalSeats);
console.log("  Offer Price    : ₹" + trip.offerPrice);
console.log("  Boarding Status:", trip.boardingStatus);
console.log("=".repeat(60));
console.log("\n✅ Trip will now appear in:");
console.log("   • Agent Portal   → http://localhost:5174/trips");
console.log("   • Bookings View  → http://localhost:5174/bookings");
console.log("   • Traveler App   → http://localhost:5173 (explore published trips)");
console.log("   • Driver Portal  → http://localhost:5176 (after driver logs in)");

await mongoose.disconnect();
console.log("\n✅ Done. Database connection closed.");
process.exit(0);
