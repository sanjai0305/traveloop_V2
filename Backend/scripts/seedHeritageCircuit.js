/**
 * seedHeritageCircuit.js
 *
 * Creates the "South Tamil Nadu Heritage Circuit" trip package assigned to agent:
 *   sanjaim0940r@gmail.com
 *
 * Run from Backend/ directory:
 *   node scripts/seedHeritageCircuit.js
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
const DRIVER_EMAIL = "driver@traveloop.com";
const DRIVER_NAME  = "Karthik Raj";

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
    gstNo: "33AABCU9603R1ZV",
    businessCategory: "Travel Agency",
    address: "No 12, Salem Main Road",
    city: "Salem",
    state: "Tamil Nadu",
    country: "India",
    mobile: "9876543210",
    dob: "1990-01-01",
    profileCompleted: true,
    emailVerified: true,
    mobileVerified: true,
    kycStatus: "KYC_COMPLETED",
    status: "approved",
  });
}

// 2. Find Driver
let driver = await Driver.findOne({ email: DRIVER_EMAIL });
if (!driver) {
  driver = await Driver.create({
    name:             DRIVER_NAME,
    email:            DRIVER_EMAIL,
    phone:            "9876543210",
    licenseNumber:    "TN202645789",
    vehicleNumber:    "TN66AB1234",
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

  title:            "South Tamil Nadu Heritage Circuit",
  subtitle:         "4D/3N Temple & Coastal Escape",
  tagline:          "Experience the spiritual, cultural and coastal beauty of Tamil Nadu.",
  shortDescription: "Experience the spiritual, cultural and coastal beauty of Tamil Nadu.",
  description:
    "Experience the spiritual, cultural and coastal beauty of Tamil Nadu. " +
    "Starting from Salem New Bus Stand, this circuit takes you to the magnificent " +
    "Meenakshi Temple in Madurai, the lively Marina Beach and heritage monuments in Chennai, " +
    "the tranquil Silver Beach in Cuddalore, and concludes with a drop at Theni.",
  category: "Pilgrimage Family Tour",
  tripType: "Pilgrimage Family Tour",

  destinations:       ["Madurai", "Chennai", "Cuddalore", "Theni"],
  originCity:         "Salem",
  pickupLocation:     "Salem New Bus Stand",
  pickupPoint:        "Salem New Bus Stand",
  meetingPoint:       "Salem New Bus Stand Entrance",
  pickupMapsLink:     "https://maps.google.com/",
  dropPoint:          "Theni Bus Stand",
  dropMapsLink:       "https://maps.google.com/",
  googleMapsUrl:      "https://maps.google.com/",

  duration:              "4 Days / 3 Nights",
  startDate:             "2026-08-20",
  endDate:               "2026-08-23",
  departureTime:         "06:00 AM",
  returnTime:            "08:00 PM",
  arrivalTime:           "08:00 PM",
  reportingTime:         "05:30 AM",
  deadlineEnabled:       true,
  deadlineDate:          "2026-08-18",
  deadlineTime:          "23:59",
  bookingDeadline:       "2026-08-18",

  busType:   "AC Sleeper Bus",
  busNumber: "TN66AB1234",
  totalSeats:     40,
  availableSeats: 40,

  driverName:       DRIVER_NAME,
  driverPhone:      "9876543210",
  driverGmail:      DRIVER_EMAIL,
  emergencyContact: "9876543210",

  pricePerPerson:     4500,
  originalPrice:      6000,
  offerPrice:         4500,
  discountPercentage: Math.round(((6000 - 4500) / 6000) * 100),
  gstPercentage:      5,
  convenienceFee:     150,

  mealsIncluded:    ["Breakfast", "Dinner"],
  includedServices: ["Accommodation", "Transport", "Sightseeing"],
  hotelName:        "Temple Residency",
  hotelRating:      3,
  roomType:         "Deluxe",

  itinerary: [
    {
      day: 1,
      date: "2026-08-20",
      startLocation: "Salem",
      destination: "Madurai",
      title: "Salem to Madurai Exploration",
      description: "Depart from Salem early morning to reach Madurai. Visit the legendary Meenakshi Temple, Thirumalai Nayakkar Mahal and Gandhi Museum.",
      placesCovered: ["Meenakshi Temple", "Thirumalai Nayakkar Mahal", "Gandhi Museum"],
      activities: ["Temple Visit", "Photography", "Sightseeing"],
      hotelName: "Hotel Temple Residency",
      nightStay: "Madurai",
      notes: "Food arrangements are self-managed.",
      departureTime: "06:00 AM",
      arrivalTime: "10:00 AM",
      duration: "4 Hours"
    },
    {
      day: 2,
      date: "2026-08-21",
      startLocation: "Madurai",
      destination: "Chennai",
      title: "Madurai to Chennai Coastal Travel",
      description: "Travel to Chennai. Visit Marina Beach, Mahabalipuram, Government Museum and enjoy local shopping.",
      placesCovered: ["Marina Beach", "Mahabalipuram", "Government Museum", "Shopping"],
      activities: ["Beach Visit", "Photography", "Shopping"],
      hotelName: "Chennai Grand Residency",
      nightStay: "Chennai",
      departureTime: "08:00 AM",
      arrivalTime: "02:00 PM",
      duration: "6 Hours"
    },
    {
      day: 3,
      date: "2026-08-22",
      startLocation: "Chennai",
      destination: "Cuddalore",
      title: "Chennai to Cuddalore Coastline Journey",
      description: "Travel to Cuddalore. Explore the tranquil Silver Beach, Padaleeswarar Temple and Fort St David.",
      placesCovered: ["Silver Beach", "Padaleeswarar Temple", "Fort St David"],
      activities: ["Beach Visit", "Temple Visit", "Relaxation"],
      hotelName: "Beach View Residency",
      nightStay: "Cuddalore",
      departureTime: "09:00 AM",
      arrivalTime: "01:00 PM",
      duration: "4 Hours"
    },
    {
      day: 4,
      date: "2026-08-23",
      startLocation: "Cuddalore",
      destination: "Theni",
      title: "Cuddalore to Theni Return Route",
      description: "Travel from Cuddalore to Theni. Safe drop-off at Theni Bus Stand. End of heritage services.",
      placesCovered: [],
      activities: ["Return Journey", "Sightseeing"],
      hotelName: "",
      nightStay: "",
      departureTime: "09:00 AM",
      arrivalTime: "08:00 PM",
      duration: "11 Hours"
    }
  ],

  hotels: [
    {
      name: "Temple Residency",
      category: "3 Star",
      address: "Madurai Temple Road, Tamil Nadu",
      mapsLink: "https://maps.google.com/",
      roomType: "Deluxe",
      occupancy: 2,
      nightStayCount: 1,
      photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"],
      notes: "Deluxe double sharing room near temple."
    },
    {
      name: "Grand Residency",
      category: "3 Star",
      address: "Chennai City Centre, Tamil Nadu",
      mapsLink: "https://maps.google.com/",
      roomType: "Premium",
      occupancy: 2,
      nightStayCount: 1,
      photos: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400"],
      notes: "Premium accommodations."
    },
    {
      name: "Beach View Residency",
      category: "3 Star",
      address: "Silver Beach, Cuddalore, Tamil Nadu",
      mapsLink: "https://maps.google.com/",
      roomType: "Deluxe",
      occupancy: 2,
      nightStayCount: 1,
      photos: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400"],
      notes: "Stunning beach front views."
    }
  ],

  activities: [
    "Temple Visit",
    "Photography",
    "Shopping",
    "Beach Walk",
    "Sightseeing",
    "Relaxation"
  ],

  packingChecklist: [
    "Power Bank",
    "Umbrella",
    "Medicines",
    "Shoes",
    "Water Bottle",
    "Camera",
    "ID Proof",
    "Cash",
    "Mobile Charger",
    "Sunglasses"
  ],

  amenities: [
    "AC",
    "WiFi",
    "Charging Port",
    "Blanket",
    "TV",
    "GPS Tracking",
    "Pushback Seats",
    "Music System",
    "Water Bottle",
    "Emergency Kit",
    "First Aid"
  ],
  busAmenities: [
    "AC",
    "WiFi",
    "Charging Port",
    "Blanket",
    "TV",
    "GPS Tracking",
    "Pushback Seats",
    "Music System",
    "Water Bottle",
    "Emergency Kit",
    "First Aid"
  ],

  allowCancellation: true,
  refundPolicy:      "Fully Refundable",
  cancellationPolicy:
    "Fully Refundable",
  termsConditions:
    "1. Departure from Salem New Bus Stand at 06:00 AM sharp.\n2. Carry government ID proof.\n3. Drop-off is at Theni Bus Stand.",
  exclusions:
    "Personal purchases, self-managed food on Day 1.",

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
  coverImages: [
    "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=1200&auto=format&fit=crop&q=80"
  ],
  mainDestinationBanner: [
    "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=1200&auto=format&fit=crop&q=80"
  ],
  gallery: [
    "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800",
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800"
  ],
  galleryImages: [
    "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800",
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800"
  ],
};

// Check for duplicate (same agent + same title)
const existing = await AgentTrip.findOne({
  agentId:   agent._id,
  title:     "South Tamil Nadu Heritage Circuit",
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
console.log("  HERITAGE CIRCUIT TRIP SEEDED SUCCESSFULLY");
console.log("=".repeat(64));
console.log("  Trip ID         :", trip._id.toString());
console.log("  Title           :", trip.title);
console.log("  Origin → Dest   :", trip.originCity, "→ Theni");
console.log("  Duration        :", trip.duration);
console.log("  Explore URL     : http://localhost:5173");
console.log("=".repeat(64));

await mongoose.disconnect();
process.exit(0);
