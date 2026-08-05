import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import protect from "../middleware/authMiddleware.js";
import supabase from "../config/supabase.js";

const router = express.Router();

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_dummykeyid";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "dummysecretvalue";
  return new Razorpay({ key_id, key_secret });
};

// POST /api/payment/create-order
// Called by UPIPaymentModal when no pre-existing booking draft exists
router.post("/create-order", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId, seats = 1, bookingId: existingBookingId, couponCode, amount: rawAmount } = req.body;

    // Fetch trip to compute price
    const { data: trip } = await supabase
      .from("agent_trips")
      .select("price_per_person, title")
      .eq("id", tripId)
      .maybeSingle();

    const pricePerPerson = trip?.price_per_person || rawAmount || 1000;
    const totalAmount = parseFloat(rawAmount) || pricePerPerson * (parseInt(seats) || 1);
    const amountPaise = Math.round(totalAmount * 100);

    // Create or reuse booking draft
    let bookingDraftId = existingBookingId || null;
    if (!bookingDraftId) {
      const { data: draft, error: draftErr } = await supabase
        .from("bookings")
        .insert([{
          user_id: userId,
          agent_trip_id: tripId,
          total_amount: totalAmount,
          final_amount: totalAmount,
          booking_status: "DRAFT",
          payment_status: "PENDING",
          booking_code: `TLP-${Date.now()}`,
        }])
        .select()
        .single();

      if (draftErr) throw draftErr;
      bookingDraftId = draft.id;
    }

    // Create Razorpay order via SDK
    const instance = getRazorpayInstance();
    let orderId = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    try {
      const rzpOrder = await instance.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `rcpt_${(bookingDraftId || "").slice(0, 8)}_${Date.now()}`,
        notes: { bookingId: bookingDraftId, userId, tripId: tripId || "" },
      });
      orderId = rzpOrder.id;
      console.log("✅ [Razorpay Order Created /payment/create-order]:", rzpOrder.id);
    } catch (rzpErr) {
      console.warn("⚠️ [Razorpay order creation fallback]:", rzpErr.message);
    }

    res.json({
      success: true,
      orderId,
      bookingDraftId,
      amount: totalAmount,
      amountPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykeyid",
      razorpayKey: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykeyid",
    });
  } catch (error) {
    console.error("❌ [Payment /create-order error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/payment/verify  AND  /api/payment/verify-payment
// Both aliases do the same thing: verify signature and confirm booking
const handleVerifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      tripId,
      totalAmount,
    } = req.body;

    const userId = req.user.id;

    // Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "";
    if (keySecret && keySecret !== "dummysecretvalue" && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        console.warn("[Payment Verify] Signature mismatch");
        return res.status(400).json({ success: false, message: "Payment signature verification failed" });
      }
    }

    let confirmedBooking;

    // If we have a booking draft ID, update it
    if (bookingId) {
      const { data: updated, error: updateErr } = await supabase
        .from("bookings")
        .update({
          booking_status: "CONFIRMED",
          payment_status: "PAID",
        })
        .or(`id.eq.${bookingId},booking_code.eq.${bookingId}`)
        .select()
        .single();

      if (updateErr) {
        console.warn("[Payment Verify] Could not update booking draft, creating new:", updateErr.message);
      } else {
        confirmedBooking = updated;
      }
    }

    // Fallback: create new booking record if no draft existed
    if (!confirmedBooking) {
      const { data: newBooking, error: insertErr } = await supabase
        .from("bookings")
        .insert([{
          user_id: userId,
          agent_trip_id: tripId,
          total_amount: totalAmount || 1000,
          final_amount: totalAmount || 1000,
          payment_status: "PAID",
          booking_status: "CONFIRMED",
          booking_code: `TLP-${Date.now()}`,
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;
      confirmedBooking = newBooking;
    }

    // Record payment details
    try {
      await supabase.from("payments").insert([{
        booking_id: confirmedBooking.id,
        user_id: userId,
        amount: confirmedBooking.total_amount,
        currency: "INR",
        status: "PAID",
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      }]);
    } catch (payErr) {
      console.warn("[Payment Verify] payments table insert failed (non-fatal):", payErr.message);
    }

    console.log("✅ [Payment Verified] Booking confirmed:", confirmedBooking.id);

    res.json({
      success: true,
      message: "Payment verified successfully",
      bookingId: confirmedBooking.booking_code || confirmedBooking.id,
      booking: {
        ...confirmedBooking,
        _id: confirmedBooking.id,
        bookingId: confirmedBooking.booking_code || confirmedBooking.id,
        totalAmount: confirmedBooking.total_amount,
        finalAmount: confirmedBooking.final_amount,
        bookingStatus: confirmedBooking.booking_status,
        paymentStatus: confirmedBooking.payment_status,
      },
    });
  } catch (error) {
    console.error("❌ [Payment verify error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register both aliases so all frontend callers work
router.post("/verify", protect, handleVerifyPayment);
router.post("/verify-payment", protect, handleVerifyPayment);

// Coupon validation stub
router.post("/validate-coupon", protect, async (req, res) => {
  try {
    const { couponCode, tripId, amount } = req.body;

    if (!couponCode) {
      return res.status(400).json({ success: false, message: "Coupon code required" });
    }

    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid or expired coupon code" });
    }

    const discount = coupon.discount_type === "PERCENTAGE"
      ? Math.round((amount * coupon.discount_value) / 100)
      : coupon.discount_value;

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        finalAmount: Math.max(0, amount - discount),
      },
    });
  } catch (error) {
    console.error("❌ [Coupon validate error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
