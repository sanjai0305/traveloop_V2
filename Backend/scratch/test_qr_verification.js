import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Booking from "../models/Booking.js";
import AgentTrip from "../models/AgentTrip.js";

const generateQrSignature = (payload, secret) => {
  const dataToSign = `${payload.bookingId}|${payload.tripId}|${payload.passengerId}|${payload.seatNumber}|${payload.issuedAt}|${payload.expiresAt}`;
  return crypto.createHmac("sha256", secret).update(dataToSign).digest("hex");
};

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/traveloop");
    console.log("✅ Connected to MongoDB");

    // Find any booking
    const booking = await Booking.findOne();
    if (!booking) {
      console.log("❌ No booking found in database to test!");
      return;
    }

    const trip = await AgentTrip.findById(booking.tripId);
    if (!trip) {
      console.log("❌ No trip found for booking!");
      return;
    }

    const qrSecret = process.env.DRIVER_QR_SECRET || process.env.JWT_SECRET || "super_secret_jwt_key_for_local_development_traveloop";

    const payload = {
      bookingId: booking._id.toString(),
      tripId: trip._id.toString(),
      passengerId: booking.userId ? booking.userId.toString() : "USR_001",
      seatNumber: booking.assignedSeat || booking.seatNumbers?.[0] || "Waiting Assignment",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    };

    const signature = generateQrSignature(payload, qrSecret);
    const fullPayload = { ...payload, signature };
    const qrToken = Buffer.from(JSON.stringify(fullPayload)).toString("base64");

    console.log("\n--- GENERATED QR PAYLOAD ---");
    console.log(payload);
    console.log("Signature:", signature);
    console.log("QR Token (Base64):", qrToken);

    // DECODE & VERIFY
    const decodedText = Buffer.from(qrToken, "base64").toString("utf-8");
    const decoded = JSON.parse(decodedText);

    const { signature: decodedSig, ...payloadWithoutSignature } = decoded;
    const expectedSignature = generateQrSignature(payloadWithoutSignature, qrSecret);
    const valid = decodedSig === expectedSignature;

    console.log("\n--- DECODED & VERIFIED ---");
    console.log("Decoded Payload:", payloadWithoutSignature);
    console.log("Decoded Signature:", decodedSig);
    console.log("Expected Signature:", expectedSignature);
    console.log("Is Match:", valid ? "✅ YES" : "❌ NO");

  } catch (err) {
    console.error("Error running test:", err);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
