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

// Dev only mock seeder
router.post("/seed", seedMockData);

export default router;
