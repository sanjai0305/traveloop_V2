import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Booking from "../models/Booking.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/traveloop");
    console.log("✅ Connected to MongoDB");

    const bookings = await Booking.find();
    console.log(`Found ${bookings.length} total bookings.`);

    for (const b of bookings) {
      console.log(`Booking ID: ${b._id}, status: ${b.status}, bookingStatus: ${b.bookingStatus}, paymentStatus: ${b.paymentStatus}, token: ${b.token}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
