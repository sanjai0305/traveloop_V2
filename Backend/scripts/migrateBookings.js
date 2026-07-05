import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import Booking from "../models/Booking.js";

dotenv.config();

const dbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/traveloop";

async function runMigration() {
  try {
    console.log("Connecting to Database:", dbUri);
    await mongoose.connect(dbUri);
    console.log("Database connection successful.");

    const bookings = await Booking.find({});
    console.log(`Found ${bookings.length} bookings to audit.`);

    let updatedCount = 0;

    for (const booking of bookings) {
      let isUpdated = false;

      // 1. Normalize paymentStatus
      let currentPayment = booking.paymentStatus || "";
      let targetPayment = currentPayment.toUpperCase().trim();
      if (!["PENDING", "PAID", "FAILED", "REFUNDED"].includes(targetPayment)) {
        targetPayment = "PENDING";
      }
      if (booking.paymentStatus !== targetPayment) {
        booking.paymentStatus = targetPayment;
        isUpdated = true;
      }

      // 2. Normalize boardingStatus
      let currentBoarding = booking.boardingStatus || "";
      let targetBoarding = currentBoarding.toUpperCase().trim();
      if (targetBoarding === "PENDING" || !["LOCKED", "OPEN", "BOARDED", "CLOSED", "NO_SHOW"].includes(targetBoarding)) {
        targetBoarding = "LOCKED";
      }
      if (booking.boardingStatus !== targetBoarding) {
        booking.boardingStatus = targetBoarding;
        isUpdated = true;
      }

      // 3. Fix empty or duplicate token key
      if (!booking.token || booking.token === "") {
        booking.token = crypto.randomUUID();
        isUpdated = true;
      }

      if (isUpdated) {
        await booking.save();
        updatedCount++;
        console.log(`Updated booking ${booking.bookingId} (${booking._id}): paymentStatus=${booking.paymentStatus}, boardingStatus=${booking.boardingStatus}, token=${booking.token}`);
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} bookings.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
