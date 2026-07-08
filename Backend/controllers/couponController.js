import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

// POST /api/coupons/validate
export const validateCoupon = async (req, res) => {
  const { couponCode, bookingAmount } = req.body;
  const userId = req.user.id || req.user._id;

  if (!couponCode || !couponCode.trim()) {
    return res.status(400).json({ success: false, message: "Coupon code is required" });
  }
  if (bookingAmount === undefined || bookingAmount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid booking amount" });
  }

  try {
    const normalizedCode = couponCode.trim().toUpperCase();

    // 1. Check if it's a User Referral Code
    const inviter = await User.findOne({ referralCode: normalizedCode });
    if (inviter) {
      if (String(inviter._id) === String(userId)) {
        return res.status(400).json({
          success: false,
          message: "You cannot use your own referral code"
        });
      }
      
      // Referral codes give a flat 5% discount
      const discountPercent = 5;
      const discountAmount = Math.round(bookingAmount * (discountPercent / 100));
      const updatedTotal = bookingAmount - discountAmount;

      return res.status(200).json({
        success: true,
        message: "Referral code applied successfully!",
        couponCode: normalizedCode,
        type: "REFERRAL",
        discountType: "PERCENTAGE",
        discountValue: discountPercent,
        discountAmount,
        updatedTotal
      });
    }

    // 2. Search Coupon Collection
    const coupon = await Coupon.findOne({ couponCode: normalizedCode });
    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid Coupon" });
    }

    if (coupon.status === "INACTIVE") {
      return res.status(400).json({ success: false, message: "Inactive Coupon" });
    }

    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ success: false, message: "Expired Coupon" });
    }

    if (bookingAmount < coupon.minimumAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum Booking Amount Not Met`
      });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Coupon Limit Reached" });
    }

    // User Eligibility Check (max 1 usage per user of a coupon)
    const userUsage = await Booking.countDocuments({
      userId,
      couponCode: normalizedCode,
      paymentStatus: "Paid"
    });
    if (userUsage > 0) {
      return res.status(400).json({ success: false, message: "Coupon Already Used" });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = Math.round(bookingAmount * (coupon.discountValue / 100));
      if (coupon.maxDiscount !== null && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > bookingAmount) {
      discountAmount = bookingAmount;
    }

    const updatedTotal = bookingAmount - discountAmount;

    return res.status(200).json({
      success: true,
      message: "Coupon Applied Successfully",
      couponCode: normalizedCode,
      type: "ADMIN",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      updatedTotal
    });
  } catch (error) {
    console.error("[Coupon Validate] Error:", error);
    return res.status(500).json({ success: false, message: "Server Error validating coupon" });
  }
};

// GET /api/coupons
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/coupons
export const createCoupon = async (req, res) => {
  const {
    couponCode,
    type,
    discountType,
    discountValue,
    maxDiscount,
    minimumAmount,
    expiryDate,
    usageLimit,
    status
  } = req.body;

  try {
    if (!couponCode) {
      return res.status(400).json({ success: false, message: "couponCode is required" });
    }

    const existing = await Coupon.findOne({ couponCode: couponCode.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      couponCode: couponCode.trim().toUpperCase(),
      type: type || "ADMIN",
      discountType: discountType || "PERCENTAGE",
      discountValue,
      maxDiscount: maxDiscount || null,
      minimumAmount: minimumAmount || 0,
      expiryDate: expiryDate || null,
      usageLimit: usageLimit || null,
      status: status || "ACTIVE",
      createdBy: "ADMIN"
    });

    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/coupons/:id
export const updateCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/coupons/:id
export const deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    return res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupons/usage
export const getCouponUsage = async (req, res) => {
  try {
    const usage = await Booking.aggregate([
      { $match: { couponCode: { $ne: null, $ne: "" }, paymentStatus: "Paid" } },
      { $group: {
          _id: "$couponCode",
          usedCount: { $sum: 1 },
          totalSavings: { $sum: "$discountAmount" }
        }
      }
    ]);
    return res.status(200).json({ success: true, usage });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupons/expired
export const getExpiredCoupons = async (req, res) => {
  try {
    const now = new Date();
    const expired = await Coupon.find({ expiryDate: { $lt: now } }).sort({ expiryDate: -1 });
    return res.status(200).json({ success: true, expired });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
