import { useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import {
  loginWithGoogleFirebase,
  sendEmailOtpCode,
  verifyEmailOtpCode,
  loginWithOtpToken,
} from "../services/auth.service";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setAuth, logout: storeLogout, agent, isAuthenticated } = useAuthStore();

  const googleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loginWithGoogleFirebase();
      setAuth(res.token, res.agent);
      return res.agent;
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.message || "Google Authentication failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await sendEmailOtpCode(email);
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Failed to send verification code";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpAndLogin = async (email: string, otp: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const verifyRes = await verifyEmailOtpCode(email, otp);
      if (verifyRes.success && verifyRes.otpToken) {
        const res = await loginWithOtpToken(email, verifyRes.otpToken);
        setAuth(res.token, res.agent);
        return res.agent;
      } else {
        throw new Error("OTP verification failed");
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.message || "Failed to verify code";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    storeLogout();
  };

  return {
    googleLogin,
    sendOtp,
    verifyOtpAndLogin,
    logout,
    agent,
    isAuthenticated,
    isLoading,
    error,
  };
};
