import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";
import admin from "../config/firebaseAdmin.js";
import { isValidEmail, isValidPhone } from "../utils/validators.js";
import { sendWelcomeEmail, sendTravelerOtpEmail } from "../services/emailService.js";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth as firebaseAuth } from "../config/firebase.js";
import { createUserWithEmailAndPassword, signInAnonymously } from "firebase/auth";

// GENERATE TOKEN
const generateToken = (userObj) => {
  const id = typeof userObj === "object" ? userObj.id : userObj;
  const firebase_uid = typeof userObj === "object" ? (userObj.firebase_uid || userObj.google_id) : undefined;
  const email = typeof userObj === "object" ? userObj.email : undefined;
  const role = typeof userObj === "object" ? (userObj.role || "user") : "user";

  return jwt.sign(
    { id, firebase_uid, role, email },
    process.env.JWT_SECRET || "traveloop_local_dev_secret_key_2026",
    { expiresIn: "7d" }
  );
};

// SEND OTP
export const sendOtp = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role } = req.body;
    const isAgent = role === "agent";

    if (isAgent) {
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
      }
    } else {
      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: "First Name, Last Name, Email, and Phone are required.",
        });
      }
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const emailKey = email.trim().toLowerCase();

    if (!isAgent) {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", emailKey)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered.",
        });
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Supabase otps table
    await supabase.from("otps").insert([{
      email: emailKey,
      otp: otpCode,
      type: "VERIFICATION",
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }]);

    try {
      await sendTravelerOtpEmail(emailKey, otpCode);
    } catch (mailErr) {
      console.warn("Nodemailer OTP notice:", mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email address.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// VERIFY OTP & SIGNUP
export const verifyOtp = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, otpCode, otp, city, country } = req.body;
    const actualOtp = otpCode || otp;

    if (!email || !actualOtp) {
      return res.status(400).json({ success: false, message: "Email and Verification Code are required." });
    }

    const emailKey = email.trim().toLowerCase();

    // Check OTP in Supabase
    const { data: otpRow } = await supabase
      .from("otps")
      .select("*")
      .eq("email", emailKey)
      .eq("otp", actualOtp)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check and try again.",
      });
    }

    if (!password) {
      const otpToken = jwt.sign(
        { email: emailKey, otpVerified: true },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );
      return res.status(200).json({
        success: true,
        message: "Email verified successfully.",
        otpToken,
      });
    }

    // Hash password & create user in Supabase
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: newUser, error: userErr } = await supabase
      .from("users")
      .insert([{
        name: `${firstName} ${lastName}`.trim(),
        email: emailKey,
        phone,
        password: hashedPassword,
        is_verified: true,
      }])
      .select()
      .single();

    if (userErr || !newUser) {
      return res.status(400).json({
        success: false,
        message: userErr?.message || "User registration failed.",
      });
    }

    try {
      sendWelcomeEmail(emailKey, firstName);
    } catch (e) {
      console.warn("Welcome email notice:", e.message);
    }

    res.status(201).json({
      success: true,
      message: "User registered and verified successfully.",
      user: {
        _id: newUser.id,
        id: newUser.id,
        firstName,
        lastName,
        email: newUser.email,
        phone: newUser.phone,
        acceptedTerms: true,
      },
      token: generateToken(newUser.id),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REGISTER USER DIRECTLY
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, city, country, referralCode } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "Please enter all fields" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const emailKey = email.trim().toLowerCase();

    const { data: userExists } = await supabase
      .from("users")
      .select("id")
      .eq("email", emailKey)
      .maybeSingle();

    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRefCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: newUser, error: createErr } = await supabase
      .from("users")
      .insert([{
        name: `${firstName} ${lastName}`.trim(),
        email: emailKey,
        phone,
        password: hashedPassword,
        referral_code: userRefCode,
        referred_by: referralCode ? referralCode.trim().toUpperCase() : null,
      }])
      .select()
      .single();

    if (createErr || !newUser) {
      return res.status(400).json({ success: false, message: createErr?.message || "Registration failed" });
    }

    try {
      sendWelcomeEmail(emailKey, firstName);
    } catch (e) {
      console.warn("Welcome email notice:", e.message);
    }

    res.status(201).json({
      success: true,
      message: "Registration Successful",
      user: {
        _id: newUser.id,
        id: newUser.id,
        firstName,
        lastName,
        email: newUser.email,
        phone: newUser.phone,
        referralCode: newUser.referral_code,
        acceptedTerms: true,
      },
      token: generateToken(newUser.id),
      referral: { used: false },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const emailKey = email.trim().toLowerCase();

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", emailKey)
      .maybeSingle();

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid Email" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid Password" });
    }

    const nameParts = (user.name || "Traveler User").split(" ");
    const firstName = nameParts[0] || "Traveler";
    const lastName = nameParts.slice(1).join(" ") || "User";

    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        _id: user.id,
        id: user.id,
        firstName,
        lastName,
        email: user.email,
        phone: user.phone || "",
        avatar: user.avatar || "",
        acceptedTerms: true,
      },
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET CURRENT USER PROFILE
export const getMe = async (req, res) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const nameParts = (user.name || "Traveler User").split(" ");
    const firstName = nameParts[0] || "Traveler";
    const lastName = nameParts.slice(1).join(" ") || "User";

    const { data: userTrips } = await supabase
      .from("trips")
      .select("id")
      .eq("user_id", user.id);

    const tripCount = userTrips?.length || 0;

    const achievements = [
      { title: "First Trip Created", description: "Created your first trip", icon: "🏆", unlocked: tripCount >= 1 },
      { title: "Explorer", description: "Created 5 trips", icon: "🏆", unlocked: tripCount >= 5 },
      { title: "Planner Pro", description: "Created 10 trips", icon: "🏆", unlocked: tripCount >= 10 },
    ];

    res.status(200).json({
      success: true,
      user: {
        _id: user.id,
        id: user.id,
        firstName,
        lastName,
        name: user.name || `${firstName} ${lastName}`,
        email: user.email,
        phone: user.phone || "",
        avatar: user.avatar || "",
        xp: user.rewards_points || 0,
        acceptedTerms: true,
        privacyAccepted: true,
        phoneVerified: true,
        termsVersion: "2026-07",
        role: user.role || "user",
      },
      achievements,
      stats: {
        tripsCreated: tripCount,
        unlockedCount: achievements.filter((a) => a.unlocked).length,
        lockedCount: achievements.filter((a) => !a.unlocked).length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GOOGLE AUTH CALLBACK
export const googleAuth = async (req, res) => {
  console.log("\n[Google Auth] Received Google authentication request");
  try {
    const { idToken, token: reqToken } = req.body;
    const googleToken = idToken || reqToken;

    if (!googleToken) {
      console.warn("⚠️ [Google Auth] No token provided in request body");
      return res.status(400).json({ success: false, message: "Token is required." });
    }

    console.log("[Google Auth] idToken received. Verifying with Firebase Admin...");
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(googleToken);
      console.log("✅ [Google Auth] Firebase verifyIdToken() successful");
    } catch (err) {
      console.error("❌ [Google Auth] Firebase verifyIdToken() failed:", err.message);
      return res.status(401).json({ success: false, message: "Invalid Firebase Token", error: err.message });
    }

    const sub = decoded.uid || decoded.sub;
    const email = (decoded.email || "").toLowerCase().trim();
    const name = decoded.name || decoded.displayName || "Google User";
    const picture = decoded.picture || decoded.photoURL || "";

    console.log(`[Google Auth] Extracted details - Email: '${email}', UID/Sub: '${sub}', Name: '${name}'`);

    if (!email) {
      console.error("❌ [Google Auth] No email extracted from Firebase token");
      return res.status(400).json({ success: false, message: "Email could not be extracted from Google token." });
    }

    console.log(`[Google Auth] Performing Supabase user lookup for email '${email}' or sub '${sub}'...`);
    let user = null;

    try {
      // 1. First search by exact email match
      const { data: byEmail, error: emailErr } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (emailErr) {
        console.error("⚠️ [Google Auth] Supabase lookup by email error:", {
          message: emailErr.message,
          details: emailErr.details,
          hint: emailErr.hint,
          code: emailErr.code,
        });
      }
      user = byEmail;

      // 2. If not found by email, search by google_id
      if (!user && sub) {
        const { data: byGoogleId, error: googleErr } = await supabase
          .from("users")
          .select("*")
          .eq("google_id", sub)
          .maybeSingle();

        if (googleErr) {
          console.error("⚠️ [Google Auth] Supabase lookup by google_id error:", {
            message: googleErr.message,
            details: googleErr.details,
            hint: googleErr.hint,
            code: googleErr.code,
          });
        }
        user = byGoogleId;
      }
    } catch (dbEx) {
      console.error("⚠️ [Google Auth] Supabase lookup exception:", dbEx.message);
    }

    if (!user) {
      console.log(`[Google Auth] User not found in database. Automatically creating new user for '${email}'...`);
      
      const insertPayload = {
        name: name || "Google User",
        email,
        google_id: sub,
        avatar: picture || null,
        is_verified: true,
        role: "user",
      };

      console.log("[Google Auth] Attempting Supabase user insert with payload:", insertPayload);

      let { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([insertPayload])
        .select()
        .single();

      if (insertError) {
        console.error("❌ [Google Auth] Supabase User Insert Failed:", {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        });

        // Duplicate email fallback / race condition handling (Postgres 23505)
        if (insertError.code === "23505" || insertError.message?.toLowerCase().includes("unique constraint")) {
          console.warn(`⚠️ [Google Auth] Race condition/duplicate constraint hit. Refetching user by email '${email}'...`);
          const { data: reFetched } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();
          newUser = reFetched;
        }
      }

      if (!newUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to create user account.",
          error: {
            message: insertError?.message || "User creation failed.",
            details: insertError?.details || null,
            hint: insertError?.hint || null,
            code: insertError?.code || null,
          },
        });
      }

      user = newUser;
      console.log(`✅ [Google Auth] New user created successfully: ID ${user.id}`);
    } else {
      console.log(`✅ [Google Auth] Existing Supabase user found: ID ${user.id} (${user.email})`);
      if (!user.google_id && sub) {
        console.log(`[Google Auth] Updating missing google_id for user ${user.id}...`);
        const { error: updateErr } = await supabase
          .from("users")
          .update({ google_id: sub })
          .eq("id", user.id);
        
        if (updateErr) {
          console.error("⚠️ [Google Auth] Failed to update google_id:", {
            message: updateErr.message,
            details: updateErr.details,
            hint: updateErr.hint,
            code: updateErr.code,
          });
        }
      }
    }

    if (!user || !user.id) {
      console.error("❌ [Google Auth] User resolution resulted in null/invalid user object");
      return res.status(500).json({
        success: false,
        message: "Internal server error: Unable to resolve user profile.",
      });
    }

    console.log(`[Google Auth] Generating JWT for User ID: ${user.id}...`);
    const jwtToken = generateToken(user);
    console.log("✅ [Google Auth] JWT generated successfully");

    const nameParts = (user.name || name || "Google User").trim().split(" ");
    const firstName = nameParts[0] || "Google";
    const lastName = nameParts.slice(1).join(" ") || "User";

    return res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        _id: user.id,
        id: user.id,
        firstName,
        lastName,
        name: user.name || name,
        email: user.email,
        phone: user.phone || "",
        avatar: user.avatar || picture,
        acceptedTerms: true,
        privacyAccepted: true,
        phoneVerified: true,
        termsVersion: "2026-07",
        firebaseUid: sub,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("❌ [Google Auth Root Cause Exception]:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during Google Authentication.",
      error: error.message,
    });
  }
};

// ACCEPT TERMS & CONDITIONS
export const acceptTerms = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Terms accepted successfully.",
  });
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", (email || "").trim().toLowerCase())
    .maybeSingle();

  if (!user) {
    return res.status(404).json({ success: false, message: "No account found with this email address." });
  }

  return res.status(200).json({ success: true, message: "Email verified. Proceed with password reset." });
};

// VALIDATE EMAIL AVAILABILITY
export const validateEmail = async (req, res) => {
  const { email } = req.body;
  const { data: userExists } = await supabase
    .from("users")
    .select("id")
    .eq("email", (email || "").trim().toLowerCase())
    .maybeSingle();

  if (userExists) {
    return res.status(400).json({ success: false, message: "Email is already registered." });
  }

  return res.status(200).json({ success: true, message: "Email is available." });
};

// VALIDATE REFERRAL CODE
export const validateReferralCode = async (req, res) => {
  const { code } = req.params;
  const { data: inviter } = await supabase
    .from("users")
    .select("*")
    .eq("referral_code", (code || "").trim().toUpperCase())
    .maybeSingle();

  if (!inviter) {
    return res.status(400).json({
      success: false,
      message: "❌ Invalid Referral Code. This invitation link is not valid.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Referral code is valid",
    name: inviter.name,
    level: "Explorer",
    successfulTrips: "5 Trips",
    referralStatus: "Verified",
  });
};

// GET FIREBASE TEST PHONE
export const getFirebaseTestPhone = async (req, res) => {
  return res.status(200).json({
    success: true,
    phoneNumber: process.env.FIREBASE_TEST_PHONE_NUMBER || "+911234567890",
    otp: process.env.FIREBASE_TEST_PHONE_OTP || "123456",
  });
};