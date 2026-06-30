import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../../../../traveloop/src/services/firebase";
import api from "../../../services/api";
import { Agent } from "../../../types";

// Firebase Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogleFirebase = async (): Promise<{ token: string; agent: Agent }> => {
  console.log("[Auth Service] Starting Firebase Google Sign-In popup...");
  const result = await signInWithPopup(auth, googleProvider);
  const firebaseUser = result.user;
  const idToken = await firebaseUser.getIdToken(true);
  
  console.log("[Auth Service] Firebase Sign-In successful. Sending idToken to Agent Portal Backend...");
  
  // Call Agent unified login
  const response = await api.post("/agent/login", {
    idToken,
    email: firebaseUser.email,
    uid: firebaseUser.uid,
  });
  
  return response.data;
};

export const sendEmailOtpCode = async (email: string): Promise<{ success: boolean; message: string }> => {
  console.log(`[Auth Service] Sending OTP request to backend for email: ${email}`);
  const response = await api.post("/auth/send-otp", { email, role: "agent" });
  return response.data;
};

export const verifyEmailOtpCode = async (email: string, otp: string): Promise<{ success: boolean; otpToken: string }> => {
  console.log(`[Auth Service] Verifying OTP code for email: ${email}`);
  // verifyOtp on Backend/routes/authRoutes.js takes: { email, otp }
  const response = await api.post("/auth/verify-otp", { email, otp });
  return response.data;
};

export const loginWithOtpToken = async (
  email: string,
  otpToken: string
): Promise<{ token: string; agent: Agent }> => {
  console.log("[Auth Service] Verification successful. Logging into Agent Portal backend via OTP token...");
  const response = await api.post("/agent/login", {
    email,
    otpToken,
  });
  return response.data;
};
