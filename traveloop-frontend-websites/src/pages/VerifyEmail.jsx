import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, ShieldCheck, RefreshCw, ArrowLeft } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { sendOtpCode, verifyOtpCode } from "../services/authService";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const formData = location.state?.formData;
  
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Timer for Resend OTP (30 seconds cooldown)
  const [resendTimer, setResendTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [resendCount, setResendCount] = useState(1); // Track resend attempts (Phase 4)
  
  const inputRefs = useRef([]);

  // Redirect if accessed directly without form data
  useEffect(() => {
    if (!formData || !formData.email) {
      navigate("/register", { replace: true });
    }
  }, [formData, navigate]);

  // Auto-focus first OTP input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer logic
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Keep only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      
      // If current is empty, clear previous and focus previous
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        // Just clear current
        newOtp[index] = "";
        setOtp(newOtp);
      }
      setError("");
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim();
    if (data.length === 6 && /^\d+$/.test(data)) {
      const pasteOtp = data.split("");
      setOtp(pasteOtp);
      inputRefs.current[5].focus();
      setError("");
    }
  };

  // Submit Handler (Atomic backend registration & Client auth sync)
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join("");
    
    if (otpCode.length < 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Verify OTP and register user atomically on the backend
      const verifyRes = await verifyOtpCode(formData.email, otpCode, formData);
      const { user, token } = verifyRes;

      setSuccess("Email verified! Finalizing registration...");

      // 2. Synchronize client-side Firebase Auth state (Phase 6 Sync)
      try {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } catch (fbErr) {
        console.warn("Client Firebase Auth login failed, proceeding...", fbErr);
      }

      // 3. Clear session storage cache
      sessionStorage.removeItem("traveloop_register_form");

      // 4. Log in globally in the App
      login(user, token);

      // 5. Success navigation
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("[VerifyEmail] Verification error:", err);
      setError(err.message || "Invalid code. Please verify the code and try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  // Resend Handler
  const handleResend = async () => {
    if (isResendDisabled || resendCount >= 5) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendOtpCode(formData);
      setSuccess("A new verification code has been sent to your email.");
      setOtp(new Array(6).fill(""));
      setResendTimer(30);
      setIsResendDisabled(true);
      setResendCount((prev) => prev + 1);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      setError(err.message || "Failed to resend verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return null;

  const maskedEmail = (() => {
    if (!formData?.email) return "";
    const [name, domain] = formData.email.split("@");
    if (!domain) return formData.email;
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.substring(0, 2)}******${name.slice(-1)}@${domain}`;
  })();

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto pt-4 text-center space-y-4">
        {/* ICON */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/35 border border-teal-100 dark:border-teal-900/40 flex items-center justify-center text-teal-500 animate-pulse">
            <Mail size={24} />
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
          Verify Your Email
        </h2>

        {/* SUBTITLE */}
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed px-4">
          We sent a 6-digit verification code to:
          <br />
          <span className="font-bold text-teal-650 dark:text-teal-400 break-all">
            {maskedEmail}
          </span>
        </p>

        {/* FORM */}
        <form onSubmit={handleVerify} className="animate-slide-up w-full max-w-md mx-auto space-y-4 pt-2">
          {/* PREMIUM CARD CONTAINER */}
          <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-[28px] p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-5">
            {/* COMPACT INLINE ALERT FOR ERRORS / SUCCESS */}
            {error && (
              <div className="flex items-center justify-center gap-2 text-rose-500 dark:text-rose-400 text-xs sm:text-sm font-bold py-2 px-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 rounded-xl animate-shake">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold py-2 px-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-xl">
                <span>✓</span>
                <span>{success}</span>
              </div>
            )}

            {/* 6 OTP BOXES */}
            <div className="flex justify-center gap-2 sm:gap-3 direction-ltr py-1" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-[42px] h-[50px] xs:w-[48px] xs:h-[56px] sm:w-[52px] sm:h-[60px] text-center text-xl sm:text-2xl font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:scale-[1.05] transition-all duration-200 shadow-sm"
                  disabled={loading}
                />
              ))}
            </div>

            {/* INLINE TIMER & RESEND LINK */}
            <div className="flex items-center justify-between text-xs sm:text-sm px-1 py-0.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {formatTime(resendTimer)} remaining
              </span>
              {isResendDisabled ? (
                <span className="text-slate-400 dark:text-slate-650 font-semibold select-none cursor-not-allowed">
                  Resend Code
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || resendCount >= 5}
                  className="text-teal-650 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold transition-colors hover:underline"
                >
                  Resend Code
                </button>
              )}
            </div>

            {/* VERIFY BUTTON */}
            <Button
              type="submit"
              text="Verify OTP"
              loading={loading}
              icon={ShieldCheck}
              className="w-full shadow-md hover:shadow-lg transition-all"
            />

            {/* TEXT ACTIONS AT BOTTOM */}
            <div className="flex justify-between items-center px-1 pt-1 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => navigate("/register")}
                disabled={loading}
                className="text-slate-500 hover:text-teal-650 dark:text-slate-450 dark:hover:text-teal-350 font-bold transition-colors flex items-center gap-1.5 active:scale-95 duration-200"
              >
                <ArrowLeft size={16} />
                Back to Register
              </button>

              {resendCount >= 5 && (
                <span className="text-rose-500 dark:text-rose-400 font-bold text-xs">
                  Limit Exceeded
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-4">
            Please check your spam or promotions folder if you do not see the code in your inbox.
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
