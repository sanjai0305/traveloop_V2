import express from "express";
import User from "../models/User.js";
import admin from "../config/firebaseAdmin.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/user/profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/user/verify-phone
router.patch("/verify-phone", protect, async (req, res) => {
  try {
    const { phone, idToken, isAlternate, firebaseUid } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required." });
    }

    let uid = firebaseUid || "";
    if (idToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid;
      } catch (fbErr) {
        return res.status(401).json({ success: false, message: "Invalid or expired Firebase Auth token." });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Standardize to +91XXXXXXXXXX
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") && cleanPhone.length === 12
      ? `+${cleanPhone}`
      : `+91${cleanPhone.slice(-10)}`;

    if (isAlternate) {
      user.alternateNumber = formattedPhone;
      user.alternateMobile = formattedPhone;
      user.alternateVerified = true;
    } else {
      user.phoneNumber = formattedPhone;
      user.primaryMobile = formattedPhone;
      user.phone = formattedPhone;
      user.phoneVerified = true;
      user.primaryVerified = true;
      user.verifiedAt = new Date();
      if (uid) {
        user.firebaseUid = uid;
        user.firebaseUID = uid;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: "Phone number verified successfully.",
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
