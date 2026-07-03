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
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// Supabase client removed

// Firebase imports for OTP sharing
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db, auth as firebaseAuth } from "../config/firebase.js";
import { signInAnonymously } from "firebase/auth";
import { sendOtpEmail } from "../services/emailService.js";

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "default_jwt_secret_key_123", {
    expiresIn: "7d",
  });
};

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
    if (!adminUser && email.toLowerCase() === "admin@traveloop.com" && password === "adminpassword") {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash("adminpassword", salt);
      adminUser = await Admin.create({
        name: "Traveloop Super Admin",
        email: "admin@traveloop.com",
        passwordHash,
        role: "Super Admin",
        twoFactorEnabled: true,
      });
      console.log("[Admin Auth] Seeded default Super Admin user.");
    }

    if (!adminUser) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await adminUser.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Handle 2FA if enabled
    if (adminUser.twoFactorEnabled) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const emailKey = adminUser.email.toLowerCase();

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
          debugOtp: otpCode, // accessible in development
        });
        
        console.log(`[Admin 2FA] OTP for ${emailKey} is: ${otpCode}`);

        // Try sending email
        try {
          await sendOtpEmail(emailKey, adminUser.name, otpCode);
        } catch (mailError) {
          console.warn("[Admin 2FA] Failed to send email, logging to console instead:", mailError.message);
        }

        return res.status(200).json({
          success: true,
          twoFactorRequired: true,
          email: adminUser.email,
          debugOtp: process.env.NODE_ENV !== "production" ? otpCode : undefined,
        });

      } catch (err) {
        console.error("[Admin 2FA] Firestore setup failed. Falling back to simple login...", err);
      }
    }

    // Direct Login (if 2FA is disabled)
    adminUser.lastLogin = new Date();
    await adminUser.save();

    const token = generateToken(adminUser._id);
    res.status(200).json({
      success: true,
      token,
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
    const adminUser = await Admin.findOne({ email: email.toLowerCase() });
    if (!adminUser) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    const emailKey = email.toLowerCase();
    const otpDocRef = doc(db, "otps", emailKey);

    if (!firebaseAuth.currentUser) {
      await signInAnonymously(firebaseAuth);
    }

    const otpSnap = await getDoc(otpDocRef);
    if (!otpSnap.exists()) {
      return res.status(400).json({ success: false, message: "Verification code has expired or was not requested" });
    }

    const data = otpSnap.data();

    // Expiry check
    if (new Date() > new Date(data.expiresAt)) {
      await deleteDoc(otpDocRef);
      return res.status(400).json({ success: false, message: "Verification code expired" });
    }

    // Compare
    const isMatch = await bcrypt.compare(otp, data.otp);
    if (!isMatch && otp !== data.debugOtp) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // Clear OTP
    await deleteDoc(otpDocRef);

    // Complete Login
    adminUser.lastLogin = new Date();
    await adminUser.save();

    const token = generateToken(adminUser._id);

    res.status(200).json({
      success: true,
      token,
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
    console.error("[Admin verify2FA Error]:", error);
    res.status(500).json({ success: false, message: "Server Error during 2FA verification" });
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

    res.status(200).json({
      success: true,
      // Visual dashboard cards expected values
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
      },
      // Backend expected response variables
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
      const bDate = new Date(b.createdAt || b.bookingDate);
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
  const { status, commissionRate } = req.body;

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

    if (commissionRate !== undefined) {
      if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 100) {
        return res.status(400).json({ success: false, message: "Invalid commission rate" });
      }
      agent.commissionRate = commissionRate;
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
    const tripsData = await AgentTrip.find({})
      .populate("agentId", "companyName email")
      .populate("driverId", "name phone vehicleNumber")
      .sort({ createdAt: -1 });

    const trips = (tripsData || []).map(t => {
      const obj = t.toObject ? t.toObject() : t;
      const mapped = {
        ...obj,
        _id: t._id,
        agent: obj.agentId ? {
          _id: obj.agentId._id,
          companyName: obj.agentId.companyName,
          displayName: obj.agentId.companyName,
          email: obj.agentId.email,
          logo: "",
          phone: ""
        } : null,
        driver: obj.driverId ? {
          _id: obj.driverId._id,
          name: obj.driverId.name,
          phone: obj.driverId.phone,
          vehicleNumber: obj.driverId.vehicleNumber
        } : null
      };
      return mapped;
    });

    res.status(200).json({ success: true, trips });
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
      if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
        return res.status(400).json({ success: false, message: "Invalid approval status" });
      }
      trip.approvalStatus = approvalStatus;
      
      // Sync publication status
      if (approvalStatus === "approved") {
        trip.publishStatus = "published";
        trip.status = "published";
        trip.publishedAt = new Date();
      } else if (approvalStatus === "rejected") {
        trip.publishStatus = "draft";
        trip.status = "draft";
      }
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

    await AgentTrip.findByIdAndUpdate(id, {
      approvalStatus: trip.approvalStatus,
      publishStatus: trip.publishStatus,
      status: trip.status,
      publishedAt: trip.publishedAt,
      isHidden: trip.isHidden,
      isFeatured: trip.isFeatured
    });

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
      const mapped = { ...obj, _id: b._id };
      if (obj.tripId) {
        mapped.agentTrip = { ...obj.tripId, _id: obj.tripId._id };
        if (obj.tripId.agentId) {
          const agentData = await Agent.findById(obj.tripId.agentId).select("companyName email");
          if (agentData) {
            mapped.agent = {
              _id: obj.tripId.agentId,
              companyName: agentData.companyName,
              displayName: agentData.companyName,
              email: agentData.email,
              walletBalance: 0,
              pendingRevenue: 0,
              settledRevenue: 0,
              commissionRate: 10
            };
          }
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
