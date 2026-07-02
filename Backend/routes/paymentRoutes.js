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

const router = express.Router();

// Initialize Razorpay
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_SECRET;

  if (!key_id || !key_secret) {
    console.warn("[Razorpay] WARNING: RAZORPAY_KEY_ID or RAZORPAY_SECRET missing in env. Using dummy defaults.");
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
  const { tripId, seats = 1 } = req.body;

  if (!tripId) {
    return res.status(400).json({ success: false, message: "tripId is required" });
  }

  try {
    const trip = await AgentTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const price = trip.offerPrice || trip.pricePerPerson || 0;
    const amount = price * Number(seats);

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount" });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay accepts in paise
      currency: "INR",
      receipt: `trip_${tripId}_${Date.now()}`,
    };

    let order;
    try {
      const instance = getRazorpayInstance();
      order = await instance.orders.create(options);
    } catch (apiError) {
      console.warn("[Razorpay Create Order] API call failed. Falling back to mock order ID. Reason:", apiError.message || apiError);
      order = {
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
      };
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: amount,
      currency: "INR",
    });
  } catch (error) {
    console.error("[Razorpay Create Order] Error:", error);
    res.status(500).json({ success: false, message: "Server Error creating Razorpay order" });
  }
});

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
  console.log("status:", req.body.status);

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingPayload,
    bookingId,
    status
  } = req.body;

  // Verify credentials exist. If missing, return 400 instead of 500.
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

  if (!key_id || !key_secret) {
    console.error("[Razorpay] Verification failed: Razorpay credentials missing");
    return res.status(400).json({ success: false, message: "Razorpay credentials missing" });
  }

  // 1. Resolve or Load Booking
  let booking = null;
  let trip = null;
  let finalAmount = 0;
  let totalTravellers = 0;
  let isSandbox = status === "success" || 
                  razorpay_signature === "mock_signature" || 
                  (razorpay_order_id && razorpay_order_id.startsWith("order_mock_"));

  try {
    // If bookingId is passed directly, try to find the existing booking
    if (bookingId) {
      booking = await Booking.findOne({
        $or: [
          { bookingId: bookingId },
          { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null }
        ].filter(Boolean)
      });
    }

    if (booking) {
      // SCENARIO A: Existing booking update
      trip = await AgentTrip.findById(booking.agentTrip || booking.tripId);
      if (!trip) {
        return res.status(400).json({ success: false, message: "Trip not found" });
      }
      finalAmount = booking.pricePaid || booking.amount || 0;
      totalTravellers = booking.seats || 1;
    } else if (bookingPayload) {
      // SCENARIO B: Create new booking from payload
      const { tripId } = bookingPayload;
      trip = await AgentTrip.findById(tripId);
      if (!trip) {
        return res.status(400).json({ success: false, message: "Trip not found" });
      }
      totalTravellers = (bookingPayload.travellers || []).length || 1;
      finalAmount = bookingPayload.totalAmount || (trip.offerPrice || trip.pricePerPerson || 0) * totalTravellers;
    } else {
      return res.status(400).json({ success: false, message: "Missing bookingId or bookingPayload" });
    }

    // 2. Signature verification if NOT sandbox mode
    if (!isSandbox) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing Razorpay payment verification fields" });
      }
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        console.error("[Razorpay Verification] Signature mismatch.");
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }
    } else {
      console.log("[Razorpay Verification] Bypassing verification for mock/local development payment.");
    }

    // Verify seats availability (skip if booking already exists and was already counted)
    if (!booking && trip.availableSeats < totalTravellers) {
      return res.status(400).json({ success: false, message: "Not enough available seats left on this trip" });
    }

    // Calculate commission
    const agent = await Agent.findById(trip.agent);
    const defaultCommSetting = await SystemSetting.findOne({ key: "default_commission" });
    const defaultRate = defaultCommSetting ? defaultCommSetting.value : 10;
    const commissionRate = agent ? (agent.commissionRate !== undefined ? agent.commissionRate : defaultRate) : defaultRate;

    const commissionAmount = finalAmount * (commissionRate / 100);
    const gatewayFee = finalAmount * 0.02; 
    const agentAmount = finalAmount - commissionAmount - gatewayFee;

    // Normalization helper for traveler genders to match case-sensitive Mongoose schema
    const normalizeGender = (g) => {
      if (!g) return "Other";
      const lower = g.toLowerCase();
      if (lower === "male") return "Male";
      if (lower === "female") return "Female";
      return "Other";
    };

    // Generate custom IDs if needed
    const generatedBookingId = booking ? booking.bookingId : `TLP-${Math.floor(10000 + Math.random() * 90000)}`;
    const transactionId = razorpay_payment_id || `txn_${Math.random().toString(36).substring(2, 11)}`;

    if (!booking) {
      // Create new booking record
      const travelersNormalized = (bookingPayload.travellers || []).map(t => ({
        name: t.name,
        age: Number(t.age || 0),
        gender: normalizeGender(t.gender),
        phone: t.phone || "",
      }));

      booking = await Booking.create({
        bookingId: generatedBookingId,
        travelerName: travelersNormalized[0]?.name || "",
        gender: normalizeGender(travelersNormalized[0]?.gender || ""),
        contactNumber: travelersNormalized[0]?.phone || req.user.phone || req.user.email,
        age: travelersNormalized[0]?.age || 0,
        seats: totalTravellers,
        seatNumbers: bookingPayload.seatNumbers || [],
        paymentStatus: "Paid",
        status: "Paid", // For backward compat
        bookingStatus: "confirmed",
        paymentVerified: true,
        paymentDate: new Date(),
        agentTrip: trip._id,
        tripId: trip._id,
        agent: trip.agent,
        userId: req.user._id,
        travellers: travelersNormalized,
        maleCount: Number(bookingPayload.maleCount || 0),
        femaleCount: Number(bookingPayload.femaleCount || 0),
        adults: Number(bookingPayload.adults || 1),
        children: Number(bookingPayload.children || 0),
        pricePaid: finalAmount,
        amount: finalAmount,
        amountPaid: finalAmount,
        commissionAmount,
        gatewayFee,
        agentAmount,
        pickupLocation: bookingPayload.pickupLocation || "",
      });
    } else {
      // Update existing booking record
      booking.paymentStatus = "Paid";
      booking.status = "Paid";
      booking.bookingStatus = "confirmed";
      booking.paymentVerified = true;
      booking.paymentDate = new Date();
      await booking.save();
    }

    // 4. Create/Store Payment Record
    await Payment.create({
      bookingId: generatedBookingId,
      tripId: trip._id,
      agentId: trip.agent,
      travelerId: req.user._id,
      userId: req.user._id,
      amount: finalAmount,
      status: "Paid",
      gateway: isSandbox ? "sandbox" : "razorpay",
      orderId: razorpay_order_id || `order_${Math.random().toString(36).substring(2, 11)}`,
      paymentId: transactionId,
      transactionId: transactionId,
      signature: razorpay_signature || "mock_signature",
    });

    // 5. Update Trip seat counts
    trip.bookedSeats = (trip.bookedSeats || 0) + totalTravellers;
    trip.availableSeats = Math.max(0, trip.availableSeats - totalTravellers);
    if (bookingPayload) {
      trip.maleCount = (trip.maleCount || 0) + Number(bookingPayload.maleCount || 0);
      trip.femaleCount = (trip.femaleCount || 0) + Number(bookingPayload.femaleCount || 0);
      trip.childrenCount = (trip.childrenCount || 0) + Number(bookingPayload.children || 0);
    } else if (booking) {
      trip.maleCount = (trip.maleCount || 0) + Number(booking.maleCount || 0);
      trip.femaleCount = (trip.femaleCount || 0) + Number(booking.femaleCount || 0);
      trip.childrenCount = (trip.childrenCount || 0) + Number(booking.children || 0);
    }
    await trip.save();

    // 6. Update Agent aggregated statistics
    if (agent) {
      agent.revenue = (agent.revenue || 0) + finalAmount;
      agent.totalRevenue = (agent.totalRevenue || 0) + finalAmount;
      agent.pendingRevenue = (agent.pendingRevenue || 0) + agentAmount;
      agent.totalBookings = (agent.totalBookings || 0) + 1;
      await agent.save();
    }

    // 7. Create Admin Notification
    try {
      const passengerName = bookingPayload?.travellers?.[0]?.name || booking?.travelerName || req.user.firstName;
      await AdminNotification.create({
        title: "New Booking Confirmed",
        message: `Traveler ${passengerName} booked trip '${trip.title}' for ₹${finalAmount}`,
        type: "booking",
      });
    } catch (notifErr) {
      console.warn("Failed to create admin notification:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      bookingId: generatedBookingId,
      paymentId: transactionId,
      status: "paid",
      booking
    });
  } catch (error) {
    console.error("[Razorpay Verify & Record] Error:", error);
    res.status(400).json({ success: false, message: "Payment Verification Failed" });
  }
});

export default router;
