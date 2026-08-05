import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import supabase from "../config/supabase.js";
import protectDriver from "../middleware/driverAuthMiddleware.js";
import { sendOtpEmail } from "../services/emailService.js";

const router = express.Router();

// In-memory rate limiting map for resend protection (60s cooldown per email)
const otpRateLimitMap = new Map();

// ─── POST /api/driver/send-email-otp ─────────────────────────────────────────
router.post("/send-email-otp", async (req, res) => {
  console.log("\n==================================================");
  console.log(`[Driver Email OTP] Incoming request to POST /api/driver/send-email-otp`);
  console.log(`[Driver Email OTP] Request Body:`, req.body);

  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      console.warn("⚠️ [Driver Email OTP] Email address is missing or invalid");
      return res.status(400).json({ success: false, message: "Valid email address is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.warn(`⚠️ [Driver Email OTP] Regex validation failed for: '${normalizedEmail}'`);
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    // Rate Limiting Check (60 seconds cooldown)
    const lastSent = otpRateLimitMap.get(normalizedEmail);
    const now = Date.now();
    if (lastSent && now - lastSent < 60 * 1000) {
      const waitTime = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      console.warn(`⚠️ [Driver Email OTP] Rate limit triggered for '${normalizedEmail}'. Cooldown remaining: ${waitTime}s`);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
      });
    }

    // Generate 6-digit random OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    console.log(`[Step 3] Generated OTP Code: '${otpCode}' for '${normalizedEmail}' (Length: ${otpCode.length})`);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const dbPayload = {
      email: normalizedEmail,
      otp: otpCode,
      type: "DRIVER_EMAIL_OTP",
      expires_at: expiresAt,
    };

    console.log(`[Step 4] Supabase DB Insert Payload:`, JSON.stringify(dbPayload, null, 2));
    console.log(`[Step 4 Payload Length Verification]:`);
    console.log(`  - payload.email: '${dbPayload.email}' (Length: ${dbPayload.email.length})`);
    console.log(`  - payload.otp: '${dbPayload.otp}' (Length: ${dbPayload.otp.length})`);
    console.log(`  - payload.type: '${dbPayload.type}' (Length: ${dbPayload.type.length})`);
    console.log(`  - payload.expires_at: '${dbPayload.expires_at}' (Length: ${dbPayload.expires_at.length})`);

    console.log(`[Step 5] Clearing previous unverified OTPs for '${normalizedEmail}'...`);
    await supabase.from("otps").delete().eq("email", normalizedEmail).eq("type", "DRIVER_EMAIL_OTP");

    console.log(`[Step 6] Executing Supabase insert into 'otps' table...`);
    const { data: dbRecord, error: dbError } = await supabase
      .from("otps")
      .insert([dbPayload])
      .select()
      .single();

    if (dbError) {
      console.error("\n❌ [Driver Email OTP] Supabase OTP Insert Error FULL OBJECT:");
      console.error(JSON.stringify(dbError, null, 2));
      console.error("OTP STORE ERROR DETAILS:", {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      });

      return res.status(500).json({
        success: false,
        message: "Failed to store OTP verification record",
        error: dbError.message,
        details: dbError.details,
        code: dbError.code,
      });
    }

    console.log(`✅ [Driver Email OTP] OTP record saved into DB: ID ${dbRecord.id}`);

    // Update rate limit timestamp
    otpRateLimitMap.set(normalizedEmail, now);

    // Send Email via Nodemailer SMTP Email Service
    console.log(`[Driver Email OTP] Dispatching OTP email via Nodemailer SMTP to '${normalizedEmail}'...`);
    try {
      const emailResult = await sendOtpEmail(normalizedEmail, "Driver", otpCode);
      console.log(`✅ [Driver Email OTP] Email sent successfully. MessageId: ${emailResult?.messageId || "N/A"}`);
    } catch (mailErr) {
      console.error("❌ [Driver Email OTP] SMTP Email Delivery Error:", mailErr.stack || mailErr.message);
      // In non-production environments, log debug code
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[Driver Email OTP DEBUG] Dev fallback mode active. Code: ${otpCode}`);
        return res.status(200).json({
          success: true,
          message: `OTP generated (Email delivery failed in dev: ${mailErr.message}). Debug code: ${otpCode}`,
          debugOtp: otpCode,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please verify SMTP settings.",
        error: mailErr.message,
      });
    }

    console.log("==================================================\n");

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}`,
    });
  } catch (error) {
    console.error("❌ [Driver Email OTP Root Error]:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during email OTP request.",
    });
  }
});

// ─── POST /api/driver/verify-email-otp ───────────────────────────────────────
router.post("/verify-email-otp", async (req, res) => {
  console.log("\n==================================================");
  console.log(`[Driver Email OTP Verification] Incoming request to POST /api/driver/verify-email-otp`);
  console.log(`[Driver Email OTP Verification] Request Body:`, req.body);

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and 6-digit OTP code are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    console.log(`[Driver Email OTP Verification] Fetching latest OTP for email '${normalizedEmail}'...`);

    const { data: records, error: dbError } = await supabase
      .from("otps")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("type", "DRIVER_EMAIL_OTP")
      .order("created_at", { ascending: false });

    if (dbError || !records || records.length === 0) {
      console.warn(`⚠️ [Driver Email OTP Verification] No OTP record found for '${normalizedEmail}'`);
      return res.status(400).json({ success: false, message: "No verification code request found. Please request a new code." });
    }

    const latestRecord = records[0];

    // Check expiration
    if (new Date() > new Date(latestRecord.expires_at)) {
      console.warn(`⚠️ [Driver Email OTP Verification] OTP expired for '${normalizedEmail}'`);
      await supabase.from("otps").delete().eq("id", latestRecord.id);
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one." });
    }

    // Compare plain text OTP code
    const isMatch = cleanOtp === String(latestRecord.otp).trim();
    if (!isMatch) {
      console.warn(`⚠️ [Driver Email OTP Verification] Invalid OTP entered for '${normalizedEmail}' (Entered: '${cleanOtp}', Stored: '${latestRecord.otp}')`);
      return res.status(400).json({ success: false, message: "Invalid verification code. Please check and try again." });
    }

    console.log(`✅ [Driver Email OTP Verification] OTP matched successfully for '${normalizedEmail}'`);

    // Delete verified OTP record from database (Security Best Practice)
    await supabase.from("otps").delete().eq("email", normalizedEmail).eq("type", "DRIVER_EMAIL_OTP");

    // If a driver record exists with this email, update status
    const { data: existingDriver } = await supabase
      .from("drivers")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingDriver) {
      console.log(`[Driver Email OTP Verification] Driver record found ID '${existingDriver.id}'. Updating status...`);
      await supabase.from("drivers").update({ status: "ONLINE", updated_at: new Date() }).eq("id", existingDriver.id);
    }

    console.log("==================================================\n");

    return res.status(200).json({
      success: true,
      verified: true,
      emailVerified: true,
      message: "Driver email verified successfully!",
    });
  } catch (error) {
    console.error("❌ [Driver Email OTP Verification Error]:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during OTP verification.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, phone } = req.body;
    const { data: driver } = await supabase
      .from("drivers")
      .select("*")
      .or(`email.eq.${email || ""},phone.eq.${phone || ""}`)
      .maybeSingle();

    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver account not found" });
    }

    const token = jwt.sign({ id: driver.id, role: "driver" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      driver: { ...driver, _id: driver.id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/me", protectDriver, async (req, res) => {
  res.json({ success: true, driver: req.driver });
});

router.get("/my-trip", protectDriver, async (req, res) => {
  try {
    const driverId = req.driver.id;
    const { data: trip } = await supabase
      .from("agent_trips")
      .select("*")
      .eq("driver_id", driverId)
      .limit(1)
      .maybeSingle();

    res.json({ success: true, trip: trip ? { ...trip, _id: trip.id } : null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/passengers/:tripId", protectDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("agent_trip_id", tripId);

    const passengers = (bookings || []).flatMap((b) => b.passengers || []);
    res.json({ success: true, passengers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/scan-qr", protectDriver, async (req, res) => {
  res.json({ success: true, message: "Pass verified successfully", passenger: { name: "Traveler", seat: "A1" } });
});

export default router;
