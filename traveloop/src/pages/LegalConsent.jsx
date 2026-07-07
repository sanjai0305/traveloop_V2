// src/pages/LegalConsent.jsx
// Premium Legal Consent & Onboarding Screen - TravelLoop

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, ArrowRight, Loader2, Phone, FileText, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";
import { auth } from "../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const LegalConsent = () => {
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated, loading } = useAuth();
  const toast = useToast();
  
  const [step, setStep] = useState("consent"); // "consent" | "phone"
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = termsAccepted && privacyAccepted;
  const canVerifyPhone = useMemo(() => {
    const clean = phoneNumber.replace(/\D/g, "");
    return clean.length === 10;
  }, [phoneNumber]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (user?.phoneNumber || user?.phone) {
      const p = user.phoneNumber || user.phone || "";
      const digits = p.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) {
        setPhoneNumber(digits.slice(2));
      } else {
        setPhoneNumber(digits);
      }
    }
  }, [user]);

  const handleAccept = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("legal/accept"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?._id || user?.id,
          acceptedTerms: true,
          acceptedAt: new Date().toISOString(),
          termsVersion: "2026-07",
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.user) {
          updateUser(data.user);
        }
        toast.success("Legal consent saved successfully.");
        const currentUser = data.user || user;
        if (currentUser?.phoneVerified) {
          navigate("/dashboard", { replace: true });
        } else {
          setStep("phone");
        }
      } else {
        toast.error(data.message || "Failed to accept terms. Please try again.");
      }
    } catch (err) {
      console.error("[LegalConsent] Error accepting terms:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    if (!canVerifyPhone) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }

    setOtpSending(true);
    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("[Recaptcha] Error clearing recaptcha verifier:", e);
        }
        window.recaptchaVerifier = null;
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => console.log("[LegalConsent] reCAPTCHA solved"),
        "expired-callback": () => console.log("[LegalConsent] reCAPTCHA expired"),
      });

      const digits = phoneNumber.replace(/\D/g, "");
      const formattedPhone = `+91${digits}`;

      console.log("[Firebase Phone Auth] Sending OTP to:", formattedPhone);

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      toast.success("OTP sent successfully. Please check your SMS.");
    } catch (err) {
      console.error("[LegalConsent] OTP send error:", err);
      toast.error(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      toast.error("Please enter the 6-digit OTP sent to your phone.");
      return;
    }

    setOtpVerifying(true);
    try {
      if (!window.confirmationResult) {
        throw new Error("No active verification session found. Please request a new OTP.");
      }

      const result = await window.confirmationResult.confirm(otpCode);
      const idToken = await result.user.getIdToken();
      const token = localStorage.getItem("token");
      
      const digits = phoneNumber.replace(/\D/g, "");
      const formattedPhone = `+91${digits}`;

      const res = await fetch(getApiUrl("user/verify-phone"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          phoneVerified: true,
          idToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Phone verification failed.");
      }

      updateUser({ 
        ...(user || {}), 
        ...data.user, 
        phoneVerified: true, 
        phoneNumber: data.user?.phoneNumber || formattedPhone 
      });
      toast.success("Phone verified successfully.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("[LegalConsent] OTP verify error:", err);
      toast.error(err.message || "Phone verification failed.");
    } finally {
      setOtpVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-12 right-12 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-10 z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 text-base">
          TL
        </div>
        <span className="text-xl font-extrabold tracking-tight text-white uppercase">
          Travel<span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Loop</span>
        </span>
      </div>

      <div className="w-full max-w-xl z-10">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
              step === "consent" 
                ? "bg-cyan-500 border-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20" 
                : "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
            }`}>
              {step === "consent" ? "1" : <Check className="w-4 h-4" />}
            </div>
            <span className={`text-xs font-bold ${step === "consent" ? "text-white" : "text-slate-500"}`}>
              Legal Documents
            </span>
          </div>

          <div className="h-[1px] flex-1 bg-slate-800 mx-4" />

          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
              step === "phone" 
                ? "bg-cyan-500 border-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20" 
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}>
              2
            </div>
            <span className={`text-xs font-bold ${step === "phone" ? "text-white" : "text-slate-500"}`}>
              Phone Verification
            </span>
          </div>
        </div>

        {/* Card Component */}
        <div className="bg-slate-950/45 backdrop-blur-xl border border-slate-900 rounded-[28px] p-8 md:p-10 shadow-2xl relative">
          <AnimatePresence mode="wait">
            {step === "consent" ? (
              <motion.div
                key="consent-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
                    Before you continue
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Please review and accept our legal documents to set up your profile.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Terms & Conditions Card */}
                  <div className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white mb-1">Terms & Conditions</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        Review the rules and guidelines governing the use of TravelLoop services.
                      </p>
                      <a
                        href="/legal-site/index.html?doc=terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Read Terms & Conditions
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Privacy Policy Card */}
                  <div className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-950/50 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white mb-1">Privacy Policy</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        Learn how we securely collect, use, and process your personal travel details.
                      </p>
                      <a
                        href="/legal-site/index.html?doc=privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        Read Privacy Policy
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3.5 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-900 peer-checked:border-cyan-500 peer-checked:bg-cyan-500 flex items-center justify-center transition-all">
                        {termsAccepted && <Check className="w-3.5 h-3.5 text-slate-950 font-black" />}
                      </div>
                    </div>
                    <span className="text-xs text-slate-300 font-medium">
                      I have read and agree to the <span className="text-white font-bold">Terms & Conditions</span>.
                    </span>
                  </label>

                  <label className="flex items-center gap-3.5 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-900 peer-checked:border-teal-500 peer-checked:bg-teal-500 flex items-center justify-center transition-all">
                        {privacyAccepted && <Check className="w-3.5 h-3.5 text-slate-950 font-black" />}
                      </div>
                    </div>
                    <span className="text-xs text-slate-300 font-medium">
                      I have read and agree to the <span className="text-white font-bold">Privacy Policy</span>.
                    </span>
                  </label>
                </div>

                {/* Action button */}
                <button
                  onClick={handleAccept}
                  disabled={!canSubmit || submitting}
                  className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    canSubmit && !submitting
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-[0.98]"
                      : "bg-slate-900 border border-slate-800/80 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving consent...
                    </>
                  ) : (
                    <>
                      Accept & Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
                    Verify Mobile Number
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Enter your mobile number to receive a secure Firebase SMS verification OTP code.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-slate-400 text-xs font-semibold block">
                      Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 px-4 text-sm text-slate-300 font-bold tracking-wide">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter 10-digit number"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3.5 text-sm text-white outline-none focus:border-cyan-500 focus:bg-slate-900/60 transition-all font-bold tracking-wider"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || !canVerifyPhone}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      canVerifyPhone && !otpSending
                        ? "bg-slate-800 text-white hover:bg-slate-700 active:scale-[0.98]"
                        : "bg-slate-900 text-slate-600 border border-slate-800/80 cursor-not-allowed"
                    }`}
                  >
                    {otpSending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                      </span>
                    ) : otpSent ? (
                      "Resend Verification OTP"
                    ) : (
                      "Send SMS OTP"
                    )}
                  </button>
                </div>

                {/* Recaptcha element */}
                <div id="recaptcha-container" className="mt-2 flex justify-center"></div>

                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-slate-900 pt-6 space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-slate-400 text-xs font-semibold block">
                        Enter 6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full text-center rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3.5 text-lg font-black tracking-[0.5em] text-cyan-400 outline-none focus:border-cyan-500 focus:bg-slate-900/60 transition-all"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpVerifying || otpCode.length < 6}
                      className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        otpCode.length === 6 && !otpVerifying
                          ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-[0.98]"
                          : "bg-slate-900 text-slate-600 border border-slate-800/80 cursor-not-allowed"
                      }`}
                    >
                      {otpVerifying ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                        </span>
                      ) : (
                        "Verify and Finish Onboarding"
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center z-10">
        <p className="text-slate-600 text-xs font-semibold">
          Secure verification powered by Firebase Authentication
        </p>
      </div>
    </div>
  );
};

export default LegalConsent;
