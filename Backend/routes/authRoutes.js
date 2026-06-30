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
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();


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

// GET CURRENT USER
router.get("/me", protect, getMe);

// ACCEPT TERMS
router.patch("/accept-terms", protect, acceptTerms);


export default router;