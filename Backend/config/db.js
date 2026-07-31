import "./env.js";
import mongoose from "mongoose";
import BusType from "../models/BusType.js";
import BusAmenity from "../models/BusAmenity.js";
import HotelAmenity from "../models/HotelAmenity.js";
import TripActivity from "../models/TripActivity.js";

export const connectDB = async () => {
  try {
    console.log(
      "[MongoDB Init] URI:",
      process.env.MONGODB_URI
        ? process.env.MONGODB_URI.replace(/\/\/.*@/, "//***@")
        : "MISSING"
    );

    const mongoUri = process.env.MONGODB_URI?.trim();

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing from environment variables");
    }

    if (
      !mongoUri.startsWith("mongodb://") &&
      !mongoUri.startsWith("mongodb+srv://")
    ) {
      throw new Error(
        `Invalid MONGODB_URI scheme. Expected mongodb:// or mongodb+srv://`
      );
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected`);

    // Seed master data if empty
    const seedIfEmpty = async (Model, defaults) => {
      try {
        const count = await Model.countDocuments();
        if (count === 0) {
          await Model.insertMany(defaults.map(name => ({ name })));
          console.log(`Seeded default values for ${Model.modelName}`);
        }
      } catch (seedErr) {
        console.warn(`[Seed Warning] Failed to seed master data for ${Model.modelName}:`, seedErr.message);
      }
    };

    await seedIfEmpty(BusType, ["AC Sleeper", "Semi Sleeper", "Volvo", "Mini Bus", "Tempo Traveller"]);
    await seedIfEmpty(BusAmenity, ["WiFi", "Charging", "Blanket", "Water Bottle", "Recliner Seats", "TV", "Snacks", "USB Port", "Reading Light"]);
    await seedIfEmpty(HotelAmenity, ["Swimming Pool", "WiFi", "Gym", "Breakfast", "Parking", "Spa", "Jacuzzi", "Kids Zone", "Conference Hall", "Private Beach", "Pool Bar"]);
    await seedIfEmpty(TripActivity, [
      "Beach Visit", "Cruise", "Temple Visit", "Shopping", "Safari", "Campfire",
      "Adventure Sports", "Trekking", "Boating", "Museum", "Night Party",
      "Scuba Diving", "ATV Ride", "Zipline", "Kayaking"
    ]);

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
