import User from "../models/User.js";
import admin from "../config/firebaseAdmin.js";
import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
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
        return res.status(400).json({
          success: false,
          message: "First Name, Last Name, Email, and Phone are required.",
        });
      }
    }

    const emailValid = isValidEmail(email);
    if (!emailValid) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (!isAgent) {
      const phoneValid = isValidPhone(phone);
      if (!phoneValid) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number (7-15 digits, numeric).",
        });
      }
    }

    // CHECK EXISTING USER (Traveler registration constraint only)
    const emailKey = email.trim().toLowerCase();
    if (!isAgent) {
      const userExists = await User.findOne({ email: emailKey });

      if (userExists) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered.",
        });
      }
    }

    const otpDocRef = doc(db, "otps", emailKey);

    // Ensure backend is authenticated to read/write Firestore
    if (!firebaseAuth.currentUser) {
      try {
        await signInAnonymously(firebaseAuth);
      } catch (authErr) {
        console.error("[sendOtp Audit] Failed to sign in anonymously:", authErr);
      }
    }

    const otpSnap = await getDoc(otpDocRef);

    let resendAttempts = 0;
    if (otpSnap.exists()) {
      const data = otpSnap.data();
      const now = new Date();

      // Check cooldown (60 seconds)
      if (now < new Date(data.resendAvailableAt)) {
        const secondsLeft = Math.ceil((new Date(data.resendAvailableAt) - now) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting a new code.`,
        });
      }
      resendAttempts = data.resendAttempts || 0;
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins validity
    const resendAvailableAt = new Date(Date.now() + 60 * 1000); // 60s cooldown

    // Save OTP to Firestore
    await setDoc(otpDocRef, {
      email: emailKey,
      otpCode,
      expiresAt: expiresAt.toISOString(),
      resendAvailableAt: resendAvailableAt.toISOString(),
      resendAttempts: resendAttempts + 1,
      verified: false,
      meta: {
        requestedAt: new Date().toISOString(),
        ipAddress: req.ip || "unknown",
      }
    });

    // Send email using SMTP Nodemailer
    try {
      await sendOtpEmail(emailKey, otpCode);
    } catch (mailErr) {
      console.error("Nodemailer OTP sending failed:", mailErr);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email address.",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// VERIFY OTP & SIGNUP
export const verifyOtp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      otpCode,
      city,
      country,
      additionalInfo,
    } = req.body;

    if (!email || !otpCode || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, Password, and Verification Code are required.",
      });
    }

    const emailKey = email.trim().toLowerCase();

    // Verify OTP in Firestore
    const otpDocRef = doc(db, "otps", emailKey);
    const otpSnap = await getDoc(otpDocRef);

    if (!otpSnap.exists()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired or was not requested.",
      });
    }

    const otpData = otpSnap.data();
    if (new Date() > new Date(otpData.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    if (otpData.verified) {
      return res.status(400).json({
        success: false,
        message: "This code was already verified.",
      });
    }

    if (otpData.otpCode !== otpCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check and try again.",
      });
    }

    // Mark OTP as verified
    await updateDoc(otpDocRef, { verified: true });

    if (!firstName || !lastName || !phone) {
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

    // Create Firebase Auth user
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

    // Create Firestore User profile doc
    try {
      await setDoc(doc(db, "users", uid), {
        uid,
        firstName,
        lastName,
        email: emailKey,
        phone,
        city: city || "",
        country: country || "",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        provider: "email",
      });
    } catch (fsError) {
      console.error("[verifyOtp] Firestore profile creation failed:", fsError);
    }

    // Create Supabase User profile
    let user;
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
          firstName,
          lastName,
          email: emailKey,
          phone,
          city: city || "",
          country: country || "",
          additionalInfo: additionalInfo || "",
          password: hashedPassword,
          acceptedTerms: true,
          termsAcceptedAt: new Date().toISOString(),
          termsVersion: "2026-06",
          firebaseUid: uid,
        });

      
      user = { ...newUser, _id: newUser.id };

      // Send welcome email (async)
      try {
        sendWelcomeEmail(user.email, user.firstName);
      } catch (emailErr) {
        console.error("Failed to send welcome email:", emailErr);
      }
    } catch (dbError) {
      console.error("[verifyOtp] User profile creation failed:", dbError);
      try {
        await firebaseUser.delete();
      } catch (deleteError) {
        console.error("Failed to delete Firebase user after db failure:", deleteError);
      }
      return res.status(500).json({
        success: false,
        message: dbError.message || "Failed to create database profile.",
      });
    }

    // Return success and start session
    res.status(201).json({
      success: true,
      message: "User registered and verified successfully.",
      user: {
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        acceptedTerms: true,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: "2026-06",
      },
      token: generateToken(user.id),
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// REGISTER USER DIRECTLY
export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      city,
      country,
      additionalInfo,
      firebaseUid,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // CHECK EXISTING USER
    const userExists = await User.findOne({ email: email.trim().toLowerCase() });

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
        // If the email is already in Firebase but missing in MongoDB, recover it!
        if (fbErr.code === "auth/email-already-in-use") {
          try {
            console.log(`[Orphan Recovery] Email "${email}" already exists in Firebase Auth but missing in MongoDB. Recovering Firebase UID...`);
            const fbUser = await admin.auth().getUserByEmail(email.trim().toLowerCase());
            uid = fbUser.uid;
            console.log(`[Orphan Recovery] Successfully recovered UID: ${uid}`);
          } catch (adminErr) {
            console.error("[Orphan Recovery Failed] Firebase admin user lookup failed:", adminErr);
            return res.status(400).json({
              success: false,
              message: fbErr.message || "Failed to create Firebase Auth account.",
            });
          }
        } else {
          console.error("Firebase registration failed:", fbErr);
          return res.status(400).json({
            success: false,
            message: fbErr.message || "Failed to create Firebase Auth account.",
          });
        }
      }
    }

    // Create Firestore user profile doc
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
      console.error("Firestore user creation failed:", fsErr);
    }

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // CREATE USER IN MONGODB
    const newUser = await User.create({
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone,
        city: city || "",
        country: country || "",
        additionalInfo: additionalInfo || "",
        password: hashedPassword,
        acceptedTerms: true,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: "2026-06",
        firebaseUid: uid,
      });

    
    const user = { ...newUser, _id: newUser.id };

    // Send welcome email (async)
    try {
      sendWelcomeEmail(user.email, user.firstName);
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
    }

    res.status(201).json({
      success: true,
      message: "Registration Successful",
      user: {
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city || "",
        country: user.country || "",
        acceptedTerms: true,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: "2026-06",
      },
      token: generateToken(user.id),
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

    // FIND USER IN MONGODB
    let userRow = await User.findOne({ email: email.trim().toLowerCase() });

    if (!userRow) {
      // Automatic recovery: Check if the user exists in Firebase Auth
      try {
        console.log(`[Auto Recovery] Checking Firebase Auth for email: ${email}`);
        const fbUser = await admin.auth().getUserByEmail(email.trim().toLowerCase());
        if (fbUser) {
          console.log(`[Auto Recovery] Firebase user found (${fbUser.uid}). Re-creating MongoDB profile...`);
          const nameParts = (fbUser.displayName || "").split(" ");
          const firstName = nameParts[0] || "Traveler";
          const lastName = nameParts.slice(1).join(" ") || "User";
          
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          userRow = await User.create({
            firstName,
            lastName,
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            firebaseUid: fbUser.uid,
            acceptedTerms: true,
            termsAcceptedAt: new Date().toISOString(),
            termsVersion: "2026-06",
          });
        }
      } catch (fbErr) {
        console.warn(`[Auto Recovery Warning] Firebase lookup failed:`, fbErr.message);
      }
    }

    if (!userRow) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email",
      });
    }

    const user = userRow.toObject ? userRow.toObject() : userRow;
    user._id = user._id || user.id;

    // CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    // Update lastLogin & firebaseUid
    const updateData = { lastLogin: new Date().toISOString() };
    if (firebaseUid && !user.firebaseUid) {
      updateData.firebaseUid = firebaseUid;
      user.firebaseUid = firebaseUid;
    }
    user.lastLogin = updateData.lastLogin;

    await User.findByIdAndUpdate(user.id, updateData, { new: true })

    // Sync state to Firestore
    try {
      const uid = user.firebaseUid || firebaseUid || user.id;
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        lastLogin: new Date().toISOString(),
        deviceInfo: req.headers["user-agent"] || "unknown",
        loginTime: new Date().toISOString(),
      }, { merge: true });
    } catch (fsErr) {
      console.error("Firestore sync failed:", fsErr);
    }

    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        _id: user.id,
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
      token: generateToken(user.id),
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
    const userRow = await User.findById(req.user.id);

    if (!userRow) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userRow.toObject();
    user._id = user._id || user.id;
    delete user.password;

    // Streak check & update
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const updateData = {};
    if (!user.lastActiveDate) {
      updateData.streak = 1;
      updateData.lastActiveDate = today;
      updateData.xp = (user.xp || 0) + 10;
      updateData.level = Math.floor((updateData.xp) / 100) + 1;
    } else if (user.lastActiveDate === yesterday) {
      updateData.streak = (user.streak || 0) + 1;
      updateData.lastActiveDate = today;
      updateData.xp = (user.xp || 0) + 10;
      updateData.level = Math.floor((updateData.xp) / 100) + 1;
    } else if (user.lastActiveDate !== today) {
      updateData.streak = 1;
      updateData.lastActiveDate = today;
    }

    if (Object.keys(updateData).length > 0) {
      Object.assign(user, updateData);
      await User.findByIdAndUpdate(user.id || user._id, updateData);
    }

    // Fetch user planner trips from "trips" table
    const userTripsData = await Trip.find({ userId: user.id || user._id });

    const userTrips = (userTripsData || []).map(t => ({ ...t, _id: t.id }));
    const tripCount = userTrips.length;

    const hasCollaboratorsCount = await Trip.countDocuments({ userId: user.id || user._id });

    const hasCollaborators = (hasCollaboratorsCount || 0) > 0;

    const hasExpensesCount = await Payment.countDocuments({ bookingId: user.id || user._id });

    const hasExpenses = (hasExpensesCount || 0) > 0;
    const hasJournal = false;
    const hasFlight = false;

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
      await User.findByIdAndUpdate(user.id || user._id, { achievements: updatedAchievements });
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
        description: "Add an expense to a trip",
        icon: "🏆",
        unlocked: !!hasExpenses
      },
      {
        title: "Journal Keeper",
        description: "Write a journal entry",
        icon: "🏆",
        unlocked: !!hasJournal
      },
      {
        title: "Flight Tracker",
        description: "Add a flight to a trip",
        icon: "🏆",
        unlocked: !!hasFlight
      },
      {
        title: "Chat Starter",
        description: "Send a message in group chat",
        icon: "🏆",
        unlocked: user.achievements?.includes("Chat Starter") || false
      }
    ];

    res.status(200).json({
      success: true,
      user: {
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
        avatar: user.avatar || "",
        authProvider: user.authProvider || "email",
        xp: user.xp || 0,
        level: user.level || 1,
        streak: user.streak || 0,
        upiId: user.upiId || "",
        achievements: user.achievements || [],
        acceptedTerms: user.acceptedTerms || false,
        termsAcceptedAt: user.termsAcceptedAt || null,
        termsVersion: user.termsVersion || "",
        firebaseUid: user.firebaseUid || "",
      },
      achievements,
      stats: {
        tripsCreated: tripCount,
        unlockedCount: achievements.filter((a) => a.unlocked).length,
        lockedCount: achievements.filter((a) => !a.unlocked).length,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GOOGLE AUTH CALLBACK
export const googleAuth = async (req, res) => {
  try {
    console.log("Google Login Request");
    console.log(req.body);

    const { idToken } = req.body;
    const googleToken = idToken || req.body.token;
    console.log("Token exists:", !!idToken);

    // Verify Firebase Admin initialization count
    console.log("Firebase apps length:", admin.apps ? admin.apps.length : 0);

    if (!googleToken) {
      return res.status(400).json({ success: false, message: "Token is required." });
    }

    // Verify token using firebase-admin SDK
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(googleToken);
      console.log(decoded);
    } catch (err) {
      console.error(err);
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase Token",
      });
    }

    const { sub, email, name, picture } = {
      sub: decoded.uid || decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture
    };

    if (!email) {
      return res.status(400).json({ success: false, message: "Email not provided by Google account" });
    }

    // Search user by googleId or email
    let userRow = await User.findOne({ googleId: sub });
    
    if (!userRow) {
      const emailUser = await User.findOne({ email });
      userRow = emailUser;

      if (userRow) {
        // Ensure existing users always get termsVersion set when linking Google account
        const updateData = {
          googleId: sub,
          firebaseUid: sub,
          avatar: picture || userRow.avatar || "",
          authProvider: "google",
          ...(!userRow.termsVersion ? {
            acceptedTerms: true,
            termsAcceptedAt: userRow.termsAcceptedAt || new Date().toISOString(),
            termsVersion: "2026-06",
          } : {}),
        };
        Object.assign(userRow, updateData);
        await User.findByIdAndUpdate(userRow._id, updateData, { new: true });
      } else {
        const nameParts = name ? name.split(" ") : ["Google", "User"];
        const firstName = nameParts[0] || "Google";
        const lastName = nameParts.slice(1).join(" ") || "User";

        console.log("Creating new user in MongoDB");
        const newUser = await User.create({
          firstName,
          lastName,
          email,
          googleId: sub,
          firebaseUid: sub,
          avatar: picture || "",
          authProvider: "google",
          acceptedTerms: true,
          termsAcceptedAt: new Date().toISOString(),
          termsVersion: "2026-06",
        });

        userRow = newUser;
      }
    }

    const user = userRow.toObject ? userRow.toObject() : userRow;
    user._id = user._id || user.id;

    console.log("Generating JWT");
    const token = generateToken(user._id || user.id);

    return res.status(200).json({
      success: true,
      token,
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
      }
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
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

    const userRow = await User.findById(req.user.id);

    if (!userRow) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const updateData = {
      acceptedTerms: true,
      termsAcceptedAt: new Date().toISOString(),
      termsVersion,
    };

    await User.findByIdAndUpdate(userRow.id, updateData, { new: true })

    res.status(200).json({
      success: true,
      message: "Terms accepted successfully.",
      user: {
        _id: userRow.id,
        firstName: userRow.firstName,
        lastName: userRow.lastName,
        email: userRow.email,
        phone: userRow.phone || "",
        city: userRow.city || "",
        country: userRow.country || "",
        avatar: userRow.avatar || "",
        authProvider: userRow.authProvider || "email",
        acceptedTerms: true,
        termsAcceptedAt: updateData.termsAcceptedAt,
        termsVersion,
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