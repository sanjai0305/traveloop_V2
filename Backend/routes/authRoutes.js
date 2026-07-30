import express from "express";

import {
  registerUser,
  loginUser,
  getMe,
  googleAuth,
  acceptTerms,
  forgotPassword,
  validateEmail,
  sendOtp,
  verifyOtp,
  validateReferralCode,
  getFirebaseTestPhone,
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// FIREBASE TEST PHONE (DEV ONLY)
router.get("/firebase-test-phone", getFirebaseTestPhone);

// SEND OTP
router.post("/send-otp", sendOtp);

// VERIFY OTP
router.post("/verify-otp", verifyOtp);

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);


// GOOGLE AUTH
router.post("/google", googleAuth);

// FORGOT PASSWORD
router.post("/forgot-password", forgotPassword);

// VALIDATE EMAIL
router.post("/validate-email", validateEmail);

// VALIDATE REFERRAL CODE
router.get("/validate-referral/:code", validateReferralCode);

// GET CURRENT USER
router.get("/me", protect, getMe);

// ACCEPT TERMS
router.patch("/accept-terms", protect, acceptTerms);

export default router;