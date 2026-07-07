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
import User from "../models/User.js";

const generateQrSignature = (payload, secret) => {
  const dataToSign = `${payload.bookingId}|${payload.tripId}|${payload.passengerId}|${payload.seatNumber}|${payload.issuedAt}|${payload.expiresAt}`;
  return crypto.createHmac("sha256", secret).update(dataToSign).digest("hex");
};

async function testDriverQrScan() {
  console.log("Starting Driver QR Scan validation flow test...");

  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/traveloop");
    console.log("✅ MongoDB Connected");

    // Fetch existing models to work with
    let booking = await Booking.findOne();
    if (!booking) {
      console.log("❌ Test requires at least one booking in database.");
      return;
    }

    let trip = await AgentTrip.findById(booking.tripId);
    let passenger = await User.findById(booking.userId);

    if (!trip || !passenger) {
      console.log("❌ Test requires populate-ready Trip and Passenger refs.");
      return;
    }

    const qrSecret = (process.env.DRIVER_QR_SECRET && process.env.DRIVER_QR_SECRET.trim()) || 
                    (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) || 
                    "super_secret_jwt_key_for_local_development_traveloop";

    const payload = {
      bookingId: booking._id.toString(),
      tripId: trip._id.toString(),
      passengerId: passenger._id.toString(),
      seatNumber: booking.assignedSeat || booking.seatNumbers?.[0] || "A1",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    const signature = generateQrSignature(payload, qrSecret);
    const fullPayload = { ...payload, signature };
    const qrToken = Buffer.from(JSON.stringify(fullPayload)).toString("base64");

    // Let's run simulated validation function matching backend logic
    async function simulateValidation(mockBooking, mockTrip, mockUser, tokenToVerify) {
      // 1. Decodes QR token
      let decoded;
      try {
        const decodedText = Buffer.from(decodeURIComponent(tokenToVerify.trim()), "base64").toString("utf-8");
        decoded = JSON.parse(decodedText);
      } catch (err) {
        return { success: false, code: "QR_TAMPERED", message: "QR Tampered" };
      }

      // 2. Validate Signature
      const { signature: decodedSig, ...payloadWithoutSignature } = decoded;
      const expectedSignature = generateQrSignature(payloadWithoutSignature, qrSecret);
      const valid = decodedSig === expectedSignature;

      if (!valid) {
        return { success: false, code: "QR_TAMPERED", message: "QR Tampered" };
      }

      if (Date.now() > decoded.expiresAt) {
        return { success: false, code: "QR_EXPIRED", message: "QR Expired" };
      }

      // Validate references
      if (!mockUser) {
        return { success: false, code: "QR_TAMPERED", message: "Passenger Not Found" };
      }
      if (!mockTrip) {
        return { success: false, code: "QR_TAMPERED", message: "Trip Not Found" };
      }

      // Status checks
      const bStatusLower = (mockBooking.bookingStatus || mockBooking.status || "").toLowerCase();
      const pStatusLower = (mockBooking.paymentStatus || "").toLowerCase();

      if (bStatusLower === "cancelled" || pStatusLower === "cancelled") {
        return { success: false, code: "BOOKING_CANCELLED", message: "Booking Cancelled" };
      }

      if (bStatusLower !== "confirmed") {
        return { success: false, code: "QR_TAMPERED", message: "Booking Status Not Confirmed" };
      }

      if (mockTrip.approvalStatus !== "approved") {
        return { success: false, code: "QR_TAMPERED", message: "Trip Not Approved" };
      }

      if (pStatusLower !== "paid" && pStatusLower !== "confirmed" && pStatusLower !== "completed") {
        return { success: false, code: "PAYMENT_PENDING", message: "Payment Pending" };
      }

      const seatVal = decoded.seatNumber || mockBooking.assignedSeat || mockBooking.seatNumbers?.[0];
      if (!seatVal || seatVal === "Waiting Assignment" || seatVal === "Waiting For Driver Assignment") {
        return { success: false, code: "SEAT_NOT_ASSIGNED", message: "Seat Not Assigned" };
      }

      return { success: true, message: "Valid Pass!" };
    }

    // Test Case 1: All Approved and Confirmed
    trip.approvalStatus = "approved";
    booking.bookingStatus = "confirmed";
    booking.paymentStatus = "PAID";
    booking.assignedSeat = "A1";

    let result = await simulateValidation(booking, trip, passenger, qrToken);
    console.log("Test Case 1 (Perfect Data) Result:", result);

    // Test Case 2: Trip Unapproved
    trip.approvalStatus = "pending";
    result = await simulateValidation(booking, trip, passenger, qrToken);
    console.log("Test Case 2 (Trip Unapproved) Result:", result);

    // Test Case 3: Booking Unconfirmed
    trip.approvalStatus = "approved";
    booking.bookingStatus = "pending";
    result = await simulateValidation(booking, trip, passenger, qrToken);
    console.log("Test Case 3 (Booking Unconfirmed) Result:", result);

    // Test Case 4: Payment Pending
    booking.bookingStatus = "confirmed";
    booking.paymentStatus = "PENDING";
    result = await simulateValidation(booking, trip, passenger, qrToken);
    console.log("Test Case 4 (Payment Pending) Result:", result);

  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

testDriverQrScan();
