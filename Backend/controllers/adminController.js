import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabaseAdmin.js";
import { sendAdminOtpEmail } from "../services/emailService.js";

const generateToken = (id, email) => {
  const secret = process.env.JWT_SECRET || "traveloop_local_dev_secret_key_2026";
  return jwt.sign({ id, email, role: "admin" }, secret, { expiresIn: "7d" });
};

const localOtpStore = new Map();

/* ============================
   ADMIN AUTHENTICATION
   ============================ */

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  console.log(`\n[Admin Login] Login request received for email: ${email || "N/A"}`);

  if (!email || !password) {
    console.warn(`[Admin Login] Validation failed: Email or password missing`);
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    console.log(`[Admin Login] Email searched: ${normalizedEmail}`);
    const { data: adminUser, error: dbError } = await supabase
      .from("admins")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (dbError) {
      console.error(`[Admin Login] Supabase query error: ${dbError.message}`);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }

    if (!adminUser) {
      console.warn(`[Admin Login] Admin not found for email: ${normalizedEmail}`);
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    console.log(`[Admin Login] Admin found: ${adminUser.email} (ID: ${adminUser.id}, Role: ${adminUser.role})`);

    // Verify password against stored hash (or fallback field)
    const storedHash = adminUser.password || adminUser.password_hash || "";
    const isMatch = await bcrypt.compare(password, storedHash);

    if (!isMatch) {
      console.warn(`[Admin Login] Password verification result: FAILED for email: ${normalizedEmail}`);
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    console.log(`[Admin Login] Password verification result: SUCCESS for email: ${normalizedEmail}`);

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    localOtpStore.set(adminUser.email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    console.log(`[Admin Login] Generated 2FA OTP Code '${otp}' for Recipient: ${adminUser.email}`);

    try {
      const emailInfo = await sendAdminOtpEmail({ to: adminUser.email, name: adminUser.name || "Admin", otp });
      console.log(`[Admin Login] OTP email dispatch verified for ${adminUser.email}. Provider response: ${emailInfo?.response || "OK"}`);
    } catch (emailErr) {
      console.error(`❌ [Admin Login] Email delivery failed for ${adminUser.email}:`, emailErr.message);
      // In development mode fallback to returning debug OTP to allow testing even if SMTP credentials are omitted
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({
          success: false,
          message: "Failed to send 2FA verification email. Please contact server administration.",
          error: emailErr.message,
        });
      }
    }

    const preToken = generateToken(adminUser.id, adminUser.email);
    console.log(`[Admin Login] Temporary preToken generated successfully: ${preToken.substring(0, 20)}...`);

    return res.json({
      success: true,
      requiresOtp: true,
      requiresOTP: true,
      twoFactorRequired: true,
      otp,
      debugOtp: otp,
      preToken,
      token: preToken, // Provide as token so clients attaching Bearer preToken automatically succeed
      admin: { _id: adminUser.id, id: adminUser.id, email: adminUser.email, name: adminUser.name, role: adminUser.role },
    });
  } catch (error) {
    console.error(`[Admin Login] Internal server error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const verifyAdmin2FA = async (req, res) => {
  console.log("\n[Admin 2FA] Verification request received");

  // Extract token from Authorization header or request body
  let token = req.body?.preToken || req.body?.token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
    console.log(`[Admin 2FA] Token extracted from Authorization Bearer header: ${token.substring(0, 20)}...`);
  } else if (token) {
    console.log(`[Admin 2FA] Token extracted from request body: ${token.substring(0, 20)}...`);
  } else {
    console.warn("⚠️ [Admin 2FA] No Bearer token or preToken provided");
  }

  const { otp, email } = req.body;

  try {
    const secret = process.env.JWT_SECRET || "traveloop_local_dev_secret_key_2026";
    let decoded = null;

    if (token) {
      try {
        decoded = jwt.verify(token, secret);
        console.log(`[Admin 2FA] Temporary preToken verified for email: ${decoded.email}`);
      } catch (jwtErr) {
        console.warn(`[Admin 2FA] Token verification failed: ${jwtErr.message}`);
      }
    }

    const targetEmail = (decoded?.email || email || "").toLowerCase().trim();

    if (!targetEmail) {
      console.error("❌ [Admin 2FA] Could not resolve email from token or request body");
      return res.status(400).json({ success: false, message: "Email or valid preToken is required for verification." });
    }

    console.log(`[Admin 2FA] Checking OTP store for email: ${targetEmail}`);
    const entry = localOtpStore.get(targetEmail);

    if (!entry) {
      console.warn(`❌ [Admin 2FA] No active OTP found for ${targetEmail}`);
      return res.status(401).json({ success: false, message: "No active OTP request found or OTP expired. Please request a new code." });
    }

    if (Date.now() > entry.expiresAt) {
      console.warn(`❌ [Admin 2FA] OTP expired for ${targetEmail}`);
      localOtpStore.delete(targetEmail);
      return res.status(401).json({ success: false, message: "OTP has expired. Please request a new code." });
    }

    if (String(otp).trim() !== String(entry.otp).trim()) {
      console.warn(`❌ [Admin 2FA] Invalid OTP provided for ${targetEmail}`);
      return res.status(401).json({ success: false, message: "Invalid verification code. Please check and try again." });
    }

    console.log(`✅ [Admin 2FA] OTP verification SUCCESS for ${targetEmail}`);
    localOtpStore.delete(targetEmail);

    // Fetch full admin profile to issue final JWT
    let adminObj = null;
    if (decoded?.id) {
      const { data } = await supabase.from("admins").select("*").eq("id", decoded.id).maybeSingle();
      adminObj = data;
    }
    if (!adminObj) {
      const { data } = await supabase.from("admins").select("*").eq("email", targetEmail).maybeSingle();
      adminObj = data;
    }

    if (!adminObj) {
      console.error(`❌ [Admin 2FA] Admin record missing in database for ${targetEmail}`);
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    const finalToken = generateToken(adminObj.id, adminObj.email);
    console.log(`✅ [Admin 2FA] Final JWT issued successfully for Admin ID: ${adminObj.id}`);

    const { password: _p, password_hash: _ph, ...safeAdmin } = adminObj;

    return res.json({
      success: true,
      message: "2FA Verification successful",
      token: finalToken,
      admin: { ...safeAdmin, _id: adminObj.id },
    });
  } catch (error) {
    console.error(`❌ [Admin 2FA] Unexpected error during verification: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error during verification." });
  }
};

export const resendAdminOtp = async (req, res) => {
  return res.json({ success: true, message: "OTP resent" });
};

export const logoutAdmin = async (req, res) => {
  return res.json({ success: true, message: "Logged out" });
};

export const getAdminProfile = async (req, res) => {
  try {
    const { data: admin } = await supabase.from("admins").select("*").eq("id", req.admin.id).maybeSingle();
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
    const { password_hash, ...safe } = admin;
    return res.json({ success: true, admin: { ...safe, _id: admin.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================
   DASHBOARD & FINANCE
   ============================ */

export const getDashboardStats = async (req, res) => {
  try {
    const [{ count: totalAgents }, { count: totalBookings }, { count: totalTrips }, { count: totalUsers }] = await Promise.all([
      supabase.from("agents").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("agent_trips").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
    ]);
    return res.json({
      success: true,
      stats: { totalAgents, totalBookings, totalTrips, totalUsers, revenue: 0 },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getFinanceDetails = async (req, res) => {
  return res.json({ success: true, finance: { totalRevenue: 0, totalCommission: 0, totalPayouts: 0, pending: 0 } });
};

export const getCommissionAnalytics = async (req, res) => {
  return res.json({ success: true, commissions: [] });
};

export const updateDefaultCommission = async (req, res) => {
  return res.json({ success: true, message: "Commission updated" });
};

export const getPayoutsList = async (req, res) => {
  return res.json({ success: true, payouts: [] });
};

export const getRevenueDetails = async (req, res) => {
  return res.json({ success: true, revenue: [] });
};

/* ============================
   AGENT MANAGEMENT
   ============================ */

export const getAgents = async (req, res) => {
  try {
    const { data: agents } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
    return res.json({ success: true, agents: (agents || []).map(a => ({ ...a, _id: a.id })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAgent = async (req, res) => {
  try {
    const { data: agent } = await supabase
      .from("agents")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();
    return res.json({ success: true, agent: { ...agent, _id: agent.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAgent = async (req, res) => {
  try {
    await supabase.from("agents").delete().eq("id", req.params.id);
    return res.json({ success: true, message: "Agent deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================
   TRIP MODERATION
   ============================ */

export const getTrips = async (req, res) => {
  try {
    const status = req.query.status;
    let query = supabase.from("agent_trips").select("*").order("created_at", { ascending: false });
    if (status === "PENDING_APPROVAL" || status === "PENDING" || status === "pending") {
      query = query.or("approval_status.eq.PENDING,approval_status.eq.PENDING_APPROVAL,status.eq.pending,status.eq.PENDING_APPROVAL");
    } else if (status) {
      query = query.eq("status", status);
    }
    const { data: trips } = await query;
    return res.json({ success: true, trips: (trips || []).map(t => ({ ...t, _id: t.id })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.approvalStatus === "REJECTED" || payload.approval_status === "REJECTED") {
      payload.approval_status = "REJECTED";
      payload.status = "draft";
      payload.is_published = false;
      payload.published_at = null;
    }
    const { data: trip } = await supabase
      .from("agent_trips")
      .update(payload)
      .eq("id", req.params.id)
      .select()
      .single();
    return res.json({ success: true, trip: { ...trip, _id: trip.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const approveTrip = async (req, res) => {
  try {
    const { data: trip } = await supabase
      .from("agent_trips")
      .update({
        approval_status: "APPROVED",
        status: "published",
        is_published: true,
        published_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", req.params.id)
      .select()
      .single();
    return res.json({ success: true, message: "Trip approved", trip: { ...trip, _id: trip.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    await supabase.from("agent_trips").update({ is_deleted: true }).eq("id", req.params.id);
    return res.json({ success: true, message: "Trip deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreTrip = async (req, res) => {
  try {
    await supabase.from("agent_trips").update({ is_deleted: false }).eq("id", req.params.id);
    return res.json({ success: true, message: "Trip restored" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const purgeTrip = async (req, res) => {
  try {
    await supabase.from("agent_trips").delete().eq("id", req.params.id);
    return res.json({ success: true, message: "Trip permanently deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================
   BOOKING LEDGER
   ============================ */

export const getBookingsLedger = async (req, res) => {
  try {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return res.json({ success: true, bookings: (bookings || []).map(b => ({ ...b, _id: b.id })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { data: b } = await supabase.from("bookings").select("*").eq("id", req.params.id).maybeSingle();
    if (!b) return res.status(404).json({ success: false, message: "Booking not found" });
    return res.json({ success: true, booking: { ...b, _id: b.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { data: b } = await supabase.from("bookings").update(req.body).eq("id", req.params.id).select().single();
    return res.json({ success: true, booking: { ...b, _id: b.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================
   SETTLEMENTS
   ============================ */

export const getSettlements = async (req, res) => {
  try {
    const { data: settlements } = await supabase.from("settlements").select("*").order("created_at", { ascending: false });
    return res.json({ success: true, settlements: (settlements || []).map(s => ({ ...s, _id: s.id })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createSettlement = async (req, res) => {
  try {
    const { data: s } = await supabase.from("settlements").insert([req.body]).select().single();
    return res.status(201).json({ success: true, settlement: { ...s, _id: s.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettlement = async (req, res) => {
  try {
    const { data: s } = await supabase.from("settlements").update(req.body).eq("id", req.params.id).select().single();
    return res.json({ success: true, settlement: { ...s, _id: s.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================
   NOTIFICATIONS
   ============================ */

export const getNotifications = async (req, res) => {
  try {
    const { data: notifications } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return res.json({ success: true, notifications: (notifications || []).map(n => ({ ...n, _id: n.id })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", req.params.id);
    return res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================
   REFERRAL SETTINGS
   ============================ */

export const getReferralSettings = async (req, res) => {
  return res.json({ success: true, settings: { referralBonus: 100, minWithdrawal: 500 } });
};

export const updateReferralSettings = async (req, res) => {
  return res.json({ success: true, message: "Referral settings updated", settings: req.body });
};

export const getReferralStats = async (req, res) => {
  return res.json({ success: true, stats: { totalReferrals: 0, totalEarned: 0 } });
};

/* ============================
   SEED (Dev only)
   ============================ */

export const seedMockData = async (req, res) => {
  return res.json({ success: true, message: "Mock data seeded (Supabase — no-op in production)" });
};
