import express from "express";
import {
  verifyAdmin,
  verifyFinance,
  verifySuperAdmin,
} from "../middleware/adminAuthMiddleware.js";
import {
  loginAdmin,
  verifyAdmin2FA,
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
router.patch("/trips/:id", verifyAdmin, updateTrip);
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
    const Withdrawal = await import("../models/Withdrawal.js").then(m => m.default);
    const Agent = await import("../models/Agent.js").then(m => m.default);
    const withdrawals = await Withdrawal.find().populate({ path: "agentId", model: Agent }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, withdrawals });
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

    const Withdrawal = await import("../models/Withdrawal.js").then(m => m.default);
    const Wallet = await import("../models/Wallet.js").then(m => m.default);

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Withdrawal request not found" });
    }

    if (withdrawal.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Withdrawal request already processed" });
    }

    const wallet = await Wallet.findOne({ agentId: withdrawal.agentId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Agent wallet not found" });
    }

    if (status === "Approved" || status === "Completed") {
      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - withdrawal.amount);
      wallet.balance = Math.max(0, wallet.balance - withdrawal.amount);
      withdrawal.status = status;
      withdrawal.approvedAt = new Date();
    } else if (status === "Rejected") {
      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - withdrawal.amount);
      wallet.withdrawableBalance += withdrawal.amount;
      withdrawal.status = "Rejected";
    }

    await wallet.save();
    await withdrawal.save();

    res.status(200).json({ success: true, message: `Withdrawal request status updated to ${status}`, withdrawal });
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
