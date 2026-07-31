// src/services/phoneAuthService.js
// Firebase Phone Authentication Service for Mobile Verification

import { auth } from "./firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

let recaptchaVerifier = null;
let confirmationResult = null;

/**
 * Initialize RecaptchaVerifier for Firebase Phone Auth
 * @param {string} containerId - ID of the container element for reCAPTCHA
 * @param {object} options - Additional options for RecaptchaVerifier
 * @returns {RecaptchaVerifier}
 */
export const initRecaptcha = (containerId, options = {}) => {
  if (!auth) {
    throw new Error("Firebase Auth not initialized");
  }

  // Clear existing verifier if any
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: (response) => {
      console.log("[PhoneAuth] reCAPTCHA solved:", response);
    },
    "expired-callback": () => {
      console.warn("[PhoneAuth] reCAPTCHA expired");
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
    },
    ...options,
  });

  return recaptchaVerifier;
};

/**
 * Send OTP to phone number using Firebase Phone Auth
 * @param {string} phoneNumber - Phone number in format "+91XXXXXXXXXX"
 * @param {string} containerId - ID of the container element for reCAPTCHA
 * @returns {Promise<ConfirmationResult>}
 */
export const sendPhoneOtp = async (phoneNumber, containerId = "recaptcha-container") => {
  try {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }

    // Initialize RecaptchaVerifier
    const verifier = initRecaptcha(containerId);

    // Format phone number if needed (ensure it starts with +)
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith("+")) {
      // Assume Indian numbers if no country code
      formattedPhone = `+91${phoneNumber.replace(/\D/g, "")}`;
    }

    console.log("[PhoneAuth] Sending OTP to:", formattedPhone);

    // Send OTP using Firebase Phone Auth
    const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    confirmationResult = result;

    console.log("[PhoneAuth] OTP sent successfully");
    return result;
  } catch (error) {
    console.error("[PhoneAuth] Error sending OTP:", error);
    
    // Clear verifier on error
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    
    throw error;
  }
};

/**
 * Verify OTP code sent to phone number
 * @param {string} code - 6-digit OTP code
 * @returns {Promise<Object>} User credential from Firebase
 */
export const verifyPhoneOtp = async (code) => {
  try {
    if (!confirmationResult) {
      throw new Error("No pending OTP verification. Please request OTP first.");
    }

    console.log("[PhoneAuth] Verifying OTP code");

    const userCredential = await confirmationResult.confirm(code);
    
    console.log("[PhoneAuth] OTP verified successfully:", userCredential.user?.phoneNumber);
    
    // Clear confirmation result after successful verification
    confirmationResult = null;
    
    return userCredential;
  } catch (error) {
    console.error("[PhoneAuth] Error verifying OTP:", error);
    throw error;
  }
};

/**
 * Clear RecaptchaVerifier and reset state
 */
export const clearPhoneAuth = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  confirmationResult = null;
};

/**
 * Get current confirmation result (for testing/debugging)
 * @returns {ConfirmationResult|null}
 */
export const getConfirmationResult = () => confirmationResult;

export default {
  initRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
  clearPhoneAuth,
  getConfirmationResult,
};
