import express from "express";
import {
  verifyAdmin,
  verifyFinance,
  verifySuperAdmin,
} from "../middleware/adminAuthMiddleware.js";
import {
  loginAdmin,
  verifyAdmin2FA,
  resendAdminOtp,
  logoutAdmin,
  getAdminProfile,
  getDashboardStats,
  getFinanceDetails,
  getCommissionAnalytics,
  updateDefaultCommission,
  getPayoutsList,
  getRevenueDetails,
  getAgents,
  updateAgent,
  deleteAgent,
  getTrips,
  updateTrip,
  approveTrip,
  deleteTrip,
  restoreTrip,
  purgeTrip,
  getBookingsLedger,
  getBookingById,
  updateBooking,
  getSettlements,
  createSettlement,
  updateSettlement,
  getNotifications,
  markNotificationRead,
  seedMockData,
  getReferralSettings,
  updateReferralSettings,
  getReferralStats,
} from "../controllers/adminController.js";

const router = express.Router();

// Public Authentication
router.post("/login", loginAdmin);
router.post("/verify-2fa", verifyAdmin2FA);
router.post("/resend-otp", resendAdminOtp);
router.post("/logout", logoutAdmin);

// Profile (requires admin access)
router.get("/profile", verifyAdmin, getAdminProfile);

// Dashboard stats (requires admin access)
router.get("/dashboard", verifyAdmin, getDashboardStats);

// Finance & Commission
router.get("/finance", verifyFinance, getFinanceDetails);
router.get("/commission", verifyFinance, getCommissionAnalytics);
router.patch("/commission", verifySuperAdmin, updateDefaultCommission);
router.get("/payouts", verifyFinance, getPayoutsList);
router.get("/revenue", verifyFinance, getRevenueDetails);

// Agent Management
router.get("/agents", verifyAdmin, getAgents);
router.patch("/agents/:id", verifySuperAdmin, updateAgent);
router.delete("/agents/:id", verifySuperAdmin, deleteAgent);

// Trips Moderation
router.get("/trips", verifyAdmin, getTrips);
router.get("/trips/pending", verifyAdmin, (req, res, next) => {
  req.query.status = "PENDING_APPROVAL";
  next();
}, getTrips);
router.patch("/trips/:id", verifyAdmin, updateTrip);
router.post("/trips/:id/approve", verifyAdmin, approveTrip);
router.post("/trips/:id/reject", verifyAdmin, (req, res, next) => {
  req.body.approvalStatus = "REJECTED";
  next();
}, updateTrip);
router.post("/trips/:id/request-changes", verifyAdmin, (req, res, next) => {
  req.body.approvalStatus = "NEEDS_REVISION";
  next();
}, updateTrip);
router.delete("/trips/:id", verifyAdmin, deleteTrip);
router.post("/trips/:id/restore", verifyAdmin, restoreTrip);
router.delete("/trips/:id/purge", verifyAdmin, purgeTrip);

// Bookings Ledger
router.get("/bookings", verifyAdmin, getBookingsLedger);
router.get("/bookings/:id", verifyAdmin, getBookingById);
router.patch("/bookings/:id", verifyAdmin, updateBooking);

// Settlements (Supports both /settlement and /settlements)
router.post("/settlement", verifyFinance, createSettlement);
router.post("/settlements", verifyFinance, createSettlement);
router.get("/settlements", verifyFinance, getSettlements);
router.patch("/settlements/:id", verifyFinance, updateSettlement);

// Notifications / alerts
router.get("/notifications", verifyAdmin, getNotifications);
router.patch("/notifications/:id/read", verifyAdmin, markNotificationRead);

// Withdrawal Approval Routes
router.get("/withdrawals", verifyAdmin, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = (await import("../config/supabase.js")).default;
    const { data: withdrawals } = await supabase.from("withdrawals").select("*, agents(*)").order("created_at", { ascending: false });
    res.status(200).json({ success: true, withdrawals: (withdrawals || []).map(w => ({ ...w, _id: w.id })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/withdrawals/:id", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Approved", "Rejected", "Completed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const supabase = (await import("../config/supabase.js")).default;
    const { data: withdrawal } = await supabase.from("withdrawals").update({ status, approved_at: new Date() }).eq("id", req.params.id).select().single();
    res.status(200).json({ success: true, message: `Withdrawal updated to ${status}`, withdrawal: { ...withdrawal, _id: withdrawal.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Referral Settings
router.get("/referral/settings", verifyAdmin, getReferralSettings);
router.patch("/referral/settings", verifyAdmin, updateReferralSettings);
router.get("/referral/stats", verifyAdmin, getReferralStats);

// Dev only mock seeder
router.post("/seed", seedMockData);

export default router;
