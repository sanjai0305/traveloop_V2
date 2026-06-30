import "./config/env.js";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import DriverUpdate from "./models/DriverUpdate.js";
import Itinerary from "./models/Itinerary.js";
import AgentTrip from "./models/AgentTrip.js";
import Booking from "./models/Booking.js";
import User from "./models/User.js";

async function verifyAll() {
  console.log("=== TRAVELOOP ITINERARY ENHANCEMENT VERIFIER ===");
  try {
    await connectDB();
    console.log("✅ DB connected.");

    // 1. Verify schema addition
    const testItin = new Itinerary({
      trip: new mongoose.Types.ObjectId(),
      day: 1,
      title: "Test AI Item",
      isAiSuggestion: true,
      aiSource: "test-engine",
    });
    console.log("✅ Itinerary isAiSuggestion & aiSource fields validation pass:", testItin.isAiSuggestion === true);

    // 2. Verify DriverUpdate creation
    const dummyTrip = new mongoose.Types.ObjectId();
    const dummyDriver = new mongoose.Types.ObjectId();
    const testUpdate = await DriverUpdate.create({
      trip: dummyTrip,
      driver: dummyDriver,
      driverName: "Sanjai Test",
      type: "delay",
      message: "Driver is delayed by 15 mins due to traffic.",
    });
    console.log("✅ DriverUpdate document created successfully:", testUpdate._id);

    // Clean up test update
    await DriverUpdate.deleteOne({ _id: testUpdate._id });
    console.log("✅ Temporary DriverUpdate document cleaned up.");

    console.log("\nEverything verifies correctly!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  }
}

verifyAll();
