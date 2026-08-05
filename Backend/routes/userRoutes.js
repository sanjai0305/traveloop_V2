import express from "express";
import supabase from "../config/supabase.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/user/profile
router.get("/profile", protect, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({ success: true, user: { ...user, _id: user.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/user/verify-phone
router.patch("/verify-phone", protect, async (req, res) => {
  try {
    const { phone, phoneNumber } = req.body;
    const normalizedPhone = phone || phoneNumber || "";
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: "Phone number is required." });
    }

    const { data: user } = await supabase
      .from("users")
      .update({ phone: normalizedPhone, is_verified: true })
      .eq("id", req.user.id)
      .select()
      .single();

    res.json({
      success: true,
      message: "Phone number verified successfully.",
      user: { ...user, _id: user.id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
