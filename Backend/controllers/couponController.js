import supabase from "../config/supabase.js";

export const validateCoupon = async (req, res) => {
  try {
    const { couponCode, bookingAmount } = req.body;
    if (!couponCode) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const normalizedCode = couponCode.trim().toUpperCase();

    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid coupon code" });
    }

    const discountAmount = Math.round((bookingAmount || 1000) * (coupon.discount_value / 100));

    return res.status(200).json({
      success: true,
      message: "Coupon Applied Successfully",
      couponCode: normalizedCode,
      discountAmount,
      updatedTotal: Math.max(0, (bookingAmount || 1000) - discountAmount),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyCoupons = async (req, res) => {
  try {
    const { data: coupons } = await supabase.from("coupons").select("*");
    const formatted = (coupons || []).map((c) => ({ ...c, _id: c.id, couponCode: c.code }));
    res.json({ success: true, available: formatted, used: [], expired: [], coupons: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const { data: coupons } = await supabase.from("coupons").select("*");
    res.json({ success: true, coupons: (coupons || []).map((c) => ({ ...c, _id: c.id })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { couponCode, discountValue } = req.body;
    const { data: coupon } = await supabase
      .from("coupons")
      .insert([{ code: (couponCode || "").toUpperCase(), discount_value: discountValue || 10 }])
      .select()
      .single();

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  res.json({ success: true, message: "Coupon updated" });
};

export const deleteCoupon = async (req, res) => {
  res.json({ success: true, message: "Coupon deleted" });
};

export const getCouponUsage = async (req, res) => {
  res.json({ success: true, usage: [] });
};

export const getExpiredCoupons = async (req, res) => {
  res.json({ success: true, expired: [] });
};
