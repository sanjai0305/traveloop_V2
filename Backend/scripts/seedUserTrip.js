/**
 * seedUserTrip.js
 *
 * Creates the SALEM TO THENI TOUR trip assigned to driver:
 *   visionxnxtgen2026@gmail.com
 *
 * Run from Backend/ directory:
 *   node scripts/seedUserTrip.js
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Agent    from "../models/Agent.js";
import AgentTrip from "../models/AgentTrip.js";
import Driver   from "../models/Driver.js";

const MONGO_URI    = process.env.MONGO_URI || "mongodb://localhost:27017/traveloop";
const AGENT_EMAIL  = "sanjaim0940r@gmail.com";
const DRIVER_EMAIL = "visionxnxtgen2026@gmail.com";
const DRIVER_NAME  = "Vision Driver";

await mongoose.connect(MONGO_URI);
console.log("✅ MongoDB Connected:", mongoose.connection.host);

// 1. Find Agent
let agent = await Agent.findOne({ email: AGENT_EMAIL });
if (!agent) {
  agent = await Agent.create({
    uid: `local_agent_${Date.now()}`,
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
}

// 2. Find Driver
let driver = await Driver.findOne({ email: DRIVER_EMAIL });
if (!driver) {
  driver = await Driver.create({
    name:             DRIVER_NAME,
    email:            DRIVER_EMAIL,
    phone:            "9999988888",
    licenseNumber:    "DL-12345",
    vehicleNumber:    "TN-30-AA-1234",
    photo:            "",
    emergencyContact: "9876543210",
    assignedAgent:    agent._id,
    status:           "active",
    emailVerified:    true,
    assignedTrips:    [],
  });
}

// 3. Trip Payload
const tripPayload = {
  agentId:  agent._id,
  driverId: driver._id,
  driver:   driver._id,

  title:            "SALEM TO THENI TOUR",
  subtitle:         "A Scenic 4-Day Journey",
  tagline:          "Explore temples, beaches and heritage sites across Tamil Nadu",
  shortDescription: "A beautiful multi-day group tour starting from Salem Bus Stand, exploring Madurai, Chennai, Cuddalore, and concluding at Theni Bus Stand.",
  description:
    "Join us on an unforgettable 4-day group journey through Tamil Nadu. " +
    "Starting from Salem Bus Stand, we visit the historic Meenakshi Temple in Madurai, " +
    "the vibrant Marina Beach and Mahabalipuram monuments in Chennai, " +
    "the serene coastal beauty of Cuddalore, and finally conclude at Theni. " +
    "Transport is in a premium minibus with high-quality accommodations included.",
  category: "Adventure Ride",
  tripType: "Group Tour",

  destinations:       ["Madurai", "Chennai", "Cuddalore", "Theni"],
  originCity:         "Salem",
  pickupLocation:     "Salem Bus Stand",
  pickupPoint:        "Salem Bus Stand",
  meetingPoint:       "Salem Bus Stand Main Entrance",
  dropPoint:          "Theni Bus Stand",
  intermediateStops:  ["Madurai Meenakshi Temple", "Chennai Marina Beach", "Cuddalore Beach"],
  googleMapsUrl:      "https://maps.google.com/?q=Salem+Bus+Stand",

  duration:              "4 Days / 3 Nights",
  startDate:             "2026-07-10",
  endDate:               "2026-07-13",
  departureTime:         "06:00",
  arrivalTime:           "20:00",
  reportingTime:         "05:30",
  bookingDeadline:       "2026-07-09",
  cancellationDeadline:  "2026-07-09",
  cancellationUntilDate: "2026-07-09",
  cancellationUntilTime: "18:00",

  busType:   "Premium AC Minibus",
  busNumber: "TN-30-AA-1234",
  totalSeats:     20,
  availableSeats: 20,

  driverName:       DRIVER_NAME,
  driverPhone:      "9999988888",
  driverGmail:      DRIVER_EMAIL,
  emergencyContact: "9876543210",

  pricePerPerson:     7999,
  originalPrice:      9500,
  offerPrice:         7999,
  discountPercentage: Math.round(((9500 - 7999) / 9500) * 100),
  gstPercentage:      5,
  convenienceFee:     250,

  mealsIncluded:    ["Breakfast", "Lunch", "Dinner"],
  includedServices: ["Accommodation", "Transport", "Sightseeing"],
  hotelName:        "Premium Stay Collection",
  hotelRating:      3,
  roomType:         "Executive Twin Sharing",

  itinerary: [
    {
      day: 1,
      startLocation: "Salem",
      destination: "Madurai",
      title: "Salem to Madurai Exploration",
      description: "Depart from Salem Bus Stand early in the morning and reach Madurai. Visit the historic Meenakshi Temple, the grand Thirumalai Nayakkar Palace, and the Gandhi Memorial Museum. Overnight stay in Madurai.",
      placesCovered: ["Meenakshi Temple", "Palace", "Museum"],
      activities: ["Temple Visit", "Palace Walkthrough", "Museum Tour"],
      hotelName: "Madurai Grand Palace Hotel",
      nightStay: "Madurai",
      notes: "Please dress conservatively for temple entry.",
      departureTime: "06:00",
      arrivalTime: "11:30",
      duration: "5.5 Hours"
    },
    {
      day: 2,
      startLocation: "Madurai",
      destination: "Chennai",
      title: "Madurai to Chennai Travel & Sightseeing",
      description: "Travel from Madurai to the state capital, Chennai. Visit the world-famous Marina Beach, the historic monuments of Mahabalipuram, and enjoy evening shopping at T-Nagar.",
      placesCovered: ["Marina Beach", "Mahabalipuram", "Shopping"],
      activities: ["Beach Stroll", "Heritage Walk", "Local Shopping"],
      hotelName: "Chennai Coastal Inn",
      nightStay: "Chennai",
      notes: "Keep hydrated during the outdoor beach and heritage visits.",
      departureTime: "07:00",
      arrivalTime: "14:30",
      duration: "7.5 Hours"
    },
    {
      day: 3,
      startLocation: "Chennai",
      destination: "Cuddalore",
      title: "Chennai to Cuddalore Coastline Journey",
      description: "Proceed along the scenic coastline to Cuddalore. Visit Cuddalore beach for relaxing views and explore prominent local heritage temples.",
      placesCovered: ["Beach", "Temple"],
      activities: ["Beach Games", "Historical Temple Exploration"],
      hotelName: "Cuddalore Beach Resort",
      nightStay: "Cuddalore",
      notes: "Enjoy fresh seafood local specialties for dinner.",
      departureTime: "08:00",
      arrivalTime: "12:00",
      duration: "4 Hours"
    },
    {
      day: 4,
      startLocation: "Cuddalore",
      destination: "Theni",
      title: "Cuddalore to Theni Return Route",
      description: "Conclude the tour by traveling from Cuddalore back to Theni. Safe drop-off at Theni Bus Stand. End of happy services.",
      placesCovered: [],
      activities: ["Scenic Drive", "Farewell Gathering"],
      hotelName: "",
      nightStay: "",
      notes: "Ensure all personal belongings are packed before drop-off.",
      departureTime: "08:00",
      arrivalTime: "16:00",
      duration: "8 Hours"
    }
  ],

  hotels: [
    {
      name: "Madurai Grand Palace Hotel",
      category: "3 Star Deluxe",
      address: "12, West Tower Street, Madurai, Tamil Nadu",
      mapsLink: "https://maps.google.com/?q=Meenakshi+Temple+Madurai",
      roomType: "Executive AC Double Room",
      occupancy: 2,
      nightStayCount: 1,
      photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"],
      notes: "Located walking distance from the Meenakshi Temple."
    },
    {
      name: "Chennai Coastal Inn",
      category: "3 Star Premium",
      address: "Marina Beach Road, Triplicane, Chennai",
      mapsLink: "https://maps.google.com/?q=Marina+Beach+Chennai",
      roomType: "Deluxe Twin Sharing Room",
      occupancy: 2,
      nightStayCount: 1,
      photos: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400"],
      notes: "Stunning beach front views from rooms."
    },
    {
      name: "Cuddalore Beach Resort",
      category: "Beach Front Resort",
      address: "Silver Beach Road, Cuddalore, Tamil Nadu",
      mapsLink: "https://maps.google.com/?q=Silver+Beach+Cuddalore",
      roomType: "Resort Cottage",
      occupancy: 2,
      nightStayCount: 1,
      photos: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400"],
      notes: "Access to private beach area."
    }
  ],

  activities: [
    "Meenakshi Amman Temple Tour",
    "Marina Beach Sunset Stroll",
    "Mahabalipuram Shore Temple Walk",
    "Cuddalore Silver Beach Outing",
    "Local Shopping Spree"
  ],

  packingChecklist: [
    "Conservative dress/clothing for temple visits",
    "Sunscreen & sunglasses for beaches",
    "Comfortable walking shoes/sandals",
    "Power bank and camera",
    "Valid government identification card",
    "Personal toiletries & medicines"
  ],

  allowCancellation: true,
  refundPolicy:      "Fully Refundable",
  cancellationPolicy:
    "Full refund if cancelled before 09 July 2026 06:00 PM. No refund after.",
  termsConditions:
    "1. Departure from Salem Bus Stand at 6:00 AM sharp.\n2. Carry government ID.\n3. Respect temple dress codes.\n4. Drop-off is at Theni Bus Stand.",
  exclusions:
    "Personal shopping, temple special entry tickets, personal guide fees.",

  status:          "published",
  publishStatus:   "published",
  publishedAt:     new Date(),
  boardingStatus:  "CLOSED",
  approvalStatus:  "approved",

  bookedSeats:   0,
  maleCount:     0,
  femaleCount:   0,
  childrenCount: 0,
  boardedCount:  0,
  noShowCount:   0,

  isDeleted:  false,
  isFeatured: true,

  coverImage: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=1200&auto=format&fit=crop&q=80",
  gallery: [
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600",
    "https://images.unsplash.com/photo-1621849400072-f554417f744f?w=600"
  ],
};

// Check for duplicate (same agent + same title)
const existing = await AgentTrip.findOne({
  agentId:   agent._id,
  title:     "SALEM TO THENI TOUR",
  isDeleted: { $ne: true },
});

let trip;
if (existing) {
  console.log("⚠️ Matching trip already exists. Updating...");
  trip = await AgentTrip.findByIdAndUpdate(
    existing._id,
    { $set: tripPayload },
    { new: true, runValidators: false }
  );
} else {
  trip = await AgentTrip.create(tripPayload);
  console.log("✅ Trip created:", trip._id);
}

// Push tripId into driver.assignedTrips (dedup)
await Driver.findByIdAndUpdate(driver._id, {
  $addToSet: { assignedTrips: trip._id },
});

console.log("\n" + "=".repeat(64));
console.log("  TRIP SEEDED SUCCESSFULLY");
console.log("=".repeat(64));
console.log("  Trip ID         :", trip._id.toString());
console.log("  Title           :", trip.title);
console.log("  Origin → Dest   :", trip.originCity, "→ Theni");
console.log("  Duration        :", trip.duration);
console.log("  Explore URL     : http://localhost:5173");
console.log("=".repeat(64));

await mongoose.disconnect();
process.exit(0);
