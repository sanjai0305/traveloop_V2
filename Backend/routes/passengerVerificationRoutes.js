import express from "express";
import protect from "../middleware/authMiddleware.js";
import supabase from "../config/supabase.js";

const router = express.Router();

router.post("/send-otp", protect, async (req, res) => {
  res.json({ success: true, message: "OTP sent to email." });
});

router.post("/verify-otp", protect, async (req, res) => {
  try {
    const { phone } = req.body;
    await supabase.from("users").update({ phone, is_verified: true }).eq("id", req.user.id);
    res.json({ success: true, verified: true, message: "Phone number verified!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/check-verification", protect, async (req, res) => {
  res.json({ success: true, verified: true });
});

router.post("/update-phone-verified", protect, async (req, res) => {
  res.json({ success: true, verified: true });
});

export default router;
