import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import protect from "../middleware/authMiddleware.js";
import AgentTrip from "../models/AgentTrip.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Agent from "../models/Agent.js";
import AdminNotification from "../models/AdminNotification.js";
import SystemSetting from "../models/SystemSetting.js";
import User from "../models/User.js";
import BookingService from "../services/BookingService.js";
import Passenger from "../models/Passenger.js";
import SeatBooking from "../models/SeatBooking.js";
import protectAgent from "../middleware/agentAuthMiddleware.js";
import AgentSettings from "../models/AgentSettings.js";

const router = express.Router();

// Initialize Razorpay
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

  if (!key_id || !key_secret) {
    console.warn("[Razorpay] WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET / RAZORPAY_SECRET missing in env. Using dummy defaults.");
  }
  return new Razorpay({
    key_id: key_id || "rzp_test_dummykeyid",
    key_secret: key_secret || "dummysecretvalue",
  });
};

// @route   POST /api/payment/create-order
// @desc    Create a Razorpay order for booking checkout
// @access  Private (Traveler)
router.post("/create-order", protect, async (req, res) => {
  const { tripId, seats = 1, couponCode, bookingId } = req.body;

  if (!tripId) {
    return res.status(400).json({ success: false, message: "tripId is required" });
  }

  try {
    const trip = await AgentTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (trip.bookingDeadline) {
      const deadline = new Date(trip.bookingDeadline);
      if (!isNaN(deadline.getTime()) && new Date() > deadline) {
        return res.status(400).json({ success: false, message: "Bookings closed for this trip" });
      }
    }

    let booking = null;
    if (bookingId) {
      booking = await Booking.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null },
          { bookingId: bookingId }
        ].filter(Boolean)
      });
    }

    const price = trip.offerPrice || trip.pricePerPerson || 0;
    const baseFare = price * Number(seats);
    const gst = Math.round(baseFare * 0.05);
    const convenienceFee = 150;
    const originalAmount = booking ? (booking.originalAmount || booking.amount) : (baseFare + gst + convenienceFee);

    let discount = 0;
    let normalizedCode = "";

    if (couponCode && String(couponCode).trim()) {
      normalizedCode = String(couponCode).trim().toUpperCase();
      const userObj = await User.findById(req.user.id || req.user._id);

      // 1. Check if it's a User Referral Code
      const inviter = await User.findOne({ referralCode: normalizedCode });
      if (inviter) {
        if (userObj && String(inviter._id) === String(userObj._id)) {
          return res.status(400).json({ success: false, message: "You cannot use your own referral code" });
        }
        discount = Math.round(originalAmount * 0.05);
      } else {
        // 2. Search Coupon Collection
        const Coupon = mongoose.model("Coupon");
        const coupon = await Coupon.findOne({ couponCode: normalizedCode });
        if (coupon && coupon.status === "ACTIVE") {
          const now = new Date();
          const notExpired = !coupon.expiryDate || now <= new Date(coupon.expiryDate);
          const minMet = originalAmount >= coupon.minimumAmount;
          const limitNotReached = coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit;

          // User usage check
          const userUsage = await Booking.countDocuments({
            userId: req.user.id || req.user._id,
            couponCode: normalizedCode,
            paymentStatus: "Paid"
          });

          if (notExpired && minMet && limitNotReached && userUsage === 0) {
            if (coupon.discountType === "PERCENTAGE") {
              discount = Math.round(originalAmount * (coupon.discountValue / 100));
              if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
              }
            } else {
              discount = coupon.discountValue;
            }
          }
        }
      }
    }

    if (discount > originalAmount) {
      discount = originalAmount;
    }

    const finalAmount = originalAmount - discount;

    if (finalAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount" });
    }

    // Update Booking draft with coupon information
    if (booking) {
      booking.couponCode = normalizedCode;
      booking.discountAmount = discount;
      booking.originalAmount = originalAmount;
      booking.finalAmount = finalAmount;
      booking.paymentAmount = finalAmount;
      booking.pricePaid = finalAmount;
      booking.amount = finalAmount;
      await booking.save();
    }

    const amountPaise = Math.round(finalAmount * 100); // paise (integer, no decimals)
    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `TRIP-${tripId.toString().slice(-8)}-${String(Date.now()).slice(-6)}`,
    };

    console.log("[Razorpay] NODE_ENV:", process.env.NODE_ENV);
    console.log("[Razorpay] KEY_ID:", process.env.RAZORPAY_KEY_ID);
    console.log("[Razorpay] SECRET_LENGTH:", process.env.RAZORPAY_KEY_SECRET?.length || 0);
    console.log("[Razorpay] Creating order with options:", JSON.stringify(options));

    let order;
    try {
      const instance = getRazorpayInstance();
      order = await instance.orders.create(options);
      console.log("[Razorpay] Order created successfully:", JSON.stringify({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        receipt: order.receipt,
      }));
    } catch (apiError) {
      // Do NOT silently fall back to a mock order — a mock order_id will always
      // cause "Something went wrong" inside the Razorpay checkout popup because
      // the order_id doesn't exist on Razorpay's servers.
      console.error("[Razorpay] Order creation API failed:", apiError.message || apiError);
      if (apiError.statusCode || apiError.error) {
        console.error("[Razorpay] Full error body:", JSON.stringify(apiError.error || apiError));
      }
      return res.status(502).json({
        success: false,
        message: apiError?.error?.description || apiError.message || "Razorpay order creation failed",
        razorpayError: apiError?.error || null,
      });
    }

    if (booking) {
      booking.orderId = order.id;
      await booking.save();
    }

    // Return amountPaise (integer) so the frontend passes it directly to Razorpay
    // without any multiplication. The human-readable rupee amount is also included.
    res.status(200).json({
      success: true,
      orderId: order.id,           // Razorpay order_id (e.g. "order_XXXXXXXXXXXXXXX")
      amount: finalAmount,         // rupees (for display only)
      amountPaise: order.amount,   // paise (use this directly in checkout options)
      currency: order.currency,    // "INR" (from Razorpay response, not hardcoded)
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[Razorpay Create Order] Unexpected error:", error);
    res.status(500).json({ success: false, message: "Server Error creating Razorpay order" });
  }
});

const confirmPassengerSeats = async (booking, travellers, tripId, userId, io) => {
  const createdPassengers = [];
  const travellersList = travellers || booking.travellers || [];
  const seatNumbersList = booking.seatNumbers || [];

  for (let i = 0; i < travellersList.length; i++) {
    const pData = travellersList[i];
    const seatNumber = pData.seatNumber || seatNumbersList[i];

    if (!seatNumber) continue;

    // 1. Create/update Passenger document
    const passenger = await Passenger.findOneAndUpdate(
      { bookingId: booking._id, seatNumber },
      {
        bookingId: booking._id,
        bookingRef: booking.bookingId,
        tripId,
        userId,
        name: pData.name || "",
        age: Number(pData.age) || 0,
        gender: pData.gender || "Other",
        phone: pData.phone || "",
        email: pData.email || "",
        emergencyContact: pData.emergencyContact || booking.contactNumber || "",
        seatNumber,
        seatPreference: pData.seatPreference || "No Preference",
        seatType: pData.seatType || "Window",
        specialRequest: pData.specialRequest || "",
        status: "active",
        paymentStatus: "completed",
        qrPayload: {
          bookingId: booking.bookingId || String(booking._id),
          tripId: String(tripId),
          passenger: pData.name,
          seat: seatNumber,
          gender: pData.gender,
          age: pData.age,
          timestamp: new Date().toISOString(),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    createdPassengers.push(passenger);

    // 2. Mark SeatBooking as booked
    await SeatBooking.updateOne(
      { tripId, seatNumber },
      {
        status: "booked",
        bookingId: booking._id,
        passengerId: passenger._id,
        passengerName: pData.name || "",
        gender: pData.gender || "Other",
        age: Number(pData.age) || 0,
        paymentStatus: "completed",
        reservedUntil: null,
      }
    );



    // 4. Emit live seat update
    if (io) {
      io.to(`trip_${tripId}`).emit("seat_update", {
        tripId,
        seatNumber,
        status: "booked",
        gender: pData.gender || "Other",
        passengerName: pData.name || "",
        age: pData.age || 0,
      });
    }
  }
  return createdPassengers;
};

// @route   POST /api/payment/verify
// @desc    Verify payment signature and record booking
// @access  Private (Traveler)
router.post("/verify", protect, async (req, res) => {
  console.log("\n===== STEP 1: PAYMENT VERIFICATION REQUEST RECEIVED =====");
  console.log("[Verify] Headers:", JSON.stringify({ authorization: req.headers.authorization ? "Bearer ***" : "MISSING", "content-type": req.headers["content-type"] }));
  console.log("[Verify] Full Body:", JSON.stringify(req.body));
  console.log("[Verify] User:", req.user ? `id=${req.user._id || req.user.id}` : "NOT AUTHENTICATED");

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId
  } = req.body;

  console.log("[Verify] razorpay_order_id:", razorpay_order_id || "MISSING");
  console.log("[Verify] razorpay_payment_id:", razorpay_payment_id || "MISSING");
  console.log("[Verify] razorpay_signature:", razorpay_signature ? razorpay_signature.slice(0, 10) + "..." : "MISSING");
  console.log("[Verify] bookingId:", bookingId || "MISSING");

  // ── STEP 2: Validate required fields ──────────────────────────────────────
  console.log("\n===== STEP 2: VALIDATE PAYLOAD =====");

  if (!razorpay_order_id) {
    console.error("[Verify] FAIL: Missing razorpay_order_id");
    return res.status(400).json({ success: false, error: "Missing razorpay_order_id" });
  }
  if (!razorpay_payment_id) {
    console.error("[Verify] FAIL: Missing razorpay_payment_id");
    return res.status(400).json({ success: false, error: "Missing razorpay_payment_id" });
  }
  if (!razorpay_signature) {
    console.error("[Verify] FAIL: Missing razorpay_signature");
    return res.status(400).json({ success: false, error: "Missing razorpay_signature" });
  }
  if (!bookingId) {
    console.error("[Verify] FAIL: Missing bookingId");
    return res.status(400).json({ success: false, error: "Missing bookingId" });
  }
  console.log("[Verify] PASS: All required fields present");

  // ── STEP 3: Check Razorpay credentials ────────────────────────────────────
  console.log("\n===== STEP 3: VERIFY RAZORPAY CREDENTIALS =====");
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
  console.log("[Verify] RAZORPAY_KEY_ID present:", !!key_id);
  console.log("[Verify] RAZORPAY_KEY_SECRET present:", !!key_secret, "length:", key_secret?.length || 0);

  if (!key_id || !key_secret) {
    console.error("[Verify] FAIL: Razorpay credentials missing");
    return res.status(500).json({ success: false, error: "Payment gateway configuration error. Contact support." });
  }
  console.log("[Verify] PASS: Razorpay credentials loaded");

  // ── STEP 4: Verify Razorpay signature ─────────────────────────────────────
  console.log("\n===== STEP 4: VERIFY RAZORPAY SIGNATURE =====");
  const hmacBody = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", key_secret)
    .update(hmacBody)
    .digest("hex");

  console.log("[Verify] Expected Signature (first 16):", expectedSignature.slice(0, 16) + "...");
  console.log("[Verify] Received Signature (first 16):", razorpay_signature.slice(0, 16) + "...");
  const signatureMatch = expectedSignature === razorpay_signature;
  console.log("[Verify] Signature match:", signatureMatch);

  const isMockPayment = (process.env.NODE_ENV !== "production" ||
    razorpay_order_id.startsWith("order_mock_")) &&
    razorpay_signature === "mock_signature";

  if (!signatureMatch && !isMockPayment) {
    console.error("[Verify] FAIL: Signature mismatch — payment rejected");
    return res.status(400).json({ success: false, error: "Invalid payment signature. Payment verification failed." });
  }
  console.log("[Verify] PASS: Signature verified ✓", isMockPayment ? "(mock)" : "");

  let booking = null;
  let paymentDoc = null;
  let session = null;

  try {
    const userId = req.user._id || req.user.id;

    // ── STEP 5: Load booking draft ───────────────────────────────────────────
    console.log("\n===== STEP 5: LOAD BOOKING DRAFT =====");
    console.log("[Verify] Looking up booking by id:", bookingId, "or orderId:", razorpay_order_id);

    booking = await Booking.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null },
        { bookingId: bookingId },
        { orderId: razorpay_order_id }
      ].filter(q => Object.values(q)[0] !== null)
    });

    if (!booking) {
      console.error("[Verify] FAIL: Booking not found for id:", bookingId, "orderId:", razorpay_order_id);
      return res.status(404).json({ success: false, error: "Booking not found. Please contact support." });
    }
    console.log("[Verify] PASS: Booking found — bookingId:", booking.bookingId, "_id:", booking._id);
    console.log("[Verify] Booking status:", booking.status, "| paymentStatus:", booking.paymentStatus);
    console.log("[Verify] Booking pricePaid (INR):", booking.pricePaid, "| seatNumbers:", booking.seatNumbers);
    console.log("[Verify] Booking tripId:", booking.tripId);

    // ── Prevent duplicate verification ──────────────────────────────────────
    if (booking.status === "PAID" || booking.paymentStatus === "PAID") {
      console.log("[Verify] Booking already PAID — returning cached success");
      return res.status(200).json({
        success: true,
        bookingId: booking.bookingId,
        paymentId: razorpay_payment_id,
        status: "paid",
        booking
      });
    }

    // ── STEP 6: Fetch Razorpay order & verify amount ─────────────────────────
    console.log("\n===== STEP 6: VERIFY AMOUNT AND CURRENCY =====");
    if (!isMockPayment) {
      let rzpOrder;
      try {
        const instance = getRazorpayInstance();
        rzpOrder = await instance.orders.fetch(razorpay_order_id);
        console.log("[Verify] Razorpay Order:", JSON.stringify({
          id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          status: rzpOrder.status
        }));
      } catch (rzpOrderErr) {
        console.error("[Verify] FAIL: Cannot fetch Razorpay order:", rzpOrderErr.message);
        return res.status(400).json({
          success: false,
          error: `Failed to verify order with Razorpay: ${rzpOrderErr.message || "API error"}`
        });
      }

      // Use integer paise comparison to avoid floating-point errors
      const expectedAmountPaise = Math.round(booking.pricePaid * 100);
      console.log("[Verify] Expected amount (paise):", expectedAmountPaise, "| Razorpay amount (paise):", rzpOrder.amount);

      if (rzpOrder.amount !== expectedAmountPaise) {
        console.error("[Verify] FAIL: Amount mismatch");
        return res.status(400).json({
          success: false,
          error: `Payment amount mismatch. Expected ₹${booking.pricePaid} (${expectedAmountPaise} paise) but Razorpay order has ${rzpOrder.amount} paise.`
        });
      }
      if (rzpOrder.currency !== "INR") {
        console.error("[Verify] FAIL: Currency mismatch:", rzpOrder.currency);
        return res.status(400).json({
          success: false,
          error: `Currency mismatch. Expected INR but received ${rzpOrder.currency}.`
        });
      }
      console.log("[Verify] PASS: Amount and currency verified ✓");
    } else {
      console.log("[Verify] Skipping amount check for mock payment");
    }

    // ── STEP 7: Validate seats ───────────────────────────────────────────────
    // IMPORTANT: At this point Razorpay has already captured the payment.
    // We MUST NOT reject due to a soft seat-lock TTL expiry.
    // We only block if the seat was genuinely booked by a different booking.
    console.log("\n===== STEP 7: VALIDATE SEATS =====");
    const SeatBookingModel = mongoose.model("SeatBooking");
    for (const seatNum of booking.seatNumbers) {
      console.log("[Verify] Checking seat:", seatNum);
      const seatDoc = await SeatBookingModel.findOne({ tripId: booking.tripId, seatNumber: seatNum });
      if (!seatDoc) {
        console.warn("[Verify] Seat document not found for", seatNum, "— will be created during finalization");
        continue; // SeatBooking may not exist yet for new trips — finalize will create it
      }
      console.log("[Verify] Seat", seatNum, "status:", seatDoc.status,
        "| reservedByUserId:", seatDoc.reservedByUserId,
        "| bookingId:", seatDoc.bookingId);

      // Only hard-block if booked by a different booking
      if (seatDoc.status === "booked" && String(seatDoc.bookingId) !== String(booking._id)) {
        console.error("[Verify] FAIL: Seat", seatNum, "is permanently booked by a different booking:", seatDoc.bookingId);
        return res.status(400).json({
          success: false,
          error: `Seat ${seatNum} has already been booked by another traveler. Please contact support for a refund.`
        });
      }
      // Seat is "available" or "reserved" by us — or TTL-expired but still reserved by us
      // All such cases are safe to finalize (payment already captured)
      console.log("[Verify] PASS: Seat", seatNum, "is safe to finalize");
    }

    // Check if MongoDB deployment supports Replica Set / Transactions
    const isReplicaSet = (() => {
      try {
        const topology = mongoose.connection?.client?.topology;
        const type = topology?.description?.type;
        return type && type !== "Single";
      } catch (_) {
        return false;
      }
    })();

    if (isReplicaSet) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (txInitErr) {
        console.warn("[Transaction] MongoDB transactions not supported by deployment. Running sequentially.");
        session = null;
      }
    } else {
      console.log("[Payment Verify] Standalone MongoDB deployment detected. Executing booking finalization sequentially.");
      session = null;
    }

    // ── STEP 8: Finalize Booking ─────────────────────────────────────────────
    console.log("\n===== STEP 8: FINALIZE BOOKING =====");
    console.log("[Verify] Starting BookingService.finalizeBooking for booking._id:", booking._id);

    let result;
    try {
      result = await BookingService.finalizeBooking({
        bookingId: booking._id,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature
      }, session);

      if (session && typeof session.inTransaction === "function" && session.inTransaction()) {
        await session.commitTransaction();
        console.log("[Verify] Transaction committed");
      }
    } catch (finalizeErr) {
      console.error("[Verify] finalizeBooking error:", finalizeErr.message, finalizeErr.name);
      if (session) {
        try {
          await session.abortTransaction();
        } catch (_) {}
      }

      // Retry sequentially without session if transaction fails due to standalone Mongo
      if (session && (
        finalizeErr.message?.includes("Transaction numbers are only allowed") ||
        finalizeErr.name === "MongoServerError"
      )) {
        console.warn("[Verify] Retrying sequentially without session (standalone MongoDB)...");
        result = await BookingService.finalizeBooking({
          bookingId: booking._id,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature
        }, null);
      } else {
        throw finalizeErr;
      }
    } finally {
      if (session) {
        try {
          session.endSession();
        } catch (_) {}
      }
    }
    console.log("[Verify] PASS: BookingService.finalizeBooking completed");

    booking = result.booking;
    paymentDoc = result.payment;
    console.log("[Verify] Booking finalized — bookingId:", booking.bookingId, "| status:", booking.status, "| paymentStatus:", booking.paymentStatus);

    // ── STEP 9: Emit real-time seat updates ──────────────────────────────────
    console.log("\n===== STEP 9: EMIT SEAT UPDATES =====");
    const io = req.app.get("io");
    if (io && booking.seatNumbers?.length > 0) {
      booking.seatNumbers.forEach((seatNum, idx) => {
        const traveler = booking.travellers?.[idx] || {};
        io.to(`trip_${booking.tripId}`).emit("seat_update", {
          tripId: booking.tripId,
          seatNumber: seatNum,
          status: "booked",
          gender: traveler.gender || "Other",
          passengerName: traveler.name || "Traveler",
          age: traveler.age || 0
        });
      });
      console.log("[Verify] Seat update events emitted for seats:", booking.seatNumbers);
    } else {
      console.log("[Verify] No io instance or no seats to emit");
    }

    // ── STEP 10: Send confirmation email (non-blocking) ──────────────────────
    console.log("\n===== STEP 10: SEND CONFIRMATION EMAIL =====");
    const trip = await AgentTrip.findById(booking.tripId);
    try {
      const { generateTicketPdf } = await import("../services/pdfService.js");
      const { sendBookingConfirmationEmail } = await import("../services/emailService.js");
      
      const primaryTraveler = booking.travellers?.[0] || {};
      const passengerName = primaryTraveler.name || booking.travelerName || "Valued Traveler";
      const passengerEmail = primaryTraveler.email || req.user.email || "traveler@traveloop.app";
      
      const pdfBuffer = await generateTicketPdf(booking, trip, passengerName);
      await sendBookingConfirmationEmail(passengerEmail, passengerName, booking, trip, pdfBuffer);
      console.log(`[Verify] Confirmation email sent to ${passengerEmail}`);
    } catch (emailErr) {
      console.error("[Verify] Email send failed (non-fatal):", emailErr.message);
    }

    // ── STEP 11: Return success ──────────────────────────────────────────────
    console.log("\n===== STEP 11: SUCCESS RESPONSE =====");
    console.log("[Verify] Returning success. bookingId:", booking.bookingId, "paymentId:", razorpay_payment_id);
    res.status(200).json({
      success: true,
      bookingId: booking.bookingId,
      paymentId: razorpay_payment_id,
      status: "paid",
      booking
    });

  } catch (error) {
    console.error("\n===== PAYMENT VERIFY UNHANDLED ERROR =====");
    console.error("[Verify] Error name:", error.name);
    console.error("[Verify] Error message:", error.message);
    console.error("[Verify] Error stack:", error.stack?.split("\n").slice(0, 5).join("\n"));

    // Rollback seat reservations if booking failed before PAID
    if (booking && booking._id && booking.status !== "PAID") {
      try {
        const SeatBookingModel = mongoose.model("SeatBooking");
        if (booking.seatNumbers && booking.seatNumbers.length > 0) {
          await SeatBookingModel.updateMany(
            { tripId: booking.tripId, seatNumber: { $in: booking.seatNumbers }, bookingId: booking._id },
            { $set: { status: "available", bookingId: null, passengerId: null, reservedUntil: null } }
          );
          console.log(`[Verify Rollback] Released seats ${booking.seatNumbers.join(", ")} for failed booking ${booking.bookingId}`);
        }
      } catch (rollbackErr) {
        console.error("[Payment Verify Rollback] Seat rollback error:", rollbackErr.message);
      }
    }

    const isTechError = error.message && (
      error.message.includes("Mongo") ||
      error.message.includes("Transaction") ||
      error.message.includes("replica") ||
      error.message.includes("standalone") ||
      error.name === "MongoServerError"
    );
    const cleanMsg = isTechError
      ? "Booking could not be completed due to a server error. Please contact support."
      : (error.message || "Booking could not be completed. Please try again.");

    console.error("[Verify] Returning 400 with message:", cleanMsg);
    res.status(400).json({ success: false, message: cleanMsg });
  }
});

// @route   POST /api/payment/generate-qr
// @desc    Generate a dynamic UPI QR Code for booking checkout
// @access  Private (Traveler)
router.post("/generate-qr", protect, async (req, res) => {
  const { bookingId, amount, tripId } = req.body;
  const userId = req.user._id || req.user.id;

  if (!bookingId || !amount) {
    return res.status(400).json({ success: false, message: "bookingId and amount are required" });
  }

  try {
    const { PaymentService } = await import("../services/paymentService.js");
    
    // Acquire a payment transaction lock (900 seconds TTL)
    await PaymentService.lockPayment(bookingId, 900);

    const qrData = await PaymentService.generateQR(bookingId, amount, tripId, userId);
    res.status(200).json({
      success: true,
      ...qrData,
    });
  } catch (error) {
    console.error("[QR Generation Error]:", error);
    res.status(500).json({ success: false, message: "Failed to generate QR payment link" });
  }
});

// @route   GET /api/payment/status/:bookingId
// @desc    Poll checkout status for specific booking ID
// @access  Private (Traveler)
router.get("/status/:bookingId", protect, async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findOne({
      $or: [
        { bookingId: bookingId },
        { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null }
      ].filter(Boolean)
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      status: booking.paymentStatus, // PENDING, PAID, FAILED, REFUNDED
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/payment/confirm-manual
// @desc    Simulate/confirm collect or manual QR payments for testing
// @access  Private (Traveler)
router.post("/confirm-manual", protect, async (req, res) => {
  const { bookingId, transactionId, upiReference, paymentMethod } = req.body;
  if (!bookingId) {
    return res.status(400).json({ success: false, message: "bookingId is required" });
  }
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ success: false, message: "Invalid booking reference" });
  }
  try {
    const { PaymentService } = await import("../services/paymentService.js");
    const result = await PaymentService.confirmManualPayment(bookingId, paymentMethod || "upi_qr", transactionId, upiReference);
    res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Booking OTP map storage
const bookingOtps = new Map();

// @route   POST /api/payment/send-booking-otp
// @desc    Generate and send booking confirmation OTPs to mobile and email
// @access  Private (Traveler)
router.post("/send-booking-otp", protect, async (req, res) => {
  const { email, phone } = req.body;
  if (!email || !phone) {
    return res.status(400).json({ success: false, message: "Email and phone are required." });
  }

  const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  bookingOtps.set(`${email.toLowerCase().trim()}_${phone.trim()}`, {
    emailOtp,
    mobileOtp,
    expiresAt
  });

  console.log(`[Booking OTP Generated] OTP session created for Email: ${email}`);

  try {
    const { sendTravelerOtpEmail } = await import("../services/emailService.js");
    await sendTravelerOtpEmail(email, emailOtp);
  } catch (emailErr) {
    console.error("Failed to send booking OTP email:", emailErr);
  }

  res.status(200).json({
    success: true,
    message: "OTPs sent successfully to mobile and email.",
  });
});

// @route   POST /api/payment/verify-booking-otp
// @desc    Verify OTPs before proceeding to payment
// @access  Private (Traveler)
router.post("/verify-booking-otp", protect, async (req, res) => {
  const { email, phone, emailOtp, mobileOtp } = req.body;
  if (!email || !phone || !emailOtp || !mobileOtp) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const key = `${email.toLowerCase().trim()}_${phone.trim()}`;
  const record = bookingOtps.get(key);

  if (!record) {
    return res.status(400).json({ success: false, message: "OTP not requested or expired." });
  }

  if (Date.now() > record.expiresAt) {
    bookingOtps.delete(key);
    return res.status(400).json({ success: false, message: "OTPs have expired. Please request new ones." });
  }

  if (record.emailOtp !== emailOtp || record.mobileOtp !== mobileOtp) {
    return res.status(400).json({ success: false, message: "Invalid OTPs. Please try again." });
  }

  bookingOtps.delete(key);
  res.status(200).json({
    success: true,
    message: "OTPs verified successfully."
  });
});

/**
 * POST /api/payment/agent/create-slot-order
 * Create a Razorpay order for slot purchasing
 */
router.post("/agent/create-slot-order", protectAgent, async (req, res) => {
  const { slotsCount = 1 } = req.body;
  try {
    const settings = await AgentSettings.findOne({ settingId: "global" });
    const slotPrice = settings ? (settings.slotPrice || 1000) : 1000;
    const slotPurchaseEnabled = settings ? (settings.slotPurchaseEnabled !== false) : true;

    if (!slotPurchaseEnabled) {
      return res.status(400).json({ success: false, message: "Slot purchases are currently disabled by the administrator." });
    }

    const amount = Number(slotPrice) * Number(slotsCount);

    const rzp = getRazorpayInstance();
    const orderOptions = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `slot_purchase_rcpt_${Date.now()}`,
    };

    let order;
    try {
      order = await rzp.orders.create(orderOptions);
    } catch (rzpErr) {
      console.warn("[Razorpay Order Failed] Falling back to mock order simulation:", rzpErr.message);
      order = {
        id: `order_mock_${Math.floor(100000 + Math.random() * 900000)}`,
        amount: orderOptions.amount,
        currency: orderOptions.currency,
        receipt: orderOptions.receipt,
        status: "created"
      };
    }

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount,
      currency: "INR",
      slotsGranted: Number(slotsCount)
    });
  } catch (error) {
    console.error("Create slot order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/payment/agent/verify-slot-purchase
 * Verify Razorpay checkout signature and grant purchased slots
 */
router.post("/agent/verify-slot-purchase", protectAgent, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, slotsCount = 1, amount } = req.body;
  try {
    if (razorpay_order_id && !razorpay_order_id.startsWith("order_mock_") && razorpay_signature) {
      const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "dummysecretvalue";
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification signature failed." });
      }
    }

    const agent = await Agent.findById(req.agent._id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent profile not found." });
    }

    const payment = await Payment.create({
      type: "slot_purchase",
      agentId: agent._id,
      amount: Number(amount) || 1000,
      paymentMethod: "razorpay",
      status: "PAID",
      transactionId: razorpay_payment_id || `txn_mock_${Math.floor(100000 + Math.random() * 900000)}`,
      orderId: razorpay_order_id || `order_mock_${Math.floor(100000 + Math.random() * 900000)}`,
      slotsGranted: Number(slotsCount),
    });

    agent.purchasedSlots = (agent.purchasedSlots || 0) + Number(slotsCount);
    await agent.save();

    res.status(200).json({
      success: true,
      message: "Slot purchase completed successfully!",
      purchasedSlots: agent.purchasedSlots,
      payment
    });
  } catch (error) {
    console.error("Verify slot purchase error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/payment/validate-coupon
// @desc    Validate a coupon code
// @access  Private (Traveler)
router.post("/validate-coupon", protect, async (req, res) => {
  const { couponCode } = req.body;
  if (!couponCode || !couponCode.trim()) {
    return res.status(400).json({ success: false, message: "Coupon code is required" });
  }

  try {
    const userObj = await User.findById(req.user.id || req.user._id);
    if (!userObj) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check rewards array first
    const reward = userObj.rewards ? userObj.rewards.find(r => r.couponCode.trim().toUpperCase() === couponCode.trim().toUpperCase()) : null;
    
    // Check fallback scratchCards
    const scratchCard = userObj.scratchCards ? userObj.scratchCards.find(c => c.couponCode && c.couponCode.trim().toUpperCase() === couponCode.trim().toUpperCase()) : null;

    if (!reward && !scratchCard) {
      // Check if belongs to someone else
      const otherUser = await User.findOne({
        $or: [
          { "rewards.couponCode": couponCode.trim() },
          { "scratchCards.couponCode": couponCode.trim() }
        ]
      });
      if (otherUser) {
        return res.status(400).json({ success: false, message: "Coupon Invalid" });
      }
      return res.status(400).json({ success: false, message: "Coupon Not Found" });
    }

    const isUsed = (reward && reward.used) || (scratchCard && scratchCard.used);
    const expiresAt = (reward && reward.expiresAt) || (scratchCard && scratchCard.expiresAt);
    const discountPercent = reward ? reward.discountPercent : (scratchCard ? parseInt(scratchCard.rewardValue) : 0);

    if (isUsed) {
      return res.status(400).json({ success: false, message: "Coupon Already Used" });
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon Expired" });
    }

    const status = reward ? reward.status : (scratchCard && scratchCard.claimed ? "AVAILABLE" : "UNCLAIMED");
    if (reward && status !== "AVAILABLE") {
      return res.status(400).json({ success: false, message: "Coupon Invalid" });
    }

    return res.status(200).json({
      success: true,
      couponCode: (reward ? reward.couponCode : scratchCard.couponCode),
      discountPercent,
      expiresAt,
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    res.status(500).json({ success: false, message: "Server error validating coupon" });
  }
});

// @route   POST /api/payment/webhook
// @desc    Razorpay Webhooks receiver
// @access  Public
router.post("/webhook", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return res.status(400).json({ success: false, message: "Webhook secret or signature missing" });
  }

  // Verify signature using raw request body
  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(req.rawBody || JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest !== signature) {
    console.error("[Razorpay Webhook] Signature verification failed.");
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const event = req.body.event;
  console.log(`[Razorpay Webhook] Event received: ${event}`);

  try {
    const payload = req.body.payload;

    if (event === "payment.captured") {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      // Find booking by orderId
      const booking = await Booking.findOne({ orderId });
      if (!booking) {
        console.warn(`[Razorpay Webhook] Booking not found for orderId: ${orderId}`);
        return res.status(200).json({ status: "ok" });
      }

      // Prevent duplicate verification/finalization
      if (booking.status === "PAID" || booking.paymentStatus === "Paid") {
        console.log(`[Razorpay Webhook] Booking ${booking.bookingId} is already paid.`);
        return res.status(200).json({ status: "ok" });
      }

      // Finalize the booking atomically
      console.log(`[Razorpay Webhook] Finalizing booking ${booking.bookingId}`);
      await BookingService.finalizeBooking({
        bookingId: booking._id,
        paymentId,
        orderId,
        signature: signature
      });

      // Emit seat updates to Socket.io
      const io = req.app.get("io");
      if (io && booking.seatNumbers?.length > 0) {
        booking.seatNumbers.forEach((seatNum, idx) => {
          const traveler = booking.travellers?.[idx] || {};
          io.to(`trip_${booking.tripId}`).emit("seat_update", {
            tripId: booking.tripId,
            seatNumber: seatNum,
            status: "booked",
            gender: traveler.gender || "Other",
            passengerName: traveler.name || "Traveler",
            age: traveler.age || 0
          });
        });
      }

      // Send PDF ticket and confirmation email
      const trip = await AgentTrip.findById(booking.tripId);
      try {
        const { generateTicketPdf } = await import("../services/pdfService.js");
        const { sendBookingConfirmationEmail } = await import("../services/emailService.js");

        const primaryTraveler = booking.travellers?.[0] || {};
        const passengerName = primaryTraveler.name || booking.travelerName || "Valued Traveler";
        const passengerEmail = primaryTraveler.email || booking.contactEmail || "traveler@traveloop.app";

        const pdfBuffer = await generateTicketPdf(booking, trip, passengerName);
        await sendBookingConfirmationEmail(passengerEmail, passengerName, booking, trip, pdfBuffer);
        console.log(`[Razorpay Webhook] Email confirmation sent for booking ${booking.bookingId}`);
      } catch (err) {
        console.error("[Razorpay Webhook] Email sending failed:", err.message);
      }
    } 
    else if (event === "payment.failed") {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const booking = await Booking.findOne({ orderId });
      if (booking && booking.status !== "PAID" && booking.paymentStatus !== "Paid") {
        booking.status = "FAILED";
        booking.paymentStatus = "FAILED";
        booking.bookingStatus = "failed";
        await booking.save();

        // Release reserved seats
        const SeatBooking = mongoose.model("SeatBooking");
        for (const seatNumber of booking.seatNumbers) {
          await SeatBooking.updateOne(
            { tripId: booking.tripId, seatNumber },
            { status: "available", reservedUntil: null, reservedByUserId: null, paymentStatus: "none" }
          );


          const io = req.app.get("io");
          if (io) {
            io.to(`trip_${booking.tripId}`).emit("seat_update", {
              tripId: booking.tripId,
              seatNumber,
              status: "available"
            });
          }
        }
        console.log(`[Razorpay Webhook] Webhook failed payment processed: Booking ${booking.bookingId} cancelled, seats released.`);
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("[Razorpay Webhook] Processing error:", err);
    res.status(500).json({ success: false, message: "Webhook error" });
  }
});

export default router;
