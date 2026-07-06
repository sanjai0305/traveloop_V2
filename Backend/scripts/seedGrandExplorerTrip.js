import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import Agent from "../models/Agent.js";
import AgentTrip from "../models/AgentTrip.js";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/traveloop";
const AGENT_EMAIL = "sanjaim0940r@gmail.com";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.host);

  const agent = await Agent.findOne({ email: AGENT_EMAIL });
  if (!agent) {
    console.error(`❌ Error: Agent with email ${AGENT_EMAIL} not found in the database.`);
    process.exit(1);
  }
  console.log(`Found Agent: ${agent.displayName} (${agent._id})`);

  const tripPayload = {
    agentId: agent._id,
    title: "South India Grand Explorer Circuit",
    subtitle: "SIGE-10D",
    tagline: "Explore Hills, Beaches, Heritage Cities and Spiritual Destinations in one unforgettable journey.",
    shortDescription: "Explore Hills, Beaches, Heritage Cities and Spiritual Destinations in one unforgettable journey.",
    description: "Explore Hills, Beaches, Heritage Cities and Spiritual Destinations in one unforgettable journey. This premium 10-day loop starts and ends at Salem New Bus Stand, taking you across the gorgeous heights of Ooty, the historical streets of Kochi, the land's end at Kanyakumari, the beaches of Thoothukudi, the spiritual vibes of Rameshwaram, and the French architecture of Pondicherry.",
    category: "Group Tour",
    tripType: "Group Tour",

    destinations: ["Ooty", "Kochi", "Kanyakumari", "Thoothukudi", "Rameshwaram", "Pondicherry", "Salem"],
    destination: "Ooty",
    originCity: "Salem",
    pickupLocation: "Salem New Bus Stand",
    pickupPoint: "Salem New Bus Stand",
    meetingPoint: "Salem New Bus Stand Entrance",
    dropPoint: "Salem New Bus Stand",
    intermediateStops: ["Ooty", "Kochi", "Kanyakumari", "Thoothukudi", "Rameshwaram", "Pondicherry"],
    googleMapsUrl: "https://maps.google.com/",

    duration: "10 Days / 9 Nights",
    startDate: "2026-07-15",
    endDate: "2026-07-24",
    departureTime: "05:00 AM",
    returnTime: "09:00 PM",
    arrivalTime: "09:00 PM",
    reportingTime: "04:30 AM",
    deadlineEnabled: true,
    deadlineDate: "2026-07-12",
    deadlineTime: "23:59",
    bookingDeadline: "2026-07-12",
    cancellationDeadline: "2026-07-12",
    cancellationUntilDate: "2026-07-12",
    cancellationUntilTime: "23:59",

    busType: "AC Volvo Sleeper Bus",
    busNumber: "TN-30-EX-9999",
    totalSeats: 40,
    availableSeats: 40,
    bookedSeats: 0,
    amenities: ["WiFi", "USB Charging", "GPS Tracking", "Blankets", "Mineral Water", "Music System", "Recliner Seats", "Air Conditioning"],
    busAmenities: ["WiFi", "USB Charging", "GPS Tracking", "Blankets", "Mineral Water", "Music System", "Recliner Seats", "Air Conditioning"],

    pricePerPerson: 27999,
    originalPrice: 32000,
    offerPrice: 27999,
    discountPercentage: Math.round(((32000 - 27999) / 32000) * 100),
    gstPercentage: 5,
    convenienceFee: 500,

    mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
    includedServices: ["Food", "Accommodation", "Transport", "Sightseeing"],
    foodIncluded: true,
    hotelName: "Le Pondy Resort & Others",
    hotelRating: 4,
    roomType: "Deluxe",

    hotels: [
      {
        name: "Hotel Lake View",
        category: "3 Star",
        address: "Ooty Lake Road, Ooty, Tamil Nadu",
        mapsLink: "https://maps.google.com/",
        roomType: "Deluxe Room",
        occupancy: 2,
        nightStayCount: 2,
        photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"],
        notes: "Scenic lake view rooms in Ooty."
      },
      {
        name: "Abad Plaza",
        category: "3 Star",
        address: "M.G. Road, Kochi, Kerala",
        mapsLink: "https://maps.google.com/",
        roomType: "Executive Room",
        occupancy: 2,
        nightStayCount: 2,
        photos: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400"],
        notes: "Centrally located premium hotel in Kochi."
      },
      {
        name: "Sea View Residency",
        category: "3 Star",
        address: "East Car Street, Kanyakumari, Tamil Nadu",
        mapsLink: "https://maps.google.com/",
        roomType: "Sea View Room",
        occupancy: 2,
        nightStayCount: 1,
        photos: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400"],
        notes: "Close to beach and sunrise views."
      },
      {
        name: "DSF Grand Plaza",
        category: "3 Star",
        address: "Pereira Street, Thoothukudi, Tamil Nadu",
        mapsLink: "https://maps.google.com/",
        roomType: "Deluxe AC Room",
        occupancy: 2,
        nightStayCount: 1,
        photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"],
        notes: "Centrally located grand hotel in Thoothukudi."
      },
      {
        name: "Jiwan Residency",
        category: "3 Star",
        address: "Ramanathapuram Road, Rameshwaram, Tamil Nadu",
        mapsLink: "https://maps.google.com/",
        roomType: "Deluxe Room",
        occupancy: 2,
        nightStayCount: 2,
        photos: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400"],
        notes: "Comfortable stay near Ramanathaswamy Temple."
      },
      {
        name: "Le Pondy Resort",
        category: "4 Star Resort",
        address: "Lake View Road, Puducherry",
        mapsLink: "https://maps.google.com/",
        roomType: "Lake View Villa",
        occupancy: 2,
        nightStayCount: 1,
        photos: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400"],
        notes: "Luxury resort stay in Pondicherry."
      }
    ],

    activities: ["Tea Estate Visit", "Boating", "Fort Kochi Tour", "Temple Darshan", "Beach Walk", "Photography", "Shopping", "Sightseeing", "Cultural Experience", "Sunset Viewing"],
    packingChecklist: ["Government ID", "Camera", "Power Bank", "Umbrella", "Shoes", "Medicines", "Jacket", "Cash", "Water Bottle", "Cap"],

    itinerary: [
      {
        day: 1,
        date: "2026-07-15",
        startLocation: "Salem",
        destination: "Ooty",
        title: "Salem to Ooty Journey",
        description: "Depart from Salem early morning. Arrive Ooty, check in to Hotel Lake View. Visit Tea Estate, Botanical Garden, Rose Garden, and enjoy boating in Ooty Lake.",
        placesCovered: ["Tea Estate", "Botanical Garden", "Rose Garden", "Ooty Lake"],
        activities: ["Tea Estate Visit", "Boating", "Sightseeing"],
        hotelName: "Hotel Lake View",
        nightStay: "Ooty",
        departureTime: "05:00 AM",
        arrivalTime: "11:00 AM",
        duration: "6 Hours"
      },
      {
        day: 2,
        date: "2026-07-16",
        startLocation: "Ooty",
        destination: "Ooty",
        title: "Ooty Local Sightseeing",
        description: "Explore Doddabetta Peak, Pykara Lake, and the local Chocolate Factory. Enjoy scenic views and boating.",
        placesCovered: ["Doddabetta Peak", "Pykara Lake", "Chocolate Factory"],
        activities: ["Boating", "Sightseeing", "Photography"],
        hotelName: "Hotel Lake View",
        nightStay: "Ooty",
        departureTime: "09:00 AM",
        arrivalTime: "06:00 PM",
        duration: "9 Hours"
      },
      {
        day: 3,
        date: "2026-07-17",
        startLocation: "Ooty",
        destination: "Kochi",
        title: "Ooty to Kochi Transit",
        description: "Travel from Ooty to Kochi. Check in to Abad Plaza. Evening walk at Fort Kochi, Chinese Fishing Nets, and Marine Drive.",
        placesCovered: ["Fort Kochi", "Chinese Fishing Nets", "Marine Drive"],
        activities: ["Fort Kochi Tour", "Beach Walk", "Sightseeing"],
        hotelName: "Abad Plaza",
        nightStay: "Kochi",
        departureTime: "08:00 AM",
        arrivalTime: "02:00 PM",
        duration: "6 Hours"
      },
      {
        day: 4,
        date: "2026-07-18",
        startLocation: "Kochi",
        destination: "Kochi",
        title: "Kochi Local Highlights",
        description: "Visit Mattancherry Palace, Jew Street, and Lulu Mall. Enjoy a cultural Kathakali Show in the evening.",
        placesCovered: ["Mattancherry Palace", "Jew Street", "Lulu Mall", "Kathakali Show"],
        activities: ["Cultural Experience", "Sightseeing", "Shopping"],
        hotelName: "Abad Plaza",
        nightStay: "Kochi",
        departureTime: "09:00 AM",
        arrivalTime: "08:00 PM",
        duration: "11 Hours"
      },
      {
        day: 5,
        date: "2026-07-19",
        startLocation: "Kochi",
        destination: "Kanyakumari",
        title: "Kochi to Kanyakumari Coastline Journey",
        description: "Travel to Kanyakumari, check in to Sea View Residency. Visit Vivekananda Rock Memorial and enjoy the Sunset Point.",
        placesCovered: ["Vivekananda Rock", "Sunset Point"],
        activities: ["Sunset Viewing", "Beach Walk", "Sightseeing"],
        hotelName: "Sea View Residency",
        nightStay: "Kanyakumari",
        departureTime: "07:00 AM",
        arrivalTime: "03:00 PM",
        duration: "8 Hours"
      },
      {
        day: 6,
        date: "2026-07-20",
        startLocation: "Kanyakumari",
        destination: "Thoothukudi",
        title: "Kanyakumari to Thoothukudi",
        description: "Travel from Kanyakumari to Thoothukudi. Check in to DSF Grand Plaza. Visit the local harbour and historic churches.",
        placesCovered: ["Thoothukudi Harbour", "Our Lady of Snows Basilica"],
        activities: ["Photography", "Beach Walk", "Sightseeing"],
        hotelName: "DSF Grand Plaza",
        nightStay: "Thoothukudi",
        departureTime: "08:00 AM",
        arrivalTime: "12:00 PM",
        duration: "4 Hours"
      },
      {
        day: 7,
        date: "2026-07-21",
        startLocation: "Thoothukudi",
        destination: "Rameshwaram",
        title: "Thoothukudi to Rameshwaram via Pamban",
        description: "Travel to Rameshwaram crossing the iconic Pamban Bridge. Visit Ramanathaswamy Temple and take a holy dip at Agni Theertham.",
        placesCovered: ["Pamban Bridge", "Ramanathaswamy Temple", "Agni Theertham"],
        activities: ["Temple Darshan", "Photography", "Sightseeing"],
        hotelName: "Jiwan Residency",
        nightStay: "Rameshwaram",
        departureTime: "08:00 AM",
        arrivalTime: "12:30 PM",
        duration: "4.5 Hours"
      },
      {
        day: 8,
        date: "2026-07-22",
        startLocation: "Rameshwaram",
        destination: "Rameshwaram",
        title: "Dhanushkodi Exploration",
        description: "Visit the ghost town of Dhanushkodi, the confluence of oceans, and enjoy photography and sunset view.",
        placesCovered: ["Dhanushkodi", "Dhanushkodi Beach"],
        activities: ["Photography", "Sunset Viewing", "Beach Walk"],
        hotelName: "Jiwan Residency",
        nightStay: "Rameshwaram",
        departureTime: "09:00 AM",
        arrivalTime: "05:00 PM",
        duration: "8 Hours"
      },
      {
        day: 9,
        date: "2026-07-23",
        startLocation: "Rameshwaram",
        destination: "Pondicherry",
        title: "Rameshwaram to Pondicherry Transit",
        description: "Long drive to Pondicherry. Check in to Le Pondy Resort. Stroll along Promenade Beach, explore French Colony and Aurobindo Ashram.",
        placesCovered: ["Promenade Beach", "French Colony", "Aurobindo Ashram"],
        activities: ["Beach Walk", "Shopping", "Sightseeing"],
        hotelName: "Le Pondy Resort",
        nightStay: "Pondicherry",
        departureTime: "06:00 AM",
        arrivalTime: "02:00 PM",
        duration: "8 Hours"
      },
      {
        day: 10,
        date: "2026-07-24",
        startLocation: "Pondicherry",
        destination: "Salem",
        title: "Pondicherry to Salem Return Journey",
        description: "Morning shopping and cafe visits. Depart Pondicherry in the afternoon and return to Salem New Bus Stand by 9:00 PM.",
        placesCovered: ["Puducherry Markets"],
        activities: ["Shopping", "Beach Walk", "Sightseeing"],
        hotelName: "",
        nightStay: "",
        departureTime: "02:00 PM",
        arrivalTime: "09:00 PM",
        duration: "7 Hours"
      }
    ],

    allowCancellation: true,
    refundPolicy: "Partially Refundable",
    cancellationPolicy: "Partially Refundable",
    termsConditions: "1. Carry government ID.\n2. Respect local temple dress codes.\n3. Partially refundable cancellation policy applies.",
    exclusions: "Personal expenses, laundry, and meals/drinks not specified.",

    status: "pending",
    approvalStatus: "pending",
    publishStatus: "pending",
    published: false,
    visible: false,
    publishedAt: null,
    activeStep: 10,
    progressPercentage: 100,

    coverImage: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&auto=format&fit=crop&q=80",
    coverImages: ["https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&auto=format&fit=crop&q=80"],
    mainDestinationBanner: ["https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&auto=format&fit=crop&q=80"],
    gallery: ["https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800", "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800"],
    galleryImages: ["https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800", "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800"],
    isDeleted: false,
    isFeatured: false
  };

  const existingTrip = await AgentTrip.findOne({
    agentId: agent._id,
    title: "South India Grand Explorer Circuit",
    isDeleted: { $ne: true }
  });

  let trip;
  if (existingTrip) {
    console.log("Trip package already exists. Updating existing trip...");
    trip = await AgentTrip.findByIdAndUpdate(
      existingTrip._id,
      { $set: tripPayload },
      { new: true, runValidators: false }
    );
    console.log("✅ Trip updated successfully:", trip._id);
  } else {
    trip = await AgentTrip.create(tripPayload);
    console.log("✅ Trip created successfully:", trip._id);
  }

  // Set the custom audit/ownership fields directly via MongoDB collection update
  // to bypass Mongoose strict schema enforcement without modifying the schema code.
  await AgentTrip.collection.updateOne(
    { _id: trip._id },
    {
      $set: {
        agentEmail: "sanjaim0940r@gmail.com",
        createdBy: "sanjaim0940r@gmail.com",
        createdVia: "agent_portal",
        visibility: "private"
      }
    }
  );
  console.log("✅ Custom audit fields (agentEmail, createdBy, createdVia, visibility) updated directly in DB.");

  // Fetch updated doc to verify
  const finalDoc = await AgentTrip.findById(trip._id).lean();
  console.log("\nSeeded Package Verification:");
  console.log("----------------------------");
  console.log("ID            :", finalDoc._id);
  console.log("Title         :", finalDoc.title);
  console.log("Agent ID      :", finalDoc.agentId);
  console.log("Agent Email   :", finalDoc.agentEmail);
  console.log("Created By    :", finalDoc.createdBy);
  console.log("Created Via   :", finalDoc.createdVia);
  console.log("Status        :", finalDoc.status);
  console.log("ApprovalState :", finalDoc.approvalStatus);
  console.log("Visibility    :", finalDoc.visibility);
  console.log("Duration      :", finalDoc.duration);
  console.log("Start Date    :", finalDoc.startDate);
  console.log("End Date      :", finalDoc.endDate);
  console.log("----------------------------\n");

  await mongoose.disconnect();
  console.log("Database disconnected successfully.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error running seeder script:", err);
  process.exit(1);
});
