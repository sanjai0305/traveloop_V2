import express from "express";
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsage,
  getExpiredCoupons,
} from "../controllers/couponController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Public/Traveler endpoints
router.post("/validate", protect, validateCoupon);

// Admin / management endpoints
router.get("/", protect, getCoupons);
router.post("/", protect, createCoupon);
router.put("/:id", protect, updateCoupon);
router.delete("/:id", protect, deleteCoupon);
router.get("/usage", protect, getCouponUsage);
router.get("/expired", protect, getExpiredCoupons);

export default router;
