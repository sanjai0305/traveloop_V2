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
import redisClient from "../config/redis.js";

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

    // 3. Clear Redis lock
    if (redisClient) {
      const key = `seat_lock:${tripId}:${seatNumber}`;
      await redisClient.del(key);
    }

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
  console.log("=== PAYMENT VERIFICATION REQUEST (INCOMING REQUEST) ===");
  console.log("[Razorpay Verify] Incoming Request Body:", JSON.stringify(req.body));
  console.log("[Razorpay Verify] razorpay_order_id:", req.body.razorpay_order_id);
  console.log("[Razorpay Verify] razorpay_payment_id:", req.body.razorpay_payment_id);
  console.log("[Razorpay Verify] razorpay_signature:", req.body.razorpay_signature);
  console.log("[Razorpay Verify] bookingId:", req.body.bookingId);

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingPayload,
    bookingId
  } = req.body;

  // Verify credentials exist. If missing, return 400 instead of 500.
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

  if (!key_id || !key_secret) {
    console.error("[Razorpay Verify] Payment Error: Razorpay credentials missing");
    const errorMsg = "Razorpay credentials missing on the server";
    console.log("[Razorpay Verify] Verification Response: Failure -", errorMsg);
    return res.status(400).json({ success: false, message: errorMsg });
  }

  // 1. Enforce strict signature verification
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    const errorMsg = "Missing Razorpay payment verification fields (order_id, payment_id, or signature)";
    console.error("[Razorpay Verify] Payment Error:", errorMsg);
    console.log("[Razorpay Verify] Verification Response: Failure -", errorMsg);
    return res.status(400).json({ success: false, message: errorMsg });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", key_secret)
    .update(body.toString())
    .digest("hex");

  const isMockPayment = (process.env.NODE_ENV !== "production" || razorpay_order_id.startsWith("order_mock_")) && razorpay_signature === "mock_signature";
  if (expectedSignature !== razorpay_signature && !isMockPayment) {
    const errorMsg = "Payment verification failed (Signature mismatch)";
    console.error("[Razorpay Verify] Payment Error:", errorMsg);
    console.log("[Razorpay Verify] Verification Response: Failure -", errorMsg);
    return res.status(400).json({ success: false, message: errorMsg });
  }

  // 2. Resolve or Load Booking and Finalize Atomically
  let booking = null;
  let paymentDoc = null;
  let session = null;

  try {
    const userId = req.user._id || req.user.id;
    const lookupId = bookingId || razorpay_order_id;

    // Load booking draft first
    booking = await Booking.findOne({
      $or: [
        { bookingId: lookupId },
        { _id: mongoose.Types.ObjectId.isValid(lookupId) ? lookupId : null },
        { orderId: razorpay_order_id }
      ].filter(Boolean)
    });

    if (!booking) {
      const errorMsg = `Booking draft not found for lookupId: ${lookupId} or orderId: ${razorpay_order_id}`;
      console.error("[Razorpay Verify] Payment Error:", errorMsg);
      console.log("[Razorpay Verify] Verification Response: Failure -", errorMsg);
      return res.status(404).json({ success: false, message: errorMsg });
    }

    console.log("[Razorpay Verify] Trip ID:", booking.tripId);
    console.log("[Razorpay Verify] Booking Amount (Rupees):", booking.pricePaid);
    console.log("[Razorpay Verify] Expected Amount (Paise):", Math.round(booking.pricePaid * 100));

    // Prevent duplicate verification
    if (booking.status === "PAID" || booking.paymentStatus === "Paid") {
      console.log("[Razorpay Verify] Verification Response: Success (Already Paid)");
      return res.status(200).json({
        success: true,
        bookingId: booking.bookingId,
        paymentId: razorpay_payment_id,
        status: "paid",
        booking
      });
    }

    // Verify Amount and Currency against Razorpay API
    if (!isMockPayment) {
      let rzpOrder;
      try {
        const instance = getRazorpayInstance();
        rzpOrder = await instance.orders.fetch(razorpay_order_id);
        console.log("[Razorpay Verify] Razorpay Response (Order Fetch):", JSON.stringify(rzpOrder));
      } catch (rzpOrderErr) {
        console.error("[Razorpay Verify] Payment Error: Failed to fetch order from Razorpay API:", rzpOrderErr.message || rzpOrderErr);
        console.log("[Razorpay Verify] Verification Response: Failure - Failed to fetch order from Razorpay API");
        return res.status(400).json({
          success: false,
          message: rzpOrderErr.message || "Failed to fetch order details from Razorpay",
          razorpayError: rzpOrderErr
        });
      }

      const expectedAmountPaise = Math.round(booking.pricePaid * 100);
      if (rzpOrder.amount !== expectedAmountPaise) {
        const errorMsg = `Payment amount mismatch. Booking expects ${expectedAmountPaise} paise, Razorpay order has ${rzpOrder.amount} paise.`;
        console.error("[Razorpay Verify] Payment Error:", errorMsg);
        console.log("[Razorpay Verify] Verification Response: Failure -", errorMsg);
        return res.status(400).json({ success: false, message: errorMsg });
      }
      if (rzpOrder.currency !== "INR") {
        const errorMsg = `Payment currency verification failed. Expected INR, got ${rzpOrder.currency}`;
        console.error("[Razorpay Verify] Payment Error:", errorMsg);
        console.log("[Razorpay Verify] Verification Response: Failure -", errorMsg);
        return res.status(400).json({ success: false, message: errorMsg });
      }
    }


    // Ensure seats are still reserved for this user and not expired/booked
    const SeatBooking = mongoose.model("SeatBooking");
    const now = new Date();
    for (const seatNum of booking.seatNumbers) {
      const seatDoc = await SeatBooking.findOne({ tripId: booking.tripId, seatNumber: seatNum });
      if (!seatDoc) {
        return res.status(400).json({ success: false, message: `Seat ${seatNum} not found.` });
      }
      if (seatDoc.status === "booked" && String(seatDoc.bookingId) !== String(booking._id)) {
        return res.status(400).json({ success: false, message: `Seat ${seatNum} is already booked by another traveler.` });
      }
      if (seatDoc.status === "reserved") {
        if (String(seatDoc.reservedByUserId) !== String(userId)) {
          return res.status(400).json({ success: false, message: `Seat ${seatNum} is reserved by another traveler.` });
        }
        if (seatDoc.reservedUntil && seatDoc.reservedUntil < now) {
          return res.status(400).json({ success: false, message: `Reservation for seat ${seatNum} has expired.` });
        }
      }
    }

    // Start Mongoose Transaction
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (txInitErr) {
      console.warn("[Transaction] MongoDB transactions not supported by deployment. Running sequentially.");
      session = null;
    }

    let result;
    try {
      result = await BookingService.finalizeBooking({
        bookingId: booking._id,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature
      }, session);

      if (session) {
        await session.commitTransaction();
      }
    } catch (finalizeErr) {
      if (session) {
        await session.abortTransaction();
      }
      throw finalizeErr;
    } finally {
      if (session) {
        session.endSession();
      }
    }

    booking = result.booking;
    paymentDoc = result.payment;

    // 3. Emit real-time seat updates for newly confirmed seats
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

    // 4. Trigger PDF ticket pass generation and send confirmation email asynchronously
    const trip = await AgentTrip.findById(booking.tripId);
    try {
      const { generateTicketPdf } = await import("../services/pdfService.js");
      const { sendBookingConfirmationEmail } = await import("../services/emailService.js");
      
      const primaryTraveler = booking.travellers?.[0] || {};
      const passengerName = primaryTraveler.name || booking.travelerName || "Valued Traveler";
      const passengerEmail = primaryTraveler.email || req.user.email || "traveler@traveloop.app";
      
      const pdfBuffer = await generateTicketPdf(booking, trip, passengerName);
      await sendBookingConfirmationEmail(passengerEmail, passengerName, booking, trip, pdfBuffer);
      console.log(`[Payment Verify API] Confirmation email sent to ${passengerEmail}`);
    } catch (emailErr) {
      console.error("[Payment Verify API] Failed to send ticket pass email:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      bookingId: booking.bookingId,
      paymentId: razorpay_payment_id,
      status: "paid",
      booking
    });

  } catch (error) {
    console.error("[Razorpay Verify & Record] Error:", error);
    res.status(400).json({ success: false, message: error.message || "Payment Verification Failed" });
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
          if (redisClient) {
            await redisClient.del(`seat_lock:${booking.tripId}:${seatNumber}`);
          }

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
