import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Journal from "../models/Journal.js";
import Flight from "../models/Flight.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isValidEmail, isValidPhone, isStrongPassword } from "../utils/validators.js";
import { sendWelcomeEmail, sendOtpEmail } from "../services/emailService.js";
import { doc, setDoc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth as firebaseAuth } from "../config/firebase.js";
import { createUserWithEmailAndPassword, signInAnonymously } from "firebase/auth";




// GENERATE TOKEN
const generateToken = (id) => {

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};




// SEND OTP
export const sendOtp = async (req, res) => {
  console.log("OTP Recipient:", req.body?.email);
  console.log("[sendOtp Audit] Incoming Request Body:", JSON.stringify(req.body, null, 2));
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
    } = req.body;

    console.log("[sendOtp Audit] Destructured parameters:", { firstName, lastName, email, phone, role });

    const isAgent = role === "agent";

    if (isAgent) {
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
      }
    } else {
      if (!firstName || !lastName || !email || !phone) {
        console.warn("[sendOtp Audit] Validation failed: Missing required fields (HTTP 400). Missing fields:", {
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          phone: !phone
        });
        return res.status(400).json({
          success: false,
          message: "First Name, Last Name, Email, and Phone are required.",
          ...(process.env.NODE_ENV !== "production" && {
            debug: {
              reason: "Missing required fields",
              missing: { firstName: !firstName, lastName: !lastName, email: !email, phone: !phone }
            }
          })
        });
      }
    }

    const emailValid = isValidEmail(email);
    console.log("[sendOtp Audit] Email validation check result:", emailValid);
    if (!emailValid) {
      console.warn(`[sendOtp Audit] Validation failed: Invalid email format "${email}" (HTTP 400)`);
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
        ...(process.env.NODE_ENV !== "production" && {
          debug: { reason: "Invalid email format", email }
        })
      });
    }

    if (!isAgent) {
      const phoneValid = isValidPhone(phone);
      console.log("[sendOtp Audit] Phone validation check result:", phoneValid);
      if (!phoneValid) {
        console.warn(`[sendOtp Audit] Validation failed: Invalid phone format "${phone}" (HTTP 400)`);
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number (7-15 digits, numeric).",
          ...(process.env.NODE_ENV !== "production" && {
            debug: { reason: "Invalid phone format", phone }
          })
        });
      }
    }

    // CHECK EXISTING USER (Traveler registration constraint only)
    const emailKey = email.trim().toLowerCase();
    if (!isAgent) {
      const userExists = await User.findOne({ email: emailKey });
      console.log("[sendOtp Audit] User exists check result:", !!userExists);

      if (userExists) {
        console.warn(`[sendOtp Audit] Validation failed: Email "${emailKey}" is already registered (HTTP 400)`);
        return res.status(400).json({
          success: false,
          message: "Email is already registered.",
          ...(process.env.NODE_ENV !== "production" && {
            debug: { reason: "Email already registered", emailKey }
          })
        });
      }
    }

    const otpDocRef = doc(db, "otps", emailKey);

    // Ensure backend is authenticated to read/write Firestore
    if (!firebaseAuth.currentUser) {
      console.log("[sendOtp Audit] Backend not authenticated in Firebase. Authenticating anonymously...");
      try {
        await signInAnonymously(firebaseAuth);
        console.log("[sendOtp Audit] Backend authenticated anonymously in Firebase.");
      } catch (authErr) {
        console.error("[sendOtp Audit] Failed to sign in anonymously on backend sendOtp:", authErr);
      }
    }

    const otpSnap = await getDoc(otpDocRef);

    let resendAttempts = 0;
    if (otpSnap.exists()) {
      const data = otpSnap.data();
      const now = new Date();
      console.log("[sendOtp Audit] Existing OTP record found in Firestore:", JSON.stringify(data, null, 2));

      // Check cooldown (60 seconds)
      if (now < new Date(data.resendAvailableAt)) {
        const secondsLeft = Math.ceil((new Date(data.resendAvailableAt) - now) / 1000);
        console.warn(`[sendOtp Audit] Cooldown active. Seconds remaining: ${secondsLeft} (HTTP 429)`);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting a new code.`,
          ...(process.env.NODE_ENV !== "production" && {
            debug: { reason: "Cooldown active", secondsLeft, resendAvailableAt: data.resendAvailableAt }
          })
        });
      }

      // Check max resend attempts (5 resend attempts max)
      resendAttempts = data.resendAttempts || 0;
      if (resendAttempts >= 5) {
        console.warn(`[sendOtp Audit] Max resend attempts exceeded: ${resendAttempts} (HTTP 429)`);
        return res.status(429).json({
          success: false,
          message: "Maximum verification resend attempts exceeded. Please try again later.",
          ...(process.env.NODE_ENV !== "production" && {
            debug: { reason: "Max resend attempts exceeded", resendAttempts }
          })
        });
      }
    }

    // GENERATE SECURE 6-DIGIT OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("[sendOtp Audit] Generated secure 6-digit OTP code:", otpCode);

    // HASH OTP BEFORE STORAGE (Phase 3)
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
    const resendAvailableAt = new Date(now.getTime() + 60 * 1000); // 60 seconds

    // Save/Update in Firestore
    const otpDocData = {
      otp: hashedOtp,
      expiresAt: expiresAt.toISOString(),
      resendAvailableAt: resendAvailableAt.toISOString(),
      resendAttempts: resendAttempts + 1,
      attempts: 0,
      createdAt: now.toISOString(),
    };

    if (process.env.NODE_ENV !== "production") {
      otpDocData.debugOtp = otpCode;
    }

    console.log("[sendOtp Audit] Saving OTP details to Firestore...", JSON.stringify(otpDocData, null, 2));
    await setDoc(otpDocRef, otpDocData);
    console.log("[sendOtp Audit] OTP saved to Firestore successfully.");

    // SEND OTP EMAIL
    try {
      console.log("[sendOtp Audit] Dispatching OTP email...");
      await sendOtpEmail(emailKey, firstName || "Agent", otpCode);
      console.log("[sendOtp Audit] OTP email sent successfully.");
    } catch (emailError) {
      console.error("[sendOtp Audit] Email dispatch failed:", emailError.message, emailError);
      return res.status(500).json({
        success: false,
        message: emailError.message || "Failed to send verification email. Please try again later.",
        debug: {
          reason: "Email send failure",
          error: emailError.message,
          stack: emailError.stack,
          otpCode: process.env.NODE_ENV !== "production" ? otpCode : undefined
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully to your email.",
    });
  } catch (error) {
    console.error("[sendOtp Audit] Critical Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send verification code.",
      ...(process.env.NODE_ENV !== "production" && {
        debug: { reason: "Internal controller error", error: error.message, stack: error.stack }
      })
    });
  }
};

// VERIFY OTP (Atomic Account Creation)
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, registrationDetails } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const emailKey = email.trim().toLowerCase();
    const otpDocRef = doc(db, "otps", emailKey);

    // Ensure backend is authenticated to read/write Firestore
    if (!firebaseAuth.currentUser) {
      try {
        await signInAnonymously(firebaseAuth);
      } catch (authErr) {
        console.error("Failed to sign in anonymously on backend verifyOtp:", authErr);
      }
    }

    const otpSnap = await getDoc(otpDocRef);

    if (!otpSnap.exists()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired or was not requested. Please try again.",
      });
    }

    const data = otpSnap.data();

    // Manual expiry check (just in case TTL index hasn't run yet)
    if (new Date() > new Date(data.expiresAt)) {
      await deleteDoc(otpDocRef);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    // Increment attempts
    const newAttempts = (data.attempts || 0) + 1;
    await updateDoc(otpDocRef, { attempts: newAttempts });

    // Check attempts limit (max 5 attempts)
    if (newAttempts > 5) {
      await deleteDoc(otpDocRef);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Please request a new verification code.",
      });
    }

    // Compare hashed OTP using bcrypt (allowing 123456 as bypass in non-production)
    const isMatch = (process.env.NODE_ENV !== "production" && otp.trim() === "123456") || await bcrypt.compare(otp.trim(), data.otp);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. Attempts remaining: ${5 - newAttempts}`,
      });
    }

    // Correct OTP! Delete from Firestore (one-time use)
    await deleteDoc(otpDocRef);

    // If no details provided, just return verification success (fallback path)
    if (!registrationDetails) {
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

    const {
      firstName,
      lastName,
      phone,
      city,
      country,
      additionalInfo,
      password,
      acceptedTerms,
      termsVersion,
    } = registrationDetails;

    // Validate registration details
    if (!firstName || !lastName || !phone || !city || !country || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing registration details.",
      });
    }

    // Double check email uniqueness in MongoDB
    const userExists = await User.findOne({ email: emailKey });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });
    }

    // 1. Create Firebase Auth user
    let firebaseUser;
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, emailKey, password);
      firebaseUser = userCredential.user;
    } catch (fbError) {
      console.error("[verifyOtp] Firebase User creation failed:", fbError);
      return res.status(400).json({
        success: false,
        message: fbError.message || "Failed to create Firebase Auth account.",
      });
    }

    const uid = firebaseUser.uid;

    // 2. Create Firestore User profile doc under users/{uid} (Phase 6 Sync)
    try {
      await setDoc(doc(db, "users", uid), {
        uid,
        firstName,
        lastName,
        email: emailKey,
        phone,
        city,
        country,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        provider: "email",
      });
    } catch (fsError) {
      console.error("[verifyOtp] Firestore profile creation failed:", fsError);
    }

    // 3. Create MongoDB User profile
    let user;
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = await User.create({
        firstName,
        lastName,
        email: emailKey,
        phone,
        city,
        country,
        additionalInfo: additionalInfo || "",
        password: hashedPassword,
        acceptedTerms: true,
        termsAcceptedAt: new Date(),
        termsVersion: "2026-06",
        firebaseUid: uid,
      });

      // Send welcome email (async)
      try {
        sendWelcomeEmail(user.email, user.firstName);
      } catch (emailErr) {
        console.error("Failed to send welcome email:", emailErr);
      }
    } catch (dbError) {
      console.error("[verifyOtp] MongoDB profile creation failed:", dbError);
      // Clean up Firebase Auth user to keep state in sync
      try {
        await firebaseUser.delete();
      } catch (deleteError) {
        console.error("Failed to delete Firebase user after MongoDB failure:", deleteError);
      }
      return res.status(500).json({
        success: false,
        message: dbError.message || "Failed to create database profile.",
      });
    }

    // 4. Return success and start session
    res.status(201).json({
      success: true,
      message: "User registered and verified successfully.",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        acceptedTerms: user.acceptedTerms,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
        firebaseUid: user.firebaseUid,
      },
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("[verifyOtp] Unexpected error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred during verification.",
    });
  }
};

// REGISTER USER (Fallback for token-based API test tools)
export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      city,
      country,
      additionalInfo,
      password,
      acceptedTerms,
      termsVersion,
      firebaseUid,
      otpToken,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All registration fields (firstName, lastName, email, phone, password) are required for email accounts",
      });
    }

    if (acceptedTerms !== true || termsVersion !== "2026-06") {
      return res.status(400).json({
        success: false,
        message: "You must accept the Terms & Conditions and Privacy Policy to register.",
      });
    }

    // Email format validation
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Phone validation
    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number (7-15 digits, numeric).",
      });
    }

    // Password strength check
    const pwdStrength = isStrongPassword(password);
    if (!pwdStrength.valid) {
      return res.status(400).json({
        success: false,
        message: pwdStrength.message,
      });
    }

    // Verify OTP Token
    if (!otpToken) {
      return res.status(400).json({
        success: false,
        message: "Email verification is required before registration.",
      });
    }

    try {
      const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
      if (decoded.email !== email.trim().toLowerCase() || !decoded.otpVerified) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired email verification token.",
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Email verification has expired. Please verify your email again.",
      });
    }

    // CHECK EXISTING USER
    const userExists = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create Firebase Auth user if not present
    let uid = firebaseUid;
    if (!uid) {
      try {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email.trim().toLowerCase(), password);
        uid = userCredential.user.uid;
      } catch (fbErr) {
        console.error("Firebase registration in /register failed:", fbErr);
        return res.status(400).json({
          success: false,
          message: fbErr.message || "Failed to create Firebase Auth account.",
        });
      }
    }

    // Create Firestore user profile doc (Phase 6 Sync)
    try {
      await setDoc(doc(db, "users", uid), {
        uid,
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone,
        city: city || "",
        country: country || "",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        provider: "email",
      });
    } catch (fsErr) {
      console.error("Firestore user creation in /register failed:", fsErr);
    }

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // CREATE USER
    const user = await User.create({
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      phone,
      city: city || "",
      country: country || "",
      additionalInfo,
      password: hashedPassword,
      acceptedTerms: true,
      termsAcceptedAt: new Date(),
      termsVersion: "2026-06",
      firebaseUid: uid,
    });

    // Send welcome email (async)
    try {
      sendWelcomeEmail(user.email, user.firstName);
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
    }

    // RESPONSE
    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        additionalInfo: user.additionalInfo,
        acceptedTerms: user.acceptedTerms,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
        firebaseUid: user.firebaseUid,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password, firebaseUid } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // FIND USER
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email",
      });
    }

    // CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    // Update lastLogin & firebaseUid if provided and not already set
    user.lastLogin = new Date();
    if (firebaseUid && !user.firebaseUid) {
      user.firebaseUid = firebaseUid;
    }
    await user.save();

    // Sync state to Firestore (Phase 6 Sync: lastLogin, deviceInfo, loginTime)
    try {
      const uid = user.firebaseUid || firebaseUid || user._id.toString();
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        lastLogin: new Date().toISOString(),
        deviceInfo: req.headers["user-agent"] || "unknown",
        loginTime: new Date().toISOString(),
      }, { merge: true });
    } catch (fsErr) {
      console.error("Firestore sync in /login failed:", fsErr);
    }

    // SUCCESS
    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        additionalInfo: user.additionalInfo,
        acceptedTerms: user.acceptedTerms,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
        firebaseUid: user.firebaseUid,
        lastLogin: user.lastLogin,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET CURRENT USER PROFILE
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Streak check & update
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (!user.lastActiveDate) {
      user.streak = 1;
      user.lastActiveDate = today;
      user.xp = (user.xp || 0) + 10;
      user.level = Math.floor(user.xp / 100) + 1;
      await user.save();
    } else if (user.lastActiveDate === yesterday) {
      user.streak = (user.streak || 0) + 1;
      user.lastActiveDate = today;
      user.xp = (user.xp || 0) + 10;
      user.level = Math.floor(user.xp / 100) + 1;
      await user.save();
    } else if (user.lastActiveDate !== today) {
      user.streak = 1;
      user.lastActiveDate = today;
      await user.save();
    }

    // Fetch user trips
    const userTrips = await Trip.find({
      $or: [
        { user: user._id },
        { owner: user._id },
        { "collaborators.userId": user._id }
      ]
    });
    const tripCount = userTrips.length;
    const tripIds = userTrips.map(t => t._id);

    // Check if they have collaborators
    const hasCollaborators = await Trip.exists({
      $or: [
        { owner: user._id, "collaborators.0": { $exists: true } },
        { "collaborators.userId": user._id }
      ]
    });

    // Check if they have added expenses
    const hasExpenses = await Trip.exists({
      $or: [
        { user: user._id },
        { owner: user._id },
        { "collaborators.userId": user._id }
      ],
      "expenseItems.paidBy": user._id
    });

    // Check if they have journal entries
    const hasJournal = await Journal.exists({ trip: { $in: tripIds } });

    // Check if they have flights
    const hasFlight = await Flight.exists({ trip: { $in: tripIds } });

    // Evaluate which achievements are unlocked
    const unlockedList = [];
    if (tripCount >= 1) unlockedList.push("First Trip Created");
    if (tripCount >= 5) unlockedList.push("Explorer");
    if (tripCount >= 10) unlockedList.push("Planner Pro");
    if (hasCollaborators) unlockedList.push("Collaboration Pro");
    if (hasExpenses) unlockedList.push("Budget Master");
    if (hasJournal) unlockedList.push("Journal Keeper");
    if (hasFlight) unlockedList.push("Flight Tracker");
    if (user.achievements?.includes("Chat Starter")) unlockedList.push("Chat Starter");

    // Sync user model achievements array
    let updatedAchievements = user.achievements || [];
    let modified = false;
    for (const ach of unlockedList) {
      if (!updatedAchievements.includes(ach)) {
        updatedAchievements.push(ach);
        modified = true;
      }
    }
    if (modified) {
      user.achievements = updatedAchievements;
      await user.save();
    }

    const achievements = [
      {
        title: "First Trip Created",
        description: "Created your first trip",
        icon: "🏆",
        unlocked: tripCount >= 1
      },
      {
        title: "Explorer",
        description: "Created 5 trips",
        icon: "🏆",
        unlocked: tripCount >= 5
      },
      {
        title: "Planner Pro",
        description: "Created 10 trips",
        icon: "🏆",
        unlocked: tripCount >= 10
      },
      {
        title: "Collaboration Pro",
        description: "Collaborate on a trip",
        icon: "🏆",
        unlocked: !!hasCollaborators
      },
      {
        title: "Budget Master",
        description: "Logged your first expense",
        icon: "🏆",
        unlocked: !!hasExpenses
      },
      {
        title: "Journal Keeper",
        description: "Created a journal entry",
        icon: "🏆",
        unlocked: !!hasJournal
      },
      {
        title: "Flight Tracker",
        description: "Tracked your first flight",
        icon: "🏆",
        unlocked: !!hasFlight
      },
      {
        title: "Chat Starter",
        description: "Sent your first chat message",
        icon: "🏆",
        unlocked: user.achievements?.includes("Chat Starter")
      }
    ];

    res.json({
      success: true,
      user,
      achievements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GOOGLE SIGN IN / UP
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "idToken is required" });
    }

    // Verify token with Google's tokeninfo API
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const verifyRes = await fetch(verifyUrl);
    
    if (!verifyRes.ok) {
      return res.status(400).json({ success: false, message: "Invalid Google ID token" });
    }

    const data = await verifyRes.json();
    
    // Detailed logging for auditing Google Sign-In mismatch issues
    console.log("[GoogleAuth Audit] idToken:", idToken);
    console.log("[GoogleAuth Audit] token payload:", JSON.stringify(data, null, 2));
    console.log("[GoogleAuth Audit] aud:", data.aud);
    console.log("[GoogleAuth Audit] azp:", data.azp);
    console.log("[GoogleAuth Audit] iss:", data.iss);
    console.log("[GoogleAuth Audit] email:", data.email);
    console.log("[GoogleAuth Audit] expected GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);

    // Safety check: verify Google client ID if configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const allowedClientIds = [
      clientId,
      "176828060174-fkphm10lp2ggqe0b58jdcajjs8lkcuus.apps.googleusercontent.com",
      "872930983851-sp955pg20dv701f90lfej5ult72tle27.apps.googleusercontent.com"
    ].filter(Boolean);

    const isAllowed = allowedClientIds.includes(data.aud) || (data.aud && data.aud.startsWith("740933888609-"));

    if (clientId && !isAllowed) {
      return res.status(400).json({ success: false, message: "Google Client ID mismatch" });
    }

    const { sub, email, name, picture } = data;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email not provided by Google account" });
    }

    // Search user by googleId
    let user = await User.findOne({ googleId: sub });
    
    if (!user) {
      // Check if email already registered with email/password
      user = await User.findOne({ email });
      if (user) {
        // Link Google provider to existing account
        user.googleId = sub;
        user.avatar = picture || user.avatar;
        user.authProvider = "google";
        await user.save();
      } else {
        // Create new Google User without password
        const nameParts = name ? name.split(" ") : ["Google", "User"];
        const firstName = nameParts[0] || "Google";
        const lastName = nameParts.slice(1).join(" ") || "User";

        user = await User.create({
          firstName,
          lastName,
          email,
          googleId: sub,
          avatar: picture || "",
          authProvider: "google",
          acceptedTerms: true,
          termsAcceptedAt: new Date(),
          termsVersion: "2026-06",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Google Authentication Successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
        avatar: user.avatar || "",
        authProvider: user.authProvider || "email",
        acceptedTerms: user.acceptedTerms,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
      },
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// ACCEPT TERMS & CONDITIONS
export const acceptTerms = async (req, res) => {
  try {
    const { termsVersion } = req.body;
    if (termsVersion !== "2026-06") {
      return res.status(400).json({
        success: false,
        message: "Invalid terms version.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.acceptedTerms = true;
    user.termsAcceptedAt = new Date();
    user.termsVersion = termsVersion;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Terms accepted successfully.",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
        avatar: user.avatar || "",
        authProvider: user.authProvider || "email",
        acceptedTerms: user.acceptedTerms,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
      },
    });
  } catch (error) {
    console.error("Accept Terms Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email address." });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified. Proceed with password reset.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// VALIDATE EMAIL AVAILABILITY
export const validateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    return res.status(200).json({
      success: true,
      message: "Email is available.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};