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
import BookingService from "../services/BookingService.js";

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
  const { tripId, seats = 1 } = req.body;

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

    const options = {
      amount: Math.round(amount * 100), // Razorpay accepts in paise
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

  if (expectedSignature !== razorpay_signature) {
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

    if (booking) {
      // SCENARIO A: Existing booking update
      trip = await AgentTrip.findById(booking.tripId);
      if (!trip) {
        return res.status(400).json({ success: false, message: "Trip not found" });
      }
      finalAmount = booking.pricePaid || booking.amount || 0;
      totalTravellers = booking.seats || 1;

      // Verify seats availability (if not already counted)
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
        contactNumber: bookingPayload.travellers?.[0]?.phone || req.user.phone || req.user.email,
      });
      booking = result.booking;
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

export default router;
