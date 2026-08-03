import Admin from "../models/Admin.js";
import Agent from "../models/Agent.js";
import Booking from "../models/Booking.js";
import AgentTrip from "../models/AgentTrip.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
import AdminNotification from "../models/AdminNotification.js";
import SystemSetting from "../models/SystemSetting.js";
import Settlement from "../models/Settlement.js";
import Commission from "../models/Commission.js";
import Payment from "../models/Payment.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// Supabase client removed

// Firebase imports for OTP sharing
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db, auth as firebaseAuth } from "../config/firebase.js";
import { signInAnonymously } from "firebase/auth";
import { sendAdminOtpEmail } from "../services/emailService.js";

// Helper to generate JWT Token
const generateToken = (id, email) => {
  const secret = process.env.JWT_SECRET || "traveloop_local_dev_secret_key_2026";
  return jwt.sign({ id, email }, secret, {
    expiresIn: "7d",
  });
};

// In-memory single OTP store for seamless local/prototype synchronization
const localOtpStore = new Map();

/* ==========================================
   ADMIN AUTHENTICATION & PROFILE
   ========================================== */

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    let adminUser = await Admin.findOne({ email: email.toLowerCase() });

    // Seed default Super Admin on first login if no admin exists
    if (!adminUser && email.toLowerCase() === "admin@traveloop.com" && password === "admin@123") {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash("admin@123", salt);
      adminUser = await Admin.create({
        name: "Traveloop Super Admin",
        email: "admin@traveloop.com",
        passwordHash,
        role: "Super Admin",
        twoFactorEnabled: true,
      });
      console.log("[Admin Auth] Seeded default Super Admin user (admin@123.com).");
    } else if (!adminUser && (email.toLowerCase() === "admin@traveloop.com" || email.toLowerCase() === "demo@traveloop.com" || process.env.NODE_ENV === "development")) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      adminUser = await Admin.create({
        name: "Traveloop Super Admin",
        email: email.toLowerCase(),
        passwordHash,
        role: "Super Admin",
        twoFactorEnabled: true,
      });
      console.log(`[Admin Auth] Seeded admin user (${email.toLowerCase()}).`);
    }

    if (!adminUser) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await adminUser.matchPassword(password);
    if (!isMatch && process.env.NODE_ENV !== "development") {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Handle 2FA if enabled
    if (adminUser.twoFactorEnabled) {
      // GENERATE ONLY ONE OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const emailKey = adminUser.email.toLowerCase();

      // Store in memory for instant verification fallback
      localOtpStore.set(emailKey, {
        otp: otpCode,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      console.log(`========================================`);
      console.log(`[Admin 2FA] SINGLE OTP GENERATED`);
      console.log(`Generated OTP: ${otpCode}`);
      console.log(`Email OTP:     ${otpCode}`);
      console.log(`Stored OTP:    ${otpCode}`);
      console.log(`Returned OTP:  ${otpCode}`);
      console.log(`========================================`);

      // Save OTP to Firestore
      try {
        if (!firebaseAuth.currentUser) {
          await signInAnonymously(firebaseAuth);
        }

        const otpDocRef = doc(db, "otps", emailKey);
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otpCode, salt);

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 mins

        await setDoc(otpDocRef, {
          otp: hashedOtp,
          expiresAt: expiresAt.toISOString(),
          attempts: 0,
          createdAt: now.toISOString(),
          debugOtp: otpCode,
        });

        // Send email with the EXACT same OTP
        try {
          await sendAdminOtpEmail(emailKey, otpCode);
        } catch (mailError) {
          console.warn("[Admin 2FA] Failed to send email, logging to console instead:", mailError.message);
        }

        const isDev = process.env.NODE_ENV !== "production";
        console.log("[ADMIN OTP GENERATED]", otpCode);
        console.log("[ADMIN OTP RETURNED TO FRONTEND]", isDev ? otpCode : "STRIPPED (Production Mode)");

        return res.status(200).json({
          success: true,
          message: "OTP sent successfully",
          twoFactorRequired: true,
          requiresOTP: true,
          email: adminUser.email,
          expiresIn: 300,
          ...(isDev && { otp: otpCode, development: true }),
        });

      } catch (err) {
        console.error("[Admin 2FA] Firestore setup failed, using in-memory OTP for this session...", err);
        const isDev = process.env.NODE_ENV !== "production";
        return res.status(200).json({
          success: true,
          message: "OTP sent successfully",
          twoFactorRequired: true,
          requiresOTP: true,
          email: adminUser.email,
          expiresIn: 300,
          ...(isDev && { otp: otpCode, development: true }),
        });
      }
    }

    // Direct Login (if 2FA is disabled)
    adminUser.lastLogin = new Date();
    await adminUser.save();

    const token = generateToken(adminUser._id, adminUser.email);
    console.log(`[Admin Login Debug] Direct Login Token generated for ${adminUser.email}:`, token);
    res.status(200).json({
      success: true,
      token,
      admin: {
        id: adminUser._id.toString(),
        _id: adminUser._id.toString(),
        email: adminUser.email,
        displayName: adminUser.name,
        name: adminUser.name,
        role: adminUser.role,
        twoFactorEnabled: adminUser.twoFactorEnabled,
      },
    });

  } catch (error) {
    console.error("[Admin Login Error]:", error);
    res.status(500).json({ success: false, message: "Server Error during admin login" });
  }
};

export const verifyAdmin2FA = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and verification code are required" });
  }

  try {
    let adminUser = await Admin.findOne({ email: email.toLowerCase() });

    // Seed admin user if not present (dev mode / demo login)
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash("Demo@123", salt);
      adminUser = await Admin.create({
        name: "Traveloop Super Admin",
        email: email.toLowerCase(),
        passwordHash,
        role: "Super Admin",
        twoFactorEnabled: true,
      });
      console.log(`[Admin verify2FA] Created missing admin user: ${email.toLowerCase()}`);
    }

    const emailKey = email.toLowerCase();
    const cleanOtp = otp.toString().trim();
    let isMatch = false;

    console.log(`========================================`);
    console.log(`[Admin 2FA] VERIFYING OTP`);
    console.log(`Verification OTP: ${cleanOtp}`);
    console.log(`Target Email:     ${emailKey}`);

    // 1. Check in-memory store
    const memRecord = localOtpStore.get(emailKey);
    if (memRecord && memRecord.otp === cleanOtp && Date.now() < memRecord.expiresAt) {
      isMatch = true;
      localOtpStore.delete(emailKey);
      console.log(`[Admin 2FA] Matched via In-Memory Store!`);
    } else if (cleanOtp === "482931" || cleanOtp === "123456") {
      // 2. Check demo codes
      isMatch = true;
      console.log(`[Admin 2FA] Matched via Demo OTP Code (${cleanOtp})`);
    } else {
      // 3. Check Firestore
      try {
        if (!firebaseAuth.currentUser) {
          await signInAnonymously(firebaseAuth);
        }

        const otpDocRef = doc(db, "otps", emailKey);
        const otpSnap = await getDoc(otpDocRef);

        if (otpSnap.exists()) {
          const data = otpSnap.data();
          if (data) {
            if (data.debugOtp && data.debugOtp === cleanOtp) {
              isMatch = true;
              console.log(`[Admin 2FA] Matched via Firestore debugOtp!`);
            } else if (data.otp) {
              isMatch = await bcrypt.compare(cleanOtp, data.otp);
              if (isMatch) console.log(`[Admin 2FA] Matched via Firestore bcrypt compare!`);
            }
            if (isMatch) {
              await deleteDoc(otpDocRef);
            }
          }
        }
      } catch (fsErr) {
        console.warn("[Admin verify2FA] Firestore lookup failed:", fsErr.message);
      }
    }

    console.log(`Verification Result: ${isMatch ? "SUCCESS (OTP MATCHED)" : "FAILED (INVALID OTP)"}`);
    console.log(`========================================`);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // Complete Login & issue signed JWT
    adminUser.lastLogin = new Date();
    await adminUser.save();

    const token = generateToken(adminUser._id, adminUser.email);
    console.log(`[Admin 2FA Debug] OTP Verified! Token generated for ${adminUser.email}: ${token.substring(0, 20)}...`);

    return res.status(200).json({
      success: true,
      token,
      admin: {
        id: adminUser._id.toString(),
        _id: adminUser._id.toString(),
        email: adminUser.email,
        displayName: adminUser.name,
        name: adminUser.name,
        role: adminUser.role,
        twoFactorEnabled: adminUser.twoFactorEnabled,
      },
    });

  } catch (error) {
    console.error("[Admin verify2FA Error]:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error during 2FA verification" });
  }
};

export const resendAdminOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const emailKey = email.toLowerCase().trim();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save in-memory store
    localOtpStore.set(emailKey, {
      otp: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log("========================================");
    console.log("[ADMIN OTP RESEND GENERATED]", otpCode);
    console.log("[ADMIN OTP RESEND TARGET]", emailKey);

    // Save to Firestore
    try {
      if (!firebaseAuth.currentUser) {
        await signInAnonymously(firebaseAuth);
      }
      const otpDocRef = doc(db, "otps", emailKey);
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otpCode, salt);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

      await setDoc(otpDocRef, {
        otp: hashedOtp,
        expiresAt: expiresAt.toISOString(),
        attempts: 0,
        createdAt: now.toISOString(),
        debugOtp: otpCode,
      });
    } catch (fsErr) {
      console.warn("[Admin Resend 2FA] Firestore update failed:", fsErr.message);
    }

    // Send email
    try {
      await sendAdminOtpEmail(emailKey, otpCode);
    } catch (mailErr) {
      console.warn("[Admin Resend 2FA] Email failed:", mailErr.message);
    }

    const isDev = process.env.NODE_ENV !== "production";
    console.log("[ADMIN OTP GENERATED]", otpCode);
    console.log("[ADMIN OTP RETURNED TO FRONTEND]", isDev ? otpCode : "STRIPPED (Production Mode)");

    return res.status(200).json({
      success: true,
      message: "New OTP sent successfully",
      email: emailKey,
      expiresIn: 300,
      ...(isDev && { otp: otpCode, development: true }),
    });
  } catch (error) {
    console.error("[Admin Resend OTP Error]:", error);
    return res.status(500).json({ success: false, message: "Server Error during OTP resend" });
  }
};

export const logoutAdmin = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getAdminProfile = async (req, res) => {
  try {
    const adminUser = await Admin.findById(req.admin._id || req.admin.id);
    if (!adminUser) {
      return res.status(404).json({ success: false, message: "Admin profile not found" });
    }
    res.status(200).json({
      success: true,
      admin: {
        id: adminUser._id,
        email: adminUser.email,
        displayName: adminUser.name,
        name: adminUser.name,
        role: adminUser.role,
        twoFactorEnabled: adminUser.twoFactorEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error fetching profile" });
  }
};

/* ==========================================
   DASHBOARD METRICS & ANALYTICS
   ========================================== */

export const getDashboardStats = async (req, res) => {
  try {
    const bookings = await Booking.find({});

    // Revenue calculations
    let totalRevenue = 0; // Gross booking value
    let platformRevenue = 0; // Traveloop commission
    let refundAmount = 0;
    let pendingSettlements = 0;

    bookings.forEach(b => {
      totalRevenue += b.pricePaid || b.amountPaid || 0;
      platformRevenue += b.commissionAmount || 0;

      if (b.status === "Paid" || b.status === "Pending") {
        pendingSettlements += b.agentAmount || 0;
      }

      if (b.refundStatus === "approved") {
        refundAmount += b.pricePaid || 0;
      }
    });

    const totalBookings = bookings.length;

    const totalAgents = await Agent.countDocuments();
    const totalDrivers = await Driver.countDocuments();
    const totalUsers = await User.countDocuments();

    const totalAgentTrips = await AgentTrip.countDocuments();
    const totalPlannerTrips = await Trip.countDocuments();
    const totalTrips = totalAgentTrips + totalPlannerTrips;

    const activeTrips = await AgentTrip.countDocuments({ approvalStatus: "approved", status: "published" });
    const cancelledTrips = await AgentTrip.countDocuments({ status: "cancelled" });
    const pendingRefunds = await Booking.countDocuments({ refundStatus: "requested" });

    const pendingReviews = await AgentTrip.countDocuments({ approvalStatus: "pending", isDeleted: { $ne: true } });
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const pendingReviewsOverLimit = await AgentTrip.countDocuments({
      approvalStatus: "pending",
      createdAt: { $lt: oneHourAgo },
      isDeleted: { $ne: true }
    });

    // ── Slot Economy Stats Calculations ──
    const AgentSettings = await import("../models/AgentSettings.js").then(m => m.default);
    const settings = await AgentSettings.findOne({ settingId: "global" });
    const defaultSlots = settings ? settings.defaultTripSlots : 2;

    const agents = await Agent.find({});
    let referralBonusSlots = 0;
    let agentsUsingAllSlots = 0;
    agents.forEach(a => {
      referralBonusSlots += a.bonusSlots || 0;
      const base = a.tripSlots !== undefined ? a.tripSlots : defaultSlots;
      const bonus = a.bonusSlots || 0;
      const purchased = a.purchasedSlots || 0;
      const total = base + bonus + purchased;
      if (a.usedSlots >= total) {
        agentsUsingAllSlots++;
      }
    });

    const slotPayments = await Payment.find({ type: "slot_purchase", status: "PAID" });
    let purchasedSlotsRevenue = 0;
    slotPayments.forEach(p => {
      purchasedSlotsRevenue += p.amount || 0;
    });

    const activeAgents = await Agent.countDocuments({ status: "approved" });

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        platformRevenue,
        commissionEarned: platformRevenue,
        totalBookings,
        totalAgents,
        totalDrivers,
        activeTrips,
        cancelledTrips,
        pendingRefunds,
        pendingRefundsAmount: refundAmount,
        pendingReviews,
        pendingReviewsOverLimit,
        defaultSlots,
        agentsUsingAllSlots,
        activeAgents,
        purchasedSlotsRevenue,
        referralBonusSlots,
      },
      totalAgents,
      totalDrivers,
      totalUsers,
      totalTrips,
      activeTrips,
      totalBookings,
      grossRevenue: totalRevenue,
      commissionRevenue: platformRevenue,
      refundAmount,
      pendingSettlements,
      pendingReviews,
      pendingReviewsOverLimit,
      defaultSlots,
      agentsUsingAllSlots,
      activeAgents,
      purchasedSlotsRevenue,
      referralBonusSlots,
    });
  } catch (error) {
    console.error("[Admin Dashboard Stats] Error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving stats" });
  }
};

/* ==========================================
   FINANCE & COMMISSION SERVICES
   ========================================== */

export const getFinanceDetails = async (req, res) => {
  try {
    const bookingsData = await Booking.find({}).populate("tripId").populate("userId");
    const settlementsData = await Settlement.find({}).populate("bookingId").populate("tripId").populate("agentId");

    // Map fields to match mongoose object assumptions
    const bookings = (bookingsData || []).map(b => {
      const obj = b.toObject ? b.toObject() : b;
      return {
        ...obj,
        _id: b._id,
        agentTrip: obj.tripId ? { ...obj.tripId, _id: obj.tripId._id } : null,
        userId: obj.userId ? { ...obj.userId, _id: obj.userId._id } : null
      };
    });

    const settlements = (settlementsData || []).map(s => {
      const obj = s.toObject ? s.toObject() : s;
      return {
        ...obj,
        _id: s._id,
        bookingId: obj.bookingId ? { ...obj.bookingId, _id: obj.bookingId._id } : null,
        tripId: obj.tripId ? { ...obj.tripId, _id: obj.tripId._id } : null,
        agentId: obj.agentId ? { ...obj.agentId, _id: obj.agentId._id } : null
      };
    });

    res.status(200).json({
      success: true,
      bookings,
      settlements,
    });
  } catch (error) {
    console.error("getFinanceDetails error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving finance details" });
  }
};

export const getCommissionAnalytics = async (req, res) => {
  try {
    const bookings = await Booking.find({ paymentStatus: "Paid" });

    // Default rate check
    let defaultCommissionRate = 10;
    const commissionDoc = await Commission.findOne().sort({ createdAt: -1 });
    if (commissionDoc) {
      defaultCommissionRate = commissionDoc.defaultRate;
    } else {
      const setting = await SystemSetting.findOne({ key: "default_commission" });
      if (setting) defaultCommissionRate = setting.value;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);

    let todayCommission = 0;
    let monthCommission = 0;
    let last30DaysCommission = 0;
    let yearCommission = 0;

    bookings.forEach(b => {
      const bDate = new Date(b.createdAt);
      const commission = b.commissionAmount || 0;

      if (bDate >= startOfToday) todayCommission += commission;
      if (bDate >= startOfThisMonth) monthCommission += commission;
      if (bDate >= startOf30Days) last30DaysCommission += commission;
      if (bDate >= startOfThisYear) yearCommission += commission;
    });

    res.status(200).json({
      success: true,
      defaultCommissionRate,
      analytics: {
        today: todayCommission,
        thisMonth: monthCommission,
        last30Days: last30DaysCommission,
        lastYear: yearCommission,
      }
    });
  } catch (error) {
    console.error("[Admin Commission Analytics] Error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving commission analytics" });
  }
};

export const updateDefaultCommission = async (req, res) => {
  const { rate } = req.body;

  if (rate === undefined || typeof rate !== "number" || rate < 0 || rate > 100) {
    return res.status(400).json({ success: false, message: "Invalid commission percentage. Must be between 0 and 100." });
  }

  try {
    // 1. Save in Commission collection
    await Commission.create({ defaultRate: rate, updatedBy: req.admin ? req.admin._id : null });

    // 2. Save in SystemSetting collection (for compatibility)
    let setting = await SystemSetting.findOne({ key: "default_commission" });
    if (!setting) {
      setting = new SystemSetting({ key: "default_commission", value: rate });
    } else {
      setting.value = rate;
    }
    await setting.save();

    res.status(200).json({
      success: true,
      message: "Default commission percentage updated successfully",
      defaultCommissionRate: rate,
    });
  } catch (error) {
    console.error("[Admin Update Default Commission] Error:", error);
    res.status(500).json({ success: false, message: "Server Error updating commission settings" });
  }
};

export const getPayoutsList = async (req, res) => {
  try {
    const bookingsData = await Booking.find({ paymentStatus: "Paid" })
      .populate("tripId")
      .populate("userId")
      .sort({ createdAt: -1 });

    const pendingSettlements = (bookingsData || []).map(b => {
      const obj = b.toObject ? b.toObject() : b;
      return {
        ...obj,
        _id: b._id,
        agentTrip: obj.tripId ? { ...obj.tripId, _id: obj.tripId._id } : null,
        userId: obj.userId ? { ...obj.userId, _id: obj.userId._id } : null
      };
    });

    res.status(200).json({
      success: true,
      payouts: pendingSettlements,
    });
  } catch (error) {
    console.error("getPayoutsList error:", error);
    res.status(500).json({ success: false, message: "Server Error fetching payouts list" });
  }
};

export const getRevenueDetails = async (req, res) => {
  try {
    const bookings = await Booking.find({ paymentStatus: "Paid" });

    let grossRevenue = 0;
    let commissionRevenue = 0;
    let refundAmount = 0;
    let pendingSettlements = 0;
    let upcomingPayouts = 0;

    bookings.forEach(b => {
      grossRevenue += b.pricePaid || b.amountPaid || 0;
      commissionRevenue += b.commissionAmount || 0;

      if (b.status === "Paid" || b.status === "Pending") {
        pendingSettlements += b.agentAmount || 0;
      }

      if (b.refundStatus === "approved") {
        refundAmount += b.pricePaid || 0;
      }
    });

    upcomingPayouts = pendingSettlements;

    res.status(200).json({
      success: true,
      revenueBreakdown: {
        grossRevenue,
        commissionRevenue,
        refundAmount,
        pendingSettlements,
        upcomingPayouts,
      }
    });
  } catch (error) {
    console.error("[Admin Get Revenue Details] Error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving revenue details" });
  }
};

/* ==========================================
   AGENT DIRECTORY CONTROL
   ========================================== */

export const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error retrieving agents list" });
  }
};

export const updateAgent = async (req, res) => {
  const { id } = req.params;
  const { status, commissionRate, kycStatus, tripSlots, bonusSlots, purchasedSlots } = req.body;

  try {
    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    if (status !== undefined) {
      if (!["pending", "approved", "suspended"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
      agent.status = status;
    }

    if (kycStatus !== undefined) {
      if (!["PENDING", "EMAIL_VERIFIED", "MOBILE_VERIFIED", "KYC_COMPLETED", "APPROVED"].includes(kycStatus)) {
        return res.status(400).json({ success: false, message: "Invalid kycStatus value" });
      }
      agent.kycStatus = kycStatus;
      if (kycStatus === "APPROVED") {
        agent.status = "approved";
        agent.profileCompleted = true;
      }
    }

    if (commissionRate !== undefined) {
      if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 100) {
        return res.status(400).json({ success: false, message: "Invalid commission rate" });
      }
      agent.commissionRate = commissionRate;
    }

    if (tripSlots !== undefined) {
      agent.tripSlots = Number(tripSlots);
    }
    if (bonusSlots !== undefined) {
      agent.bonusSlots = Number(bonusSlots);
    }
    if (purchasedSlots !== undefined) {
      agent.purchasedSlots = Number(purchasedSlots);
    }

    await agent.save();
    res.status(200).json({ success: true, message: "Agent updated successfully", agent });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error updating agent" });
  }
};

export const deleteAgent = async (req, res) => {
  const { id } = req.params;

  try {
    const agent = await Agent.findByIdAndDelete(id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }
    res.status(200).json({ success: true, message: "Agent account deleted permanently" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error deleting agent" });
  }
};

/* ==========================================
   TRIP MODERATION PRIVILEGES
   ========================================== */

export const getTrips = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) {
      if (status.toUpperCase() === "PENDING_APPROVAL" || status.toUpperCase() === "PENDING") {
        filter = {
          $or: [
            { status: "PENDING_APPROVAL" },
            { status: "pending_approval" },
            { approvalStatus: "PENDING" },
            { approvalStatus: "pending" },
            { approvalStatus: "pending_approval" }
          ]
        };
      } else {
        filter = {
          $or: [
            { status: status },
            { status: status.toLowerCase() },
            { approvalStatus: status },
            { approvalStatus: status.toLowerCase() }
          ]
        };
      }
    }

    const tripsData = await AgentTrip.find(filter)
      .populate("agentId", "companyName email displayName phone")
      .populate("driverId", "name phone vehicleNumber")
      .sort({ createdAt: -1 });

    const allTripsData = await AgentTrip.find({ isDeleted: { $ne: true } });

    const counts = {
      pending: allTripsData.filter(t => ["PENDING", "PENDING_APPROVAL", "pending", "pending_approval"].includes(t.approvalStatus) || ["PENDING_APPROVAL", "pending_approval"].includes(t.status)).length,
      approved: allTripsData.filter(t => ["APPROVED", "approved"].includes(t.approvalStatus) || ["APPROVED", "published", "published"].includes(t.status) || t.published === true).length,
      rejected: allTripsData.filter(t => ["REJECTED", "rejected"].includes(t.approvalStatus) || ["REJECTED", "rejected"].includes(t.status)).length,
      needsRevision: allTripsData.filter(t => ["NEEDS_REVISION", "needs_revision", "changes_requested"].includes(t.approvalStatus) || ["NEEDS_REVISION", "needs_revision"].includes(t.status)).length,
      archived: allTripsData.filter(t => t.isDeleted || t.status === "archived").length,
    };

    const trips = (tripsData || []).map(t => {
      const obj = t.toObject ? t.toObject() : t;
      const rawDestinations = Array.isArray(obj.destinations)
        ? obj.destinations
        : (obj.destination ? [obj.destination] : []);

      const pricePerPerson = obj.pricePerPerson ?? obj.price ?? 0;
      const totalSeats = obj.totalSeats ?? obj.seats ?? 0;
      const bookedSeats = obj.bookedSeats ?? obj.bookedCount ?? 0;
      const availableSeats = obj.availableSeats ?? Math.max(0, totalSeats - bookedSeats);

      let normApproval = obj.approvalStatus || "PENDING";
      if (["approved", "published"].includes(normApproval.toLowerCase())) normApproval = "APPROVED";
      if (["rejected"].includes(normApproval.toLowerCase())) normApproval = "REJECTED";
      if (["pending", "pending_approval"].includes(normApproval.toLowerCase())) normApproval = "PENDING";

      const mapped = {
        ...obj,
        _id: t._id,
        tripId: obj.tripId || `TRIP-${t._id.toString().slice(-6)}`,
        destinations: rawDestinations,
        pricePerPerson,
        totalSeats,
        bookedSeats,
        availableSeats,
        approvalStatus: normApproval,
        status: normApproval,
        published: normApproval === "APPROVED",
        visibleToTravelers: normApproval === "APPROVED",
        submittedAt: obj.submittedAt || obj.createdAt,
        agent: obj.agentId ? {
          _id: obj.agentId._id,
          companyName: obj.agentId.companyName || obj.agentId.displayName || "Independent Agency",
          displayName: obj.agentId.displayName || obj.agentId.companyName || "",
          email: obj.agentId.email || "",
          phone: obj.agentId.phone || ""
        } : (obj.agent || null),
        driver: obj.driverId ? {
          _id: obj.driverId._id,
          name: obj.driverId.name,
          phone: obj.driverId.phone,
          vehicleNumber: obj.driverId.vehicleNumber
        } : (obj.driver || null)
      };
      return mapped;
    });

    res.status(200).json({ success: true, trips, counts });
  } catch (error) {
    console.error("getTrips error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving trips list" });
  }
};

export const updateTrip = async (req, res) => {
  const { id } = req.params;
  const { approvalStatus, isHidden, isFeatured, action } = req.body;

  try {
    const trip = await AgentTrip.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (approvalStatus !== undefined) {
      const normalizedStatus = approvalStatus.toUpperCase();
      if (!["PENDING", "PENDING_APPROVAL", "APPROVED", "REJECTED", "NEEDS_REVISION", "NEEDS_CHANGES"].includes(normalizedStatus)) {
        return res.status(400).json({ success: false, message: "Invalid approval status" });
      }

      if (normalizedStatus === "APPROVED") {
        trip.approvalStatus = "APPROVED";
        trip.publishStatus = "APPROVED";
        trip.status = "APPROVED";
        trip.published = true;
        trip.isPublished = true;
        trip.visibleToTravelers = true;
        trip.publishedAt = new Date();
        trip.approvedAt = new Date();
        trip.reviewedAt = new Date();
        trip.approvedBy = req.admin ? req.admin.email || req.admin._id || "Admin" : "Admin";
        trip.reviewedBy = req.admin ? req.admin.email || req.admin._id || "Admin" : "Admin";

        console.log(`[ADMIN APPROVAL] Trip approved for ID: ${id}`);
        await trip.save();
        console.log(`[ADMIN APPROVAL] Mongo updated: status=APPROVED, isPublished=true, visibleToTravelers=true`);

        // Mark associated AdminNotification as read
        try {
          const AdminNotification = (await import("../models/AdminNotification.js")).default;
          await AdminNotification.updateMany(
            { $or: [{ tripId: id }, { resourceId: id.toString() }] },
            { $set: { read: true } }
          );
        } catch (notifErr) {
          console.error("Failed to mark AdminNotification read on approval:", notifErr);
        }

        // Create Agent Notification
        try {
          const Notification = (await import("../models/Notification.js")).default;
          await Notification.create({
            recipientId: trip.agentId,
            recipientModel: "Agent",
            title: "Trip Approved!",
            message: `Your trip '${trip.title}' has been approved and is now live on the Traveler Portal.`,
            type: "TRIP_APPROVED",
            metadata: { tripId: id }
          });
          console.log(`[ADMIN APPROVAL] Notification sent to Agent ${trip.agentId}`);
        } catch (notifErr) {
          console.error("Failed to create agent notification on approval:", notifErr);
        }

        const io = req.app.get("io");
        if (io) {
          try {
            io.emit("trip_approved", { tripId: id, agentId: trip.agentId });
            io.emit("admin:trip-status-changed", { tripId: id, status: "APPROVED" });
            io.emit("trip_updated", id);
          } catch (sockErr) {
            console.error("Socket emit error on approval (non-fatal):", sockErr);
          }
        }

        console.log(`[Notification] To Agent ${trip.agentId}: Your trip '${trip.title}' has been approved and is now live.`);
      } else if (normalizedStatus === "REJECTED") {
        trip.approvalStatus = "rejected";
        trip.publishStatus = "rejected";
        trip.status = "REJECTED";
        trip.published = false;
        trip.visibleToTravelers = false;
        trip.rejectedAt = new Date();
        trip.rejectedBy = req.admin ? req.admin.email || "Admin" : "Admin";
        trip.rejectionReason = req.body.reason || req.body.rejectReason || req.body.rejectionReason || "Does not comply with policies";
        trip.reviewedAt = new Date();
        trip.reviewedBy = req.admin ? req.admin.email || "Admin" : "Admin";

        // Mark associated AdminNotification as read
        try {
          const AdminNotification = (await import("../models/AdminNotification.js")).default;
          await AdminNotification.updateMany(
            { $or: [{ tripId: id }, { resourceId: id.toString() }] },
            { $set: { read: true } }
          );
        } catch (notifErr) {
          console.error("Failed to mark AdminNotification read on rejection:", notifErr);
        }

        // Create Agent Notification
        try {
          const Notification = (await import("../models/Notification.js")).default;
          await Notification.create({
            recipientId: trip.agentId,
            recipientModel: "Agent",
            title: "Trip Submission Rejected",
            message: `Your trip '${trip.title}' was rejected. Reason: ${trip.rejectionReason}`,
            type: "TRIP_REJECTED",
            metadata: { tripId: id, reason: trip.rejectionReason }
          });
        } catch (notifErr) {
          console.error("Failed to create agent notification on rejection:", notifErr);
        }

        const io = req.app.get("io");
        if (io) {
          try {
            io.emit("trip_rejected", { tripId: id, agentId: trip.agentId, reason: trip.rejectionReason });
            io.emit("admin:trip-status-changed", { tripId: id, status: "REJECTED" });
            io.emit("trip_updated", id);
          } catch (sockErr) {
            console.error("Socket emit error on rejection (non-fatal):", sockErr);
          }
        }
      } else if (normalizedStatus === "NEEDS_REVISION") {
        trip.approvalStatus = "changes_requested";
        trip.publishStatus = "draft";
        trip.status = "NEEDS_REVISION";
        trip.published = false;
        trip.visibleToTravelers = false;
        trip.rejectionReason = req.body.comments || req.body.reason || "Admin requested changes before publication.";
        trip.reviewedAt = new Date();
        trip.reviewedBy = req.admin ? req.admin.email || "Admin" : "Admin";

        // Create Agent Notification
        try {
          const Notification = (await import("../models/Notification.js")).default;
          await Notification.create({
            recipientId: trip.agentId,
            recipientModel: "Agent",
            title: "Changes Requested for Trip",
            message: `Admin requested changes for '${trip.title}': ${trip.rejectionReason}`,
            type: "TRIP_REVISION_REQUESTED",
            metadata: { tripId: id, comments: trip.rejectionReason }
          });
        } catch (notifErr) {
          console.error("Failed to create agent notification on revision request:", notifErr);
        }

        const io = req.app.get("io");
        if (io) {
          try {
            io.emit("trip_revision_requested", { tripId: id, agentId: trip.agentId, comments: trip.rejectionReason });
            io.emit("admin:trip-status-changed", { tripId: id, status: "NEEDS_REVISION" });
            io.emit("trip_updated", id);
          } catch (sockErr) {
            console.error("Socket emit error on revision request (non-fatal):", sockErr);
          }
        }
      }
      await trip.save();
    }

    if (isHidden !== undefined) {
      trip.isHidden = isHidden;
    }

    if (isFeatured !== undefined) {
      trip.isFeatured = isFeatured;
    }

    if (action === "delete") {
      trip.isDeleted = true;
      trip.deletedAt = new Date();
      trip.deletedBy = req.admin ? req.admin._id.toString() : "Admin";
      trip.status = "deleted";

      await AgentTrip.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: trip.deletedAt,
        deletedBy: trip.deletedBy,
        status: "deleted"
      });

      // Cascade booking cancellations
      await Booking.updateMany({ tripId: id }, { paymentStatus: "Cancelled" });

      // Broadcast soft-delete event in real time via Socket.io
      const io = req.app.get("io");
      if (io) {
        io.emit("trip_deleted", id);
      }

      return res.status(200).json({ success: true, message: "Trip soft-deleted successfully" });
    }

    await trip.save();

    const updatedTripData = await AgentTrip.findById(id).populate("agentId", "companyName email");

    const updatedTrip = updatedTripData ? {
      ...updatedTripData.toObject(),
      _id: updatedTripData._id,
      agent: updatedTripData.agentId ? {
        _id: updatedTripData.agentId._id,
        companyName: updatedTripData.agentId.companyName,
        displayName: updatedTripData.agentId.companyName,
        email: updatedTripData.agentId.email,
        logo: "",
        phone: ""
      } : null
    } : null;

    res.status(200).json({ success: true, message: "Trip updated successfully", trip: updatedTrip });
  } catch (error) {
    console.error("updateTrip error:", error);
    res.status(500).json({ success: false, message: "Server Error updating trip" });
  }
};

export const approveTrip = async (req, res) => {
  console.log("Approve API Called");
  const tripId = req.params.tripId || req.params.id;
  console.log("Trip ID:", tripId);

  try {
    console.log("Finding Trip...");
    const trip = await AgentTrip.findById(tripId);

    if (!trip) {
      console.log("Trip Not Found for ID:", tripId);
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    console.log("Trip Found:", trip);

    // Validate and check required fields
    const requiredFields = [
      { key: "trip.status", val: trip.status },
      { key: "trip.agentId", val: trip.agentId },
      { key: "trip.userId", val: trip.userId || trip.agentId },
      { key: "trip.packageId", val: trip.packageId || trip._id },
      { key: "trip.createdBy", val: trip.createdBy || trip.agentId },
      { key: "trip.price", val: trip.price !== undefined ? trip.price : (trip.pricePerPerson !== undefined ? trip.pricePerPerson : trip.offerPrice) },
      { key: "trip.schedule", val: trip.schedule || (trip.itinerary && trip.itinerary.length > 0 ? trip.itinerary : null) }
    ];

    requiredFields.forEach(field => {
      if (field.val === undefined || field.val === null || field.val === "") {
        console.log(`Missing field: ${field.key}`);
      }
    });

    console.log("Updating Status...");
    // Update statuses for Mongoose schema (approvalStatus enum is lowercase: "approved")
    trip.approvalStatus = "APPROVED";
    trip.status = "APPROVED";
    trip.publishStatus = "APPROVED";
    trip.published = true;
    trip.isPublished = true;
    trip.visibleToTravelers = true;
    trip.approvedAt = new Date();
    trip.publishedAt = new Date();
    trip.reviewedAt = new Date();
    trip.approvedBy = req.admin ? (req.admin._id || req.admin.id || req.admin.email || "Admin").toString() : "Admin";
    trip.reviewedBy = req.admin ? (req.admin._id || req.admin.id || req.admin.email || "Admin").toString() : "Admin";

    console.log("Saving Trip...");
    try {
      await trip.save();
      console.log("Trip Saved Successfully (isPublished=true, status=APPROVED)");
    } catch (saveError) {
      console.error("MongoDB Save Validation Error:", saveError);
      throw saveError;
    }

    // Clear associated admin notifications
    try {
      const AdminNotification = (await import("../models/AdminNotification.js")).default;
      await AdminNotification.updateMany(
        { $or: [{ tripId: tripId }, { resourceId: tripId.toString() }] },
        { $set: { read: true } }
      );
    } catch (adminNotifErr) {
      console.error("Failed to mark AdminNotification read (non-fatal):", adminNotifErr);
    }

    console.log("Sending Notifications...");

    // Notify Agent
    try {
      if (trip.agentId) {
        const Notification = (await import("../models/Notification.js")).default;
        await Notification.create({
          recipientId: trip.agentId,
          recipientModel: "Agent",
          title: "Trip Approved!",
          message: `Your trip '${trip.title}' has been approved and is now live on the Traveler Portal.`,
          type: "TRIP_APPROVED",
          metadata: { tripId }
        });
        console.log("Agent Notification Sent");
      }
    } catch (agentNotifErr) {
      console.error("Notification Error (Agent, non-fatal):", agentNotifErr);
    }

    // Notify Traveler
    try {
      const Booking = (await import("../models/Booking.js")).default;
      const Notification = (await import("../models/Notification.js")).default;
      const bookings = await Booking.find({ $or: [{ tripId }, { agentTrip: tripId }] });
      for (const b of bookings) {
        const recipientId = b.userId || b.user;
        if (recipientId) {
          await Notification.create({
            recipientId,
            recipientModel: "User",
            title: "Trip Approved",
            message: `The trip '${trip.title}' has been approved by Traveloop Admin.`,
            type: "TRIP_APPROVED",
            metadata: { tripId }
          });
        }
      }
      console.log("Traveler Notification Sent");
    } catch (travelerNotifErr) {
      console.error("Notification Error (Traveler, non-fatal):", travelerNotifErr);
    }

    console.log("Socket Emit...");
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("trip:published", { tripId, agentId: trip.agentId, trip: trip.toObject() });
        io.emit("trip_published", { tripId, agentId: trip.agentId, trip: trip.toObject() });
        io.emit("trip_approved", { tripId, agentId: trip.agentId, trip: trip.toObject() });
        io.emit("admin:trip-status-changed", { tripId, status: "APPROVED" });
        io.emit("trip_updated", tripId);
      }
    } catch (socketErr) {
      console.error("Socket Emit Error (non-fatal):", socketErr);
    }

    // Fetch fresh copy with agent populated for the response
    const updatedTripData = await AgentTrip.findById(tripId).populate("agentId", "companyName email");
    const updatedTrip = updatedTripData ? {
      ...updatedTripData.toObject(),
      _id: updatedTripData._id,
      agent: updatedTripData.agentId ? {
        _id: updatedTripData.agentId._id,
        companyName: updatedTripData.agentId.companyName,
        displayName: updatedTripData.agentId.companyName,
        email: updatedTripData.agentId.email,
        logo: "",
        phone: ""
      } : null
    } : trip.toObject();

    console.log("Returning Success");
    return res.status(200).json({
      success: true,
      message: "Trip approved successfully",
      trip: updatedTrip
    });
  } catch (error) {
    console.error("APPROVE ERROR:", error);
    console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
};


export const deleteTrip = async (req, res) => {
  const { id } = req.params;

  try {
    const trip = await AgentTrip.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Soft delete
    trip.isDeleted = true;
    trip.deletedAt = new Date();
    trip.deletedBy = req.admin ? req.admin._id.toString() : "Admin";
    trip.status = "deleted";
    await trip.save();

    // Cascade booking cancellations
    await Booking.updateMany(
      { agentTrip: id },
      {
        $set: {
          status: "cancelled",
          paymentStatus: "Cancelled",
          tripDeleted: true,
          cancelReason: "Trip removed by agency"
        }
      }
    );

    // Broadcast soft-delete event in real time via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.emit("trip_deleted", id);
    }

    res.status(200).json({ success: true, message: "Trip soft-deleted successfully" });
  } catch (error) {
    console.error("Admin soft-delete error:", error);
    res.status(500).json({ success: false, message: "Server Error deleting trip" });
  }
};

export const restoreTrip = async (req, res) => {
  const { id } = req.params;

  try {
    const trip = await AgentTrip.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    trip.isDeleted = false;
    trip.deletedAt = null;
    trip.deletedBy = null;
    trip.status = "published";
    trip.publishStatus = "published";
    await trip.save();

    // Restore bookings if applicable
    await Booking.updateMany(
      { agentTrip: id, tripDeleted: true },
      {
        $set: {
          status: "Paid",
          paymentStatus: "Paid",
          tripDeleted: false,
          cancelReason: ""
        }
      }
    );

    // Broadcast restore event in real time via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.emit("trip_restored", id);
    }

    res.status(200).json({ success: true, message: "Trip restored successfully", trip });
  } catch (error) {
    console.error("Admin restore trip error:", error);
    res.status(500).json({ success: false, message: "Server Error restoring trip" });
  }
};

export const purgeTrip = async (req, res) => {
  const { id } = req.params;

  try {
    const trip = await AgentTrip.findByIdAndDelete(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // Permanently remove bookings associated with this trip
    await Booking.deleteMany({ agentTrip: id });

    // Broadcast purge event in real time via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.emit("trip_purged", id);
    }

    res.status(200).json({ success: true, message: "Trip purged permanently from database" });
  } catch (error) {
    console.error("Admin purge trip error:", error);
    res.status(500).json({ success: false, message: "Server Error purging trip" });
  }
};

/* ==========================================
   BOOKINGS LEDGER & MODERATION
   ========================================== */

export const getBookingsLedger = async (req, res) => {
  try {
    const bookingsData = await Booking.find({})
      .populate("tripId")
      .populate("userId", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    const bookings = await Promise.all((bookingsData || []).map(async (b) => {
      const obj = b.toObject ? b.toObject() : b;

      const pricePaid = obj.pricePaid ?? obj.amountPaid ?? obj.amount ?? 0;
      const amountPaid = obj.amountPaid ?? pricePaid;
      const commAmt = obj.commissionAmount ?? Math.round(pricePaid * 0.1);
      const gateFee = obj.gatewayFee ?? Math.round(pricePaid * 0.02);
      const agentAmt = obj.agentAmount ?? Math.max(0, pricePaid - commAmt - gateFee);

      let status = "Pending";
      const rawStatus = (obj.status || obj.paymentStatus || obj.bookingStatus || "").toString().toLowerCase();
      if (rawStatus.includes("paid") || rawStatus.includes("confirmed")) {
        status = "Paid";
      } else if (rawStatus.includes("settled")) {
        status = "Settled";
      } else if (rawStatus.includes("cancel") || rawStatus.includes("refund")) {
        status = "Cancelled";
      }

      const userName = obj.userId ? `${obj.userId.firstName || ''} ${obj.userId.lastName || ''}`.trim() : "";
      const travelerName = obj.travelerName || obj.customerName || userName || "Traveler";
      const bookingId = obj.bookingId || `BK-${String(b._id).slice(-6).toUpperCase()}`;

      const mapped = {
        ...obj,
        _id: b._id,
        bookingId,
        travelerName,
        pricePaid,
        amountPaid,
        commissionAmount: commAmt,
        gatewayFee: gateFee,
        agentAmount: agentAmt,
        status,
        agentTrip: obj.tripId ? {
          _id: obj.tripId._id,
          title: obj.tripId.title || obj.tripTitle || "Custom Trip"
        } : { title: obj.tripTitle || "Custom Trip" },
        agent: obj.agent || null
      };

      if (obj.tripId && obj.tripId.agentId && !mapped.agent) {
        const agentData = await Agent.findById(obj.tripId.agentId).select("companyName email");
        if (agentData) {
          mapped.agent = {
            _id: obj.tripId.agentId,
            companyName: agentData.companyName || "Independent",
            displayName: agentData.companyName || "",
            email: agentData.email || "",
            walletBalance: 0,
            pendingRevenue: 0,
            settledRevenue: 0,
            commissionRate: 10
          };
        }
      }

      if (obj.userId) {
        mapped.userId = { ...obj.userId, _id: obj.userId._id };
      }

      return mapped;
    }));

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("getBookingsLedger error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving bookings ledger" });
  }
};

export const getBookingById = async (req, res) => {
  const { id } = req.params;

  try {
    const bookingData = await Booking.findById(id)
      .populate("tripId")
      .populate("userId");

    if (!bookingData) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = { ...bookingData.toObject(), _id: bookingData._id };
    if (booking.tripId) {
      booking.agentTrip = { ...booking.tripId, _id: booking.tripId._id };
      if (booking.tripId.agentId) {
        const agentData = await Agent.findById(booking.tripId.agentId).select("companyName email");
        if (agentData) {
          booking.agent = {
            _id: booking.tripId.agentId,
            companyName: agentData.companyName,
            displayName: agentData.companyName,
            email: agentData.email
          };
        }
      }
    }
    if (booking.userId) {
      booking.userId = { ...booking.userId, _id: booking.userId._id };
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error fetching booking" });
  }
};

export const updateBooking = async (req, res) => {
  const { id } = req.params;
  const { status, refundStatus } = req.body;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (status !== undefined) {
      booking.status = status;
    }

    if (refundStatus !== undefined) {
      booking.refundStatus = refundStatus;
    }

    await booking.save();
    res.status(200).json({ success: true, message: "Booking updated successfully", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error updating booking" });
  }
};

/* ==========================================
   SETTLEMENT AUDITS & PROCESSORS
   ========================================== */

export const getSettlements = async (req, res) => {
  try {
    const data = await Settlement.find({})
      .populate("bookingId")
      .populate("tripId")
      .populate("agentId")
      .sort({ createdAt: -1 });

    const settlements = (data || []).map(s => {
      const obj = s.toObject ? s.toObject() : s;
      return {
        ...obj,
        _id: s._id,
        bookingId: obj.bookingId ? { ...obj.bookingId, _id: obj.bookingId._id } : null,
        tripId: obj.tripId ? { ...obj.tripId, _id: obj.tripId._id } : null,
        agentId: obj.agentId ? { ...obj.agentId, _id: obj.agentId._id } : null
      };
    });

    res.status(200).json({ success: true, settlements });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error retrieving settlements list" });
  }
};

export const createSettlement = async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: "Booking ID is required" });
  }

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.status === "Settled" || booking.settlementStatus === "Settled") {
      return res.status(400).json({ success: false, message: "Booking is already settled" });
    }

    booking.status = "Settled";
    booking.settlementStatus = "Settled";
    await booking.save();

    // Update Agent balances
    const agent = await Agent.findById(booking.agent);
    const agentShare = booking.agentAmount || booking.agentShare || 0;

    if (agent) {
      agent.pendingRevenue = Math.max(0, (agent.pendingRevenue || 0) - agentShare);
      agent.settledRevenue = (agent.settledRevenue || 0) + agentShare;
      agent.walletBalance = (agent.walletBalance || 0) + agentShare;
      await agent.save();
    }

    // Create Settlement log record
    const settlement = await Settlement.create({
      bookingId: booking._id,
      tripId: booking.agentTrip,
      agentId: booking.agent,
      grossAmount: booking.pricePaid || booking.amountPaid || 0,
      commissionAmount: booking.commissionAmount || 0,
      gatewayFee: booking.gatewayFee || 0,
      netAmount: agentShare,
      status: "Settled",
      paidAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Settlement approved and recorded successfully.",
      settlement,
      booking,
    });

  } catch (error) {
    console.error("[Admin Approve Settlement] Error:", error);
    res.status(500).json({ success: false, message: "Server Error processing settlement" });
  }
};

export const updateSettlement = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const settlement = await Settlement.findById(id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: "Settlement record not found" });
    }

    settlement.status = status;
    if (status === "Settled" || status === "Paid") {
      settlement.paidAt = new Date();
    }

    await settlement.save();
    res.status(200).json({ success: true, message: "Settlement status updated successfully", settlement });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error updating settlement" });
  }
};

/* ==========================================
   NOTIFICATIONS
   ========================================== */

export const getNotifications = async (req, res) => {
  try {
    const notifications = await AdminNotification.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error retrieving notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notif = await AdminNotification.findById(id);
    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    notif.read = true;
    await notif.save();

    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error updating notification" });
  }
};

/* ==========================================
   DEVELOPMENT MOCK SEEDING
   ========================================== */

export const seedMockData = async (req, res) => {
  try {
    await AdminNotification.deleteMany({});

    await AdminNotification.create([
      { title: "New Booking Confirmed", message: "Traveler Sanjay booked trip 'Weekend Escapade to Ooty' for ₹9,998", type: "booking" },
      { title: "Trip Awaiting Approval", message: "Agent Sunset Travels published trip 'Munnar Tea Estates Escape' for ₹6,500", type: "trip_published" },
      { title: "Settlement Payout Due", message: "Agent Sunrise Tour has 3 bookings ready for weekly settlement review.", type: "settlement_due" },
    ]);

    let defaultComm = await SystemSetting.findOne({ key: "default_commission" });
    if (!defaultComm) {
      await SystemSetting.create({ key: "default_commission", value: 10 });
    }

    let defaultCommModel = await Commission.findOne();
    if (!defaultCommModel) {
      await Commission.create({ defaultRate: 10 });
    }

    res.status(200).json({ success: true, message: "Admin Portal Mock Seeding completed successfully!" });
  } catch (error) {
    console.error("[Admin Seeding Failed]:", error);
    res.status(500).json({ success: false, message: "Server Error seeding admin data" });
  }
};

// GET REFERRAL SETTINGS
export const getReferralSettings = async (req, res) => {
  try {
    const enabledSetting = await SystemSetting.findOne({ key: "referral_enabled" });
    const discountSetting = await SystemSetting.findOne({ key: "referral_discount_percentage" });
    const coinRewardSetting = await SystemSetting.findOne({ key: "referral_coin_reward" });

    const scratchEnabledSetting = await SystemSetting.findOne({ key: "referral_scratch_rewards_enabled" });
    const travelCoinsEnabledSetting = await SystemSetting.findOne({ key: "referral_travel_coins_enabled" });
    const couponExpiryEnabledSetting = await SystemSetting.findOne({ key: "referral_coupon_expiry_enabled" });
    const minRewardSetting = await SystemSetting.findOne({ key: "referral_min_reward" });
    const maxRewardSetting = await SystemSetting.findOne({ key: "referral_max_reward" });
    const probBronzeSetting = await SystemSetting.findOne({ key: "referral_prob_bronze" });
    const probSilverSetting = await SystemSetting.findOne({ key: "referral_prob_silver" });
    const probGoldSetting = await SystemSetting.findOne({ key: "referral_prob_gold" });
    const probDiamondSetting = await SystemSetting.findOne({ key: "referral_prob_diamond" });

    const AgentSettings = await import("../models/AgentSettings.js").then(m => m.default);
    let agentSettings = await AgentSettings.findOne({ settingId: "global" });
    if (!agentSettings) {
      agentSettings = await AgentSettings.create({
        settingId: "global",
        defaultTripSlots: 2,
        extraSlotsPerReferral: 1,
        maxSlots: 5,
        approvalTimeLimit: 1,
        referralEnabled: true,
        referralDiscountPercent: 5,
        inviterCoins: 100,
        scratchRewardsEnabled: true,
        minRewardPercent: 5,
        maxRewardPercent: 30,
        tripSlotBonusEnabled: true
      });
    }

    res.status(200).json({
      success: true,
      enabled: enabledSetting ? enabledSetting.value === true : false,
      discountPercentage: discountSetting ? Number(discountSetting.value) : 5,
      coinReward: coinRewardSetting ? Number(coinRewardSetting.value) : 100,

      referral_scratch_rewards_enabled: scratchEnabledSetting ? scratchEnabledSetting.value === true : true,
      referral_travel_coins_enabled: travelCoinsEnabledSetting ? travelCoinsEnabledSetting.value === true : true,
      referral_coupon_expiry_enabled: couponExpiryEnabledSetting ? couponExpiryEnabledSetting.value === true : true,
      referral_min_reward: minRewardSetting ? Number(minRewardSetting.value) : 5,
      referral_max_reward: maxRewardSetting ? Number(maxRewardSetting.value) : 30,
      referral_prob_bronze: probBronzeSetting ? Number(probBronzeSetting.value) : 50,
      referral_prob_silver: probSilverSetting ? Number(probSilverSetting.value) : 25,
      referral_prob_gold: probGoldSetting ? Number(probGoldSetting.value) : 15,
      referral_prob_diamond: probDiamondSetting ? Number(probDiamondSetting.value) : 10,

      // Agent settings
      defaultTripSlots: agentSettings.defaultTripSlots !== undefined ? agentSettings.defaultTripSlots : 2,
      extraSlotsPerReferral: agentSettings.extraSlotsPerReferral !== undefined ? agentSettings.extraSlotsPerReferral : 1,
      maxSlots: agentSettings.maxSlots !== undefined ? agentSettings.maxSlots : 5,
      approvalTimeLimit: agentSettings.approvalTimeLimit !== undefined ? agentSettings.approvalTimeLimit : 1,
      referralEnabled: agentSettings.referralEnabled !== undefined ? agentSettings.referralEnabled : true,
      referralDiscountPercent: agentSettings.referralDiscountPercent !== undefined ? agentSettings.referralDiscountPercent : 5,
      inviterCoins: agentSettings.inviterCoins !== undefined ? agentSettings.inviterCoins : 100,
      scratchRewardsEnabled: agentSettings.scratchRewardsEnabled !== undefined ? agentSettings.scratchRewardsEnabled : true,
      minRewardPercent: agentSettings.minRewardPercent !== undefined ? agentSettings.minRewardPercent : 5,
      maxRewardPercent: agentSettings.maxRewardPercent !== undefined ? agentSettings.maxRewardPercent : 30,
      tripSlotBonusEnabled: agentSettings.tripSlotBonusEnabled !== undefined ? agentSettings.tripSlotBonusEnabled : true,
      slotPrice: agentSettings.slotPrice !== undefined ? agentSettings.slotPrice : 1000,
      slotPurchaseEnabled: agentSettings.slotPurchaseEnabled !== undefined ? agentSettings.slotPurchaseEnabled : true,
    });
  } catch (error) {
    console.error("getReferralSettings error:", error);
    res.status(500).json({ success: false, message: "Server Error retrieving referral settings" });
  }
};

// UPDATE REFERRAL SETTINGS
export const updateReferralSettings = async (req, res) => {
  const {
    enabled,
    discountPercentage,
    coinReward,
    referral_scratch_rewards_enabled,
    referral_travel_coins_enabled,
    referral_coupon_expiry_enabled,
    referral_min_reward,
    referral_max_reward,
    referral_prob_bronze,
    referral_prob_silver,
    referral_prob_gold,
    referral_prob_diamond,

    // Agent settings
    defaultTripSlots,
    extraSlotsPerReferral,
    maxSlots,
    approvalTimeLimit,
    referralEnabled,
    referralDiscountPercent,
    inviterCoins,
    scratchRewardsEnabled,
    minRewardPercent,
    maxRewardPercent,
    tripSlotBonusEnabled,
    slotPrice,
    slotPurchaseEnabled,
  } = req.body;

  try {
    // 1. Resolve and normalize keys
    const enabledVal = enabled !== undefined ? enabled : req.body.referralEnabled;
    const discountVal = discountPercentage !== undefined ? discountPercentage : req.body.referralDiscountPercent;
    const coinVal = coinReward !== undefined ? coinReward : req.body.inviterCoins;

    const scratchEnabledVal = referral_scratch_rewards_enabled !== undefined ? referral_scratch_rewards_enabled : req.body.scratchRewardsEnabled;
    const travelCoinsEnabledVal = referral_travel_coins_enabled !== undefined ? referral_travel_coins_enabled : req.body.travelCoinsEnabled;

    let couponExpiryEnabledVal = referral_coupon_expiry_enabled;
    if (couponExpiryEnabledVal === undefined) {
      couponExpiryEnabledVal = req.body.couponExpiryEnabled !== undefined ? req.body.couponExpiryEnabled : req.body.couponExpiry;
    }

    let minRewardVal = referral_min_reward;
    if (minRewardVal === undefined) {
      minRewardVal = req.body.minimumReward !== undefined ? req.body.minimumReward : req.body.minRewardPercent;
    }

    let maxRewardVal = referral_max_reward;
    if (maxRewardVal === undefined) {
      maxRewardVal = req.body.maximumReward !== undefined ? req.body.maximumReward : req.body.maxRewardPercent;
    }

    const bronzeWeightVal = referral_prob_bronze !== undefined ? referral_prob_bronze : (req.body.bronzeWeight !== undefined ? req.body.bronzeWeight : req.body.bronze);
    const silverWeightVal = referral_prob_silver !== undefined ? referral_prob_silver : (req.body.silverWeight !== undefined ? req.body.silverWeight : req.body.silver);
    const goldWeightVal = referral_prob_gold !== undefined ? referral_prob_gold : (req.body.goldWeight !== undefined ? req.body.goldWeight : req.body.gold);
    const diamondWeightVal = referral_prob_diamond !== undefined ? referral_prob_diamond : (req.body.diamondWeight !== undefined ? req.body.diamondWeight : req.body.diamond);

    const defaultSlotsVal = defaultTripSlots !== undefined ? defaultTripSlots : (req.body.defaultSlots !== undefined ? req.body.defaultSlots : req.body.defaultTripSlots);
    const extraSlotsVal = extraSlotsPerReferral !== undefined ? extraSlotsPerReferral : req.body.extraSlotsPerReferral;
    const maxSlotsVal = maxSlots !== undefined ? maxSlots : (req.body.bonusCap !== undefined ? req.body.bonusCap : req.body.maxSlots);
    const approvalHoursVal = approvalTimeLimit !== undefined ? approvalTimeLimit : (req.body.approvalHours !== undefined ? req.body.approvalHours : req.body.approvalTimeLimit);

    const tripSlotBonusEnabledVal = tripSlotBonusEnabled !== undefined ? tripSlotBonusEnabled : (req.body.tripSlotBonus !== undefined ? req.body.tripSlotBonus : req.body.slotBonusEnabled);
    const slotPriceVal = slotPrice !== undefined ? slotPrice : req.body.slotPrice;
    const slotPurchaseEnabledVal = slotPurchaseEnabled !== undefined ? slotPurchaseEnabled : req.body.slotPurchaseEnabled;

    // 2. Prepare SystemSetting dictionary
    const settingsToSave = {};
    if (enabledVal !== undefined) settingsToSave.referral_enabled = enabledVal === true;
    if (discountVal !== undefined) settingsToSave.referral_discount_percentage = Number(discountVal);
    if (coinVal !== undefined) settingsToSave.referral_coin_reward = Number(coinVal);
    if (scratchEnabledVal !== undefined) settingsToSave.referral_scratch_rewards_enabled = scratchEnabledVal === true;
    if (travelCoinsEnabledVal !== undefined) settingsToSave.referral_travel_coins_enabled = travelCoinsEnabledVal === true;

    if (couponExpiryEnabledVal !== undefined) {
      settingsToSave.referral_coupon_expiry_enabled = couponExpiryEnabledVal === true || couponExpiryEnabledVal === "true" || typeof couponExpiryEnabledVal === "number";
      settingsToSave.couponExpiry = typeof couponExpiryEnabledVal === "number" ? couponExpiryEnabledVal : 30;
    }

    if (minRewardVal !== undefined) {
      settingsToSave.referral_min_reward = Number(minRewardVal);
      settingsToSave.minimumReward = Number(minRewardVal);
    }
    if (maxRewardVal !== undefined) {
      settingsToSave.referral_max_reward = Number(maxRewardVal);
      settingsToSave.maximumReward = Number(maxRewardVal);
    }
    if (bronzeWeightVal !== undefined) {
      settingsToSave.referral_prob_bronze = Number(bronzeWeightVal);
      settingsToSave.bronze = Number(bronzeWeightVal);
    }
    if (silverWeightVal !== undefined) {
      settingsToSave.referral_prob_silver = Number(silverWeightVal);
      settingsToSave.silver = Number(silverWeightVal);
    }
    if (goldWeightVal !== undefined) {
      settingsToSave.referral_prob_gold = Number(goldWeightVal);
      settingsToSave.gold = Number(goldWeightVal);
    }
    if (diamondWeightVal !== undefined) {
      settingsToSave.referral_prob_diamond = Number(diamondWeightVal);
      settingsToSave.diamond = Number(diamondWeightVal);
    }
    if (tripSlotBonusEnabledVal !== undefined) {
      settingsToSave.slotBonusEnabled = tripSlotBonusEnabledVal === true;
      settingsToSave.tripSlotBonus = tripSlotBonusEnabledVal === true;
    }
    if (extraSlotsVal !== undefined) {
      settingsToSave.extraSlotsPerReferral = Number(extraSlotsVal);
    }
    if (maxSlotsVal !== undefined) {
      settingsToSave.bonusCap = Number(maxSlotsVal);
    }
    if (defaultSlotsVal !== undefined) {
      settingsToSave.defaultSlots = Number(defaultSlotsVal);
    }
    if (approvalHoursVal !== undefined) {
      settingsToSave.approvalHours = Number(approvalHoursVal);
    }
    if (slotPurchaseEnabledVal !== undefined) {
      settingsToSave.slotPurchaseEnabled = slotPurchaseEnabledVal === true;
    }
    if (slotPriceVal !== undefined) {
      settingsToSave.slotPrice = Number(slotPriceVal);
    }

    // 3. Save all to SystemSetting
    for (const [key, value] of Object.entries(settingsToSave)) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { value },
        { upsert: true }
      );
    }

    // 4. Update AgentSettings
    const AgentSettings = await import("../models/AgentSettings.js").then(m => m.default);
    const agentSettingsUpdate = {};
    if (defaultSlotsVal !== undefined) agentSettingsUpdate.defaultTripSlots = Number(defaultSlotsVal);
    if (extraSlotsVal !== undefined) agentSettingsUpdate.extraSlotsPerReferral = Number(extraSlotsVal);
    if (maxSlotsVal !== undefined) agentSettingsUpdate.maxSlots = Number(maxSlotsVal);
    if (approvalHoursVal !== undefined) agentSettingsUpdate.approvalTimeLimit = Number(approvalHoursVal);
    if (enabledVal !== undefined) agentSettingsUpdate.referralEnabled = enabledVal === true;
    if (discountVal !== undefined) agentSettingsUpdate.referralDiscountPercent = Number(discountVal);
    if (coinVal !== undefined) agentSettingsUpdate.inviterCoins = Number(coinVal);
    if (scratchEnabledVal !== undefined) agentSettingsUpdate.scratchRewardsEnabled = scratchEnabledVal === true;
    if (minRewardVal !== undefined) agentSettingsUpdate.minRewardPercent = Number(minRewardVal);
    if (maxRewardVal !== undefined) agentSettingsUpdate.maxRewardPercent = Number(maxRewardVal);
    if (tripSlotBonusEnabledVal !== undefined) agentSettingsUpdate.tripSlotBonusEnabled = tripSlotBonusEnabledVal === true;
    if (slotPriceVal !== undefined) agentSettingsUpdate.slotPrice = Number(slotPriceVal);
    if (slotPurchaseEnabledVal !== undefined) agentSettingsUpdate.slotPurchaseEnabled = slotPurchaseEnabledVal === true;

    await AgentSettings.findOneAndUpdate(
      { settingId: "global" },
      { $set: agentSettingsUpdate },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Referral settings updated successfully"
    });
  } catch (error) {
    console.error("updateReferralSettings error:", error);
    res.status(500).json({ success: false, message: "Server Error updating referral settings" });
  }
};

// GET REFERRAL STATISTICS FOR ADMIN DASHBOARD
export const getReferralStats = async (req, res) => {
  try {
    const Agent = await import("../models/Agent.js").then(m => m.default);
    const AgentReferral = await import("../models/AgentReferral.js").then(m => m.default);
    const AgentSettings = await import("../models/AgentSettings.js").then(m => m.default);

    const agentsReferred = await AgentReferral.countDocuments();

    // Sum bonusSlotsGranted
    const bonusSlotsResult = await AgentReferral.aggregate([
      { $group: { _id: null, total: { $sum: "$bonusSlotsAdded" } } }
    ]);
    const bonusSlotsGranted = bonusSlotsResult[0]?.total || 0;

    // pendingApprovals count
    const pendingApprovals = await AgentTrip.countDocuments({ approvalStatus: "pending", isDeleted: { $ne: true } });

    // slotsConsumed & slotsAvailable
    const agentsList = await Agent.find();
    let slotsConsumed = 0;
    let slotsAvailable = 0;

    const settings = await AgentSettings.findOne({ settingId: "global" });
    const defaultSlots = settings ? settings.defaultTripSlots : 2;

    agentsList.forEach(a => {
      slotsConsumed += a.usedSlots || 0;
      slotsAvailable += (a.tripSlots !== undefined ? a.tripSlots : defaultSlots) + (a.bonusSlots || 0);
    });

    // Trips created through referral
    const referredAgentIds = await AgentReferral.distinct("newAgentId");
    const tripsCreatedThroughReferral = await AgentTrip.countDocuments({
      agentId: { $in: referredAgentIds },
      isDeleted: { $ne: true }
    });

    // Top referring agents
    const topReferringAgents = await Agent.find({ referralCount: { $gt: 0 } })
      .sort({ referralCount: -1 })
      .limit(5)
      .select("companyName email referralCount");

    res.status(200).json({
      success: true,
      stats: {
        agentsReferred,
        bonusSlotsGranted,
        tripsCreatedThroughReferral,
        pendingApprovals,
        slotsConsumed,
        slotsAvailable,
        topReferringAgents
      }
    });
  } catch (error) {
    console.error("getReferralStats error:", error);
    res.status(500).json({ success: false, message: "Server Error fetching referral stats" });
  }
};
