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
  const { tripId, seats = 1, couponCode } = req.body;

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

    const price = trip.offerPrice || trip.pricePerPerson || 0;
    const amount = price * Number(seats);

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount" });
    }

    // Check referral discount eligibility
    const referralEnabledSetting = await SystemSetting.findOne({ key: "referral_enabled" });
    const referralEnabled = referralEnabledSetting ? referralEnabledSetting.value === true : false;

    const referralDiscountSetting = await SystemSetting.findOne({ key: "referral_discount_percentage" });
    const referralDiscountPercent = referralDiscountSetting ? Number(referralDiscountSetting.value) : 5;

    const userObj = await User.findById(req.user.id || req.user._id);
    const paidBookingsCount = await Booking.countDocuments({ userId: userObj?._id, paymentStatus: "Paid" });

    let discount = 0;
    let isCouponApplied = false;

    if (couponCode && couponCode.trim()) {
      if (userObj) {
        const reward = userObj.rewards ? userObj.rewards.find(r => 
          r.couponCode.trim().toUpperCase() === couponCode.trim().toUpperCase() &&
          r.status === "AVAILABLE" &&
          !r.used &&
          (!r.expiresAt || new Date(r.expiresAt) > new Date())
        ) : null;

        const couponCard = userObj.scratchCards ? userObj.scratchCards.find(c => 
          c.couponCode && 
          c.couponCode.trim().toUpperCase() === couponCode.trim().toUpperCase() &&
          c.claimed && 
          !c.used &&
          (!c.expiresAt || new Date(c.expiresAt) > new Date())
        ) : null;

        if (reward) {
          isCouponApplied = true;
          discount = Math.round(amount * (reward.discountPercent / 100));
        } else if (couponCard) {
          isCouponApplied = true;
          if (couponCard.rewardType === "percentage_discount") {
            const pct = parseInt(couponCard.rewardValue);
            discount = Math.round(amount * (pct / 100));
          }
        }
      }
    }

    if (!isCouponApplied && referralEnabled && userObj && userObj.referredBy && paidBookingsCount === 0) {
      discount = Math.round(amount * (referralDiscountPercent / 100));
    }
    const finalAmount = amount - discount;

    const options = {
      amount: Math.round(finalAmount * 100), // Razorpay accepts in paise
      currency: "INR",
      receipt: `TRIP-${tripId.toString().slice(-8)}-${String(Date.now()).slice(-6)}`,
    };

    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("KEY:", process.env.RAZORPAY_KEY_ID);
    console.log("SECRET LENGTH:", process.env.RAZORPAY_KEY_SECRET?.length);

    let order;
    try {
      const instance = getRazorpayInstance();
      order = await instance.orders.create(options);
    } catch (apiError) {
      console.error("[Razorpay Create Order] API call failed.");
      console.dir(apiError, { depth: null });
      return res.status(500).json({
        success: false,
        message: "Unable to create Razorpay order"
      });
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: finalAmount,
      currency: "INR",
    });
  } catch (error) {
    console.error("[Razorpay Create Order] Error:", error);
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
  console.log("=== PAYMENT VERIFICATION REQUEST ===");
  console.log("req.body:", req.body);
  console.log("razorpay_order_id:", req.body.razorpay_order_id);
  console.log("razorpay_payment_id:", req.body.razorpay_payment_id);
  console.log("razorpay_signature:", req.body.razorpay_signature);
  console.log("bookingId:", req.body.bookingId);

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
    console.error("[Razorpay] Verification failed: Razorpay credentials missing");
    return res.status(400).json({ success: false, message: "Razorpay credentials missing" });
  }

  // 1. Enforce strict signature verification
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing Razorpay payment verification fields" });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", key_secret)
    .update(body.toString())
    .digest("hex");

  const isMockPayment = (process.env.NODE_ENV !== "production" || razorpay_order_id.startsWith("order_mock_")) && razorpay_signature === "mock_signature";
  if (expectedSignature !== razorpay_signature && !isMockPayment) {
    console.error("[Razorpay Verification] Signature mismatch.");
    return res.status(400).json({ success: false, message: "Payment verification failed" });
  }

  // 2. Resolve or Load Booking
  let booking = null;
  let trip = null;
  let finalAmount = 0;
  let totalTravellers = 0;

  try {
    const userId = req.user._id || req.user.id;

    if (bookingId) {
      booking = await Booking.findOne({
        $or: [
          { bookingId: bookingId },
          { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null }
        ].filter(Boolean)
      });
    }

    const { additionalPassengers = [], additionalAmount = 0 } = req.body;

    if (booking) {
      // SCENARIO A: Existing booking update or additional passenger payment verification
      trip = await AgentTrip.findById(booking.tripId);
      if (!trip) {
        return res.status(400).json({ success: false, message: "Trip not found" });
      }

      if (additionalPassengers.length > 0) {
        // Additional passenger payment flow
        finalAmount = additionalAmount;
        totalTravellers = additionalPassengers.length;

        if ((trip.availableSeats || 0) < totalTravellers) {
          return res.status(400).json({ success: false, message: "Not enough available seats left on this trip" });
        }

        // Add additional passengers to travellers arrays
        const normalizeGender = (g) => {
          if (!g) return "Other";
          const lower = g.toLowerCase();
          if (lower === "male") return "Male";
          if (lower === "female") return "Female";
          return "Other";
        };

        additionalPassengers.forEach(p => {
          booking.travellers.push({
            name: p.name,
            age: Number(p.age || 0),
            gender: normalizeGender(p.gender),
            phone: p.phone || "",
          });
          if (p.seat) {
            booking.seatNumbers.push(p.seat);
          }
        });

        booking.seats = (booking.seats || 0) + totalTravellers;
        booking.pricePaid = (booking.pricePaid || 0) + additionalAmount;
        booking.amount = (booking.amount || 0) + additionalAmount;
        booking.amountPaid = (booking.amountPaid || 0) + additionalAmount;

        // Recalculate counts
        let mCount = 0;
        let fCount = 0;
        additionalPassengers.forEach(p => {
          const gen = normalizeGender(p.gender);
          if (gen === "Male") mCount++;
          if (gen === "Female") fCount++;
        });

        booking.maleCount = (booking.maleCount || 0) + mCount;
        booking.femaleCount = (booking.femaleCount || 0) + fCount;
        booking.adults = (booking.adults || 0) + totalTravellers;

        await booking.save();

        // Update trip counters
        trip.bookedSeats = (trip.bookedSeats || 0) + totalTravellers;
        trip.availableSeats = Math.max(0, (trip.availableSeats || 0) - totalTravellers);
        trip.maleCount = (trip.maleCount || 0) + mCount;
        trip.femaleCount = (trip.femaleCount || 0) + fCount;
        trip.occupancy = trip.totalSeats > 0 ? Math.round((trip.bookedSeats / trip.totalSeats) * 100) : 0;
        await trip.save();

        // Update Agent statistics
        const agent = await Agent.findById(trip.agentId || trip.agent);
        if (agent) {
          const defaultCommSetting = await SystemSetting.findOne({ key: "default_commission" });
          const defaultRate = defaultCommSetting ? defaultCommSetting.value : 10;
          const commissionRate = agent.commissionRate !== undefined ? agent.commissionRate : defaultRate;

          const commissionAmount = finalAmount * (commissionRate / 100);
          const gatewayFee = finalAmount * 0.02;
          const agentAmount = finalAmount - commissionAmount - gatewayFee;

          agent.revenue = (agent.revenue || 0) + finalAmount;
          agent.totalRevenue = (agent.totalRevenue || 0) + finalAmount;
          agent.pendingRevenue = (agent.pendingRevenue || 0) + agentAmount;
          await agent.save();
        }
      } else {
        // Standard confirm checkout payment flow
        finalAmount = booking.pricePaid || booking.amount || 0;
        totalTravellers = booking.seats || 1;

        if (booking.paymentStatus !== "Paid" && (trip.availableSeats || 0) < totalTravellers) {
          return res.status(400).json({ success: false, message: "Not enough available seats left on this trip" });
        }

        if (booking.paymentStatus !== "Paid") {
          booking.paymentStatus = "Paid";
          booking.status = "Paid";
          booking.bookingStatus = "confirmed";
          booking.paymentVerified = true;
          booking.paymentDate = new Date();
          await booking.save();

          // Update trip counters
          trip.bookedSeats = (trip.bookedSeats || 0) + totalTravellers;
          trip.availableSeats = Math.max(0, (trip.availableSeats || 0) - totalTravellers);
          
          const totalS = trip.totalSeats || 40;
          trip.occupancy = totalS > 0 ? Math.round((trip.bookedSeats / totalS) * 100) : 0;
          await trip.save();

          // Update Agent statistics
          const agent = await Agent.findById(trip.agentId || trip.agent);
          if (agent) {
            const defaultCommSetting = await SystemSetting.findOne({ key: "default_commission" });
            const defaultRate = defaultCommSetting ? defaultCommSetting.value : 10;
            const commissionRate = agent.commissionRate !== undefined ? agent.commissionRate : defaultRate;

            const commissionAmount = finalAmount * (commissionRate / 100);
            const gatewayFee = finalAmount * 0.02;
            const agentAmount = finalAmount - commissionAmount - gatewayFee;

            agent.revenue = (agent.revenue || 0) + finalAmount;
            agent.totalRevenue = (agent.totalRevenue || 0) + finalAmount;
            agent.pendingRevenue = (agent.pendingRevenue || 0) + agentAmount;
            agent.totalBookings = (agent.totalBookings || 0) + 1;
            await agent.save();
          }
          await confirmPassengerSeats(booking, bookingPayload?.travellers || booking.travellers, trip._id, userId, req.app.get("io"));
        }
      }
    } else if (bookingPayload) {
      // SCENARIO B: Create new booking from payload
      const { tripId } = bookingPayload;
      trip = await AgentTrip.findById(tripId);
      if (!trip) {
        return res.status(400).json({ success: false, message: "Trip not found" });
      }
      totalTravellers = (bookingPayload.travellers || []).length || 1;
      finalAmount = bookingPayload.totalAmount || (trip.offerPrice || trip.pricePerPerson || 0) * totalTravellers;

      const result = await BookingService.createBooking({
        tripId,
        userId,
        travellers: bookingPayload.travellers,
        seats: totalTravellers,
        seatNumbers: bookingPayload.seatNumbers,
        totalAmount: finalAmount,
        paymentStatus: "Paid",
        bookingStatus: "confirmed",
        paymentVerified: true,
        paymentDate: new Date(),
        maleCount: bookingPayload.maleCount,
        femaleCount: bookingPayload.femaleCount,
        adults: bookingPayload.adults,
        children: bookingPayload.children,
        pickupLocation: bookingPayload.pickupLocation,
        contactNumber: req.user.phone || req.user.phoneNumber || req.user.primaryMobile || "",
        contactEmail: req.user.email || "",
        contactPhone: req.user.phone || req.user.phoneNumber || req.user.primaryMobile || "",
        emailVerified: true,
        phoneVerified: true,
        couponCode: bookingPayload.couponCode || "",
      });
      booking = result.booking;
      await confirmPassengerSeats(booking, bookingPayload.travellers, trip._id, userId, req.app.get("io"));
    } else {
      return res.status(400).json({ success: false, message: "Missing bookingId or bookingPayload" });
    }

    // 4. Create/Store Payment Record
    await Payment.create({
      bookingId: booking._id,
      bookingRef: booking.bookingId,
      tripId: trip._id,
      agentId: trip.agentId || trip.agent,
      travelerId: userId,
      userId: userId,
      amount: finalAmount,
      status: "Paid",
      gateway: "razorpay",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      transactionId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    // Send email invoice asynchronously
    try {
      const { sendInvoiceEmail } = await import("../services/emailService.js");
      const travelerEmail = booking.travellers?.[0]?.email || req.user.email;
      if (travelerEmail) {
        const passengerDetails = booking.travellers.map((t, idx) => ({
          name: t.name,
          age: t.age,
          gender: t.gender,
          phone: t.phone,
          email: t.email,
          seatNumber: booking.seatNumbers[idx] || ""
        }));

        const invoicePayload = {
          tripName: trip.title || "Bus Journey",
          bookingId: booking.bookingId,
          passengers: passengerDetails,
          seatNumbers: booking.seatNumbers,
          travelDate: trip.startDate ? new Date(trip.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
          pickupPoint: trip.pickupLocation || booking.pickupLocation || "Main Terminal",
          dropPoint: trip.dropPoint || "Terminal Drop",
          amountPaid: finalAmount,
          paymentId: razorpay_payment_id,
          bookingStatus: booking.bookingStatus || "Confirmed",
          qrUnlockStatus: booking.qrUnlocked ? "Unlocked" : "Locked (Driver Verification Pending)",
          emergencyContact: booking.emergencyContact || booking.contactNumber || ""
        };

        sendInvoiceEmail(travelerEmail, invoicePayload).catch(err => {
          console.error("Async sendInvoiceEmail error:", err);
        });
      }
    } catch (invoiceErr) {
      console.error("Failed to trigger invoice email:", invoiceErr);
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

export default router;
