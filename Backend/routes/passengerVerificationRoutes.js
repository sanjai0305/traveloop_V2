/**
 * passengerVerificationRoutes.js
 *
 * Handles persistent passenger OTP verification for the Traveloop booking flow.
 *
 * Routes:
 *   POST /api/passenger/send-otp               — Generate & send 6-digit OTP via email
 *   POST /api/passenger/verify-otp             — Verify OTP, persist verification in DB
 *   POST /api/passenger/update-phone-verified  — Update phone verification after Firebase Phone Auth
 *   GET  /api/passenger/check-verification     — Check if user is already verified
 */

import express from "express";
import crypto from "crypto";
import protect from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import redisClient from "../config/redis.js";
import { sendPassengerOtpEmail } from "../services/emailService.js";

const router = express.Router();

// ── Helper: OTP Redis key ───────────────────────────────────────────────────
const otpKey = (userId, phone) => `passenger_otp:${userId}:${phone}`;

// ── Helper: generate 6-digit OTP ───────────────────────────────────────────
const generateOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// ── Helper: safely set Redis with fallback ─────────────────────────────────
const tryRedisSet = async (key, value, ttlSeconds) => {
  try {
    if (!redisClient) return false;
    await redisClient.set(key, value, "EX", ttlSeconds);
    return true;
  } catch (err) {
    console.error("[PassengerOTP] Redis SET error:", err.message);
    return false;
  }
};

const tryRedisGet = async (key) => {
  try {
    if (!redisClient) return null;
    return await redisClient.get(key);
  } catch (err) {
    console.error("[PassengerOTP] Redis GET error:", err.message);
    return null;
  }
};

const tryRedisDel = async (key) => {
  try {
    if (!redisClient) return;
    await redisClient.del(key);
  } catch (err) {
    console.error("[PassengerOTP] Redis DEL error:", err.message);
  }
};

// ───────────────────────────────────────────────────────────────────────────
// POST /api/passenger/send-otp
// Body: { phone }
// Sends a 6-digit OTP to the logged-in user's email for passenger verification
// ───────────────────────────────────────────────────────────────────────────
router.post("/send-otp", protect, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^[6-9][0-9]{9}$/.test(String(phone).replace(/\D/g, "").slice(-10))) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit Indian mobile number."
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const otp = generateOtp();
    const redisStored = await tryRedisSet(otpKey(user._id, phone), otp, 300); // 5 min TTL

    if (!redisStored) {
      // Fallback: store OTP in a transient in-memory map (single-process only)
      // This gracefully degrades when Redis is unavailable
      if (!global._passengerOtpFallback) global._passengerOtpFallback = {};
      global._passengerOtpFallback[`${user._id}:${phone}`] = {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
      };
    }

    // Send OTP email
    let emailSent = false;
    try {
      await sendPassengerOtpEmail({
        to: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        otp,
        phone
      });
      emailSent = true;
    } catch (emailErr) {
      console.error("[PassengerOTP] Email send error:", emailErr.message);
    }

    const debugOtp = process.env.NODE_ENV !== "production" ? otp : undefined;

    return res.json({
      success: true,
      message: `Verification code sent to your registered email (${user.email}).`,
      email: user.email,
      ...(debugOtp && { debugOtp })
    });

  } catch (err) {
    console.error("[PassengerOTP] send-otp error:", err);
    return res.status(500).json({ success: false, message: "Server error sending OTP." });
  }
});

// ───────────────────────────────────────────────────────────────────────────
// POST /api/passenger/verify-otp
// Body: { phone, otp }
// Verifies OTP and persists passenger verification on the user document
// ───────────────────────────────────────────────────────────────────────────
router.post("/verify-otp", protect, async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: "Phone and OTP are required." });
    }

    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Attempt Redis lookup first
    let storedOtp = await tryRedisGet(otpKey(user._id, cleanPhone));

    // Fallback to in-memory store if Redis unavailable
    if (!storedOtp && global._passengerOtpFallback) {
      const fb = global._passengerOtpFallback[`${user._id}:${cleanPhone}`];
      if (fb && fb.expiresAt > Date.now()) {
        storedOtp = fb.otp;
      }
    }

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired or was never sent. Please request a new code."
      });
    }

    if (String(otp).trim() !== String(storedOtp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code. Please check and try again."
      });
    }

    // OTP matched — persist verification
    user.passengerVerified = true;
    user.verifiedPhone = `+91${cleanPhone}`;
    user.verifiedEmail = user.email;
    user.passengerVerifiedAt = new Date();
    user.verificationMethod = "OTP";

    // Also sync primary phone fields for consistency
    if (!user.phoneVerified && !user.primaryVerified) {
      user.phoneNumber = `+91${cleanPhone}`;
      user.primaryMobile = `+91${cleanPhone}`;
      user.phone = `+91${cleanPhone}`;
      user.phoneVerified = true;
      user.primaryVerified = true;
      user.verifiedAt = new Date();
    }

    await user.save();

    // Clean up OTP from stores
    await tryRedisDel(otpKey(user._id, cleanPhone));
    if (global._passengerOtpFallback) {
      delete global._passengerOtpFallback[`${user._id}:${cleanPhone}`];
    }

    return res.json({
      success: true,
      verified: true,
      message: "Phone number verified successfully!",
      user: {
        passengerVerified: user.passengerVerified,
        verifiedPhone: user.verifiedPhone,
        verifiedEmail: user.verifiedEmail,
        passengerVerifiedAt: user.passengerVerifiedAt,
        phoneVerified: user.phoneVerified,
        primaryVerified: user.primaryVerified,
        phone: user.phone,
      }
    });

  } catch (err) {
    console.error("[PassengerOTP] verify-otp error:", err);
    return res.status(500).json({ success: false, message: "Server error verifying OTP." });
  }
});

// ───────────────────────────────────────────────────────────────────────────
// GET /api/passenger/check-verification
// Query: ?phone=XXXXXXXXXX
// Returns { verified: true/false } — used on drawer open to skip OTP if already done
// ───────────────────────────────────────────────────────────────────────────
router.get("/check-verification", protect, async (req, res) => {
  try {
    const { phone } = req.query;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // If user has full primary phone verification, that counts too
    const primaryVerified = user.phoneVerified || user.primaryVerified || false;

    if (!phone) {
      // Just return account-level verification status
      return res.json({
        success: true,
        verified: primaryVerified || user.passengerVerified || false,
        verifiedPhone: user.verifiedPhone || user.phone || user.primaryMobile || "",
        verifiedEmail: user.verifiedEmail || user.email || "",
        passengerVerifiedAt: user.passengerVerifiedAt || user.verifiedAt || null,
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    const storedPhone = (user.verifiedPhone || user.phone || user.primaryMobile || "")
      .replace(/\D/g, "").slice(-10);

    // Verified if:
    // 1. passengerVerified flag is set AND phone matches, OR
    // 2. phoneVerified/primaryVerified AND phone matches
    const phoneMatches = storedPhone === cleanPhone;
    const isVerified = (user.passengerVerified || primaryVerified) && phoneMatches;

    return res.json({
      success: true,
      verified: isVerified,
      verifiedPhone: user.verifiedPhone || user.phone || user.primaryMobile || "",
      verifiedEmail: user.verifiedEmail || user.email || "",
      passengerVerifiedAt: user.passengerVerifiedAt || user.verifiedAt || null,
    });

  } catch (err) {
    console.error("[PassengerOTP] check-verification error:", err);
    return res.status(500).json({ success: false, message: "Server error checking verification." });
  }
});

// ───────────────────────────────────────────────────────────────────────────
// POST /api/passenger/update-phone-verified
// Body: { phone, phoneVerified }
// Updates phone verification status after Firebase Phone Auth verification
// ───────────────────────────────────────────────────────────────────────────
router.post("/update-phone-verified", protect, async (req, res) => {
  try {
    const { phone, phoneVerified } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required." });
    }

    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Update phone verification status
    user.passengerVerified = phoneVerified;
    user.verifiedPhone = `+91${cleanPhone}`;
    user.verifiedEmail = user.email;
    user.passengerVerifiedAt = new Date();
    user.verificationMethod = "Firebase Phone Auth";

    // Also sync primary phone fields for consistency
    if (phoneVerified) {
      user.phoneNumber = `+91${cleanPhone}`;
      user.primaryMobile = `+91${cleanPhone}`;
      user.phone = `+91${cleanPhone}`;
      user.phoneVerified = true;
      user.primaryVerified = true;
      user.verifiedAt = new Date();
    }

    await user.save();

    return res.json({
      success: true,
      verified: phoneVerified,
      message: "Phone verification status updated successfully!",
      user: {
        passengerVerified: user.passengerVerified,
        verifiedPhone: user.verifiedPhone,
        verifiedEmail: user.verifiedEmail,
        passengerVerifiedAt: user.passengerVerifiedAt,
        phoneVerified: user.phoneVerified,
        primaryVerified: user.primaryVerified,
        phone: user.phone,
      }
    });

  } catch (err) {
    console.error("[PassengerOTP] update-phone-verified error:", err);
    return res.status(500).json({ success: false, message: "Server error updating phone verification." });
  }
});

export default router;
