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

    // Find bookings where token contains base64 (i.e. starts with ey)
    const bookings = await Booking.find({ token: { $regex: /^ey/ } });
    console.log(`Found ${bookings.length} bookings with a generated QR token.`);

    for (const b of bookings) {
      console.log(`\nBooking ID: ${b._id}`);
      console.log(`Token: ${b.token}`);
      try {
        const decodedText = Buffer.from(b.token, "base64").toString("utf-8");
        const decoded = JSON.parse(decodedText);
        console.log("Decoded successfully:", decoded);
      } catch (err) {
        console.log("❌ Failed to decode token:", err.message);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
