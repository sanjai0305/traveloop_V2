import crypto from "crypto";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import AgentTrip from "../models/AgentTrip.js";
import { addSyncJob } from "../config/bullmq.js";
import { setCache, getCache } from "./cacheService.js";

export class PaymentService {
  /** Create a payment lock on a booking in Redis to prevent double booking */
  static async lockPayment(bookingId, ttlSeconds = 900) {
    const lockKey = `booking:payment:${bookingId}`;
    try {
      // Set payment lock
      await setCache(lockKey, "LOCKED", ttlSeconds);
      console.log(`[Payment Lock] Set lock for booking ${bookingId}`);
      return true;
    } catch (err) {
      console.error(`[Payment Lock Error] Failed to set lock for booking ${bookingId}:`, err.message);
      return false;
    }
  }

  /** Release payment lock after success or cancel */
  static async unlockPayment(bookingId) {
    const lockKey = `booking:payment:${bookingId}`;
    try {
      // Check cacheService import for delCache
      const { delCache } = await import("./cacheService.js");
      await delCache(lockKey);
      console.log(`[Payment Lock] Released lock for booking ${bookingId}`);
    } catch (err) {
      console.error(`[Payment Lock Error] Failed to release lock for booking ${bookingId}:`, err.message);
    }
  }

  /** Check if booking has an active payment lock */
  static async isPaymentLocked(bookingId) {
    const lockKey = `booking:payment:${bookingId}`;
    try {
      const lock = await getCache(lockKey);
      return lock === "LOCKED";
    } catch (err) {
      console.error(`[Payment Lock Error] Failed to verify lock for booking ${bookingId}:`, err.message);
      return false;
    }
  }

  /** Generate dynamic QR code link using open source API and UPI payment URI schemas */
  static async generateQR(bookingId, amount, tripId, userId) {
    const upiMerchantId = process.env.UPI_MERCHANT_ID || "travelloop@okaxis";
    const merchantName = process.env.UPI_MERCHANT_NAME || "TravelLoop Merchant";
    
    // Generate UPI Payment URI Scheme (RFC compliant)
    const transactionId = `TXN${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
    const upiLink = `upi://pay?pa=${upiMerchantId}&pn=${encodeURIComponent(merchantName)}&tr=${transactionId}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Booking ${bookingId}`)}`;
    
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    // Save temporary transaction metadata to Redis for status polling verification
    const txnMeta = {
      bookingId,
      amount,
      tripId,
      userId,
      transactionId,
      status: "PENDING",
      expiresAt,
    };
    await setCache(`payment:qr:${bookingId}`, txnMeta, 600); // 10 minutes cache

    return {
      qrImage,
      upiLink,
      upiId: upiMerchantId,
      transactionId,
      expiresAt,
    };
  }

  /** Mock verification logic for collect flows / QR payments */
  static async confirmManualPayment(bookingId, paymentMethod = "upi_qr", transactionId, upiReference = "") {
    // Fetch active lock
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    const trip = await AgentTrip.findById(booking.tripId);
    if (!trip) throw new Error("Trip not found");

    // Clear seat lock
    const { BookingLockService } = await import("./bookingLockService.js");
    await BookingLockService.releaseSeats(booking.tripId, booking.seatNumbers);

    // Update payment status
    booking.paymentStatus = "PAID";
    booking.status = "Paid";
    booking.bookingStatus = "confirmed";
    booking.paymentVerified = true;
    booking.paymentDate = new Date();
    await booking.save();

    // Create payment ledger record
    const payment = await Payment.create({
      bookingId: booking._id,
      bookingRef: booking.bookingId,
      tripId: booking.tripId,
      userId: booking.userId,
      amount: booking.pricePaid,
      paymentMethod,
      gateway: "manual",
      status: "PAID",
      transactionId: transactionId || `TXN_MAN_${Date.now()}`,
      upiReference,
    });

    // Remove lock
    await this.unlockPayment(bookingId);

    // Enqueue sync job to update Neo4j
    await addSyncJob("BOOKING_SYNC", {
      userId: booking.userId,
      tripId: booking.tripId,
      bookingId: booking.bookingId,
      seatNumbers: booking.seatNumbers,
      pricePaid: booking.pricePaid,
      paymentStatus: "PAID",
    });

    return { booking, payment };
  }
}

export default PaymentService;
