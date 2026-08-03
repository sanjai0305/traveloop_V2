// src/pages/VerifyPhone.jsx
// Premium Full-Width Desktop Phone Verification Onboarding Page - TravelLoop

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Lock,
  Check,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Phone,
  HelpCircle,
  ChevronDown,
  AlertCircle,
  Sparkles,
  BellRing,
  UserCheck,
  Plane,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";
import { auth } from "../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Country Codes dataset — India +91 default
const COUNTRIES = [
  { code: "IN", dialCode: "+91", flag: "🇮🇳", name: "India" },
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "United States" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "AE", dialCode: "+971", flag: "🇦🇪", name: "United Arab Emirates" },
  { code: "SG", dialCode: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "AU", dialCode: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "France" },
  { code: "MY", dialCode: "+60", flag: "🇲🇾", name: "Malaysia" },
];

export const VerifyPhone = ({ isModal = false, onComplete }) => {
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated, loading, userRefreshed } = useAuth();
  const toast = useToast();

  // Selected Country state — default India +91 ALWAYS
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  useEffect(() => {
    if (!loading && userRefreshed) {
      if (!isAuthenticated) {
        navigate("/", { replace: true });
        return;
      }
      if (user?.phoneVerified) {
        if (onComplete) {
          onComplete();
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    }
  }, [user, isAuthenticated, loading, userRefreshed, navigate, onComplete]);

  useEffect(() => {
    if (user?.phoneNumber || user?.phone) {
      const raw = user.phoneNumber || user.phone || "";
      const digitsOnly = raw.replace(/\D/g, "");
      if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
        setPhoneNumber(digitsOnly.slice(2));
      } else if (digitsOnly.length === 10) {
        setPhoneNumber(digitsOnly);
      }
    }
  }, [user]);

  const isValidPhone = useMemo(() => {
    const clean = phoneNumber.replace(/\D/g, "");
    return clean.length === 10;
  }, [phoneNumber]);

  useEffect(() => {
    let interval = null;
    if (otpSent && timer > 0 && !isSuccess) {
      setCanResend(false);
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, timer, isSuccess]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [timer]);

  useEffect(() => {
    if (!otpSent || isSuccess) return;

    let ac = new AbortController();
    if ("OTPCredential" in window) {
      navigator.credentials
        .get({
          otp: { transport: ["sms"] },
          signal: ac.signal,
        })
        .then((otp) => {
          if (otp && otp.code) {
            const codeStr = otp.code.replace(/\D/g, "").slice(0, 6);
            if (codeStr.length === 6) {
              const newDigits = codeStr.split("");
              setOtpDigits(newDigits);
              toast.success("SMS verification code detected automatically.");
              handleVerifyCode(codeStr);
            }
          }
        })
        .catch((err) => {
          console.warn("[WebOTP] Auto-read not triggered or aborted:", err?.message || err);
        });
    }
    return () => {
      ac.abort();
    };
  }, [otpSent, isSuccess]);

  const handleSendOtp = async () => {
    if (!isValidPhone) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setOtpSending(true);
    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("[Recaptcha] Clearing previous verifier:", e);
        }
        window.recaptchaVerifier = null;
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => console.log("[PhoneAuth] reCAPTCHA verified"),
        "expired-callback": () => console.log("[PhoneAuth] reCAPTCHA expired"),
      });

      const digits = phoneNumber.replace(/\D/g, "");
      const formattedPhone = `${selectedCountry.dialCode}${digits}`;

      console.log("[Firebase Phone Auth] Requesting OTP for:", formattedPhone);

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;

      setOtpSent(true);
      setTimer(120);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      toast.success(`Verification code sent to ${selectedCountry.dialCode} ${digits}`);

      setTimeout(() => {
        if (otpInputRefs[0]?.current) {
          otpInputRefs[0].current.focus();
        }
      }, 300);
    } catch (err) {
      console.error("[PhoneAuth] Error sending OTP:", err);
      toast.error(err.message || "Failed to send verification SMS. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const val = value.replace(/\D/g, "");
    if (!val) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = "";
      setOtpDigits(nextDigits);
      return;
    }

    const char = val.slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);

    if (index < 5) {
      otpInputRefs[index + 1].current?.focus();
    } else {
      const fullCode = nextDigits.join("");
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs[index - 1].current?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = ["", "", "", "", "", ""];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);

      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs[nextFocus].current?.focus();

      if (pasted.length === 6) {
        handleVerifyCode(pasted);
      }
    }
  };

  const handleVerifyCode = async (codeOverride) => {
    const code = codeOverride || otpDigits.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setOtpVerifying(true);
    try {
      if (!window.confirmationResult) {
        throw new Error("No active verification session. Please request a new code.");
      }

      const result = await window.confirmationResult.confirm(code);
      const idToken = await result.user.getIdToken();
      const token = localStorage.getItem("token");

      const digits = phoneNumber.replace(/\D/g, "");
      const formattedPhone = `${selectedCountry.dialCode}${digits}`;

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
        throw new Error(data.message || "Mobile verification failed.");
      }

      updateUser({
        ...(user || {}),
        ...data.user,
        phoneVerified: true,
        phoneNumber: data.user?.phoneNumber || formattedPhone,
      });

      setIsSuccess(true);
      toast.success("Mobile number verified successfully!");
    } catch (err) {
      console.error("[PhoneAuth] Verify error:", err);
      toast.error(err.message || "Invalid code entered. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleContinue = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const userInitials = useMemo(() => {
    if (user?.name) {
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "TL";
  }, [user]);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans relative overflow-hidden select-none">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none filter blur-[6px] scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2400&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B14]/90 via-[#070B14]/95 to-[#070B14] pointer-events-none" />

      <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div id="recaptcha-container" className="hidden"></div>

      {!isModal && (
        <header className="w-full max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between z-20 relative border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-3 group text-decoration-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              TL
            </div>
            <span className="text-xl font-black tracking-tight text-white uppercase">
              Travel<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Loop</span>
            </span>
          </Link>

          <div className="flex items-center gap-10">
            <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-400">
              <Link to="/activities" className="hover:text-white transition-colors">Explore</Link>
              <Link to="/saved-destinations" className="hover:text-white transition-colors">Destinations</Link>
              <Link to="/my-trips" className="hover:text-white transition-colors">Packages</Link>
              <a href="mailto:support@traveloop.com" className="hover:text-white transition-colors flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-400" /> Support
              </a>
            </nav>

            <div className="flex items-center gap-3 border-l border-white/10 pl-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-[1.5px] shadow-lg shadow-cyan-500/10">
                <div className="w-full h-full rounded-full bg-[#070B14] flex items-center justify-center font-black text-xs text-white">
                  {userInitials}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="w-full max-w-[1400px] mx-auto px-8 pt-8 z-20">
        <div className="flex items-center justify-between mb-3 text-xs font-bold">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
            <span>Legal Documents ✓</span>
          </div>

          <div className="flex items-center gap-2 text-cyan-400">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-cyan-400 text-[11px] font-black">
              2
            </span>
            <span>Phone Verification (Current)</span>
          </div>
        </div>

        <div className="w-full h-[3px] bg-white/[0.08] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "50%" }}
            animate={{ width: isSuccess ? "100%" : "75%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
          />
        </div>
      </div>

      <main className="w-full max-w-[1400px] mx-auto px-8 py-10 flex-1 flex items-center z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-7 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-extrabold uppercase tracking-widest shadow-sm shadow-cyan-500/10">
              <Lock className="w-3.5 h-3.5" /> ACCOUNT SECURITY
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Verify Your Mobile Number
              </h1>
              <p className="text-slate-300 text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
                To protect your travel itinerary, secure flight & hotel reservations, and receive real-time updates regarding your journey, please verify your primary contact number.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md flex items-start gap-3.5 hover:border-cyan-500/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Secure Account</h3>
                  <p className="text-xs text-slate-400 leading-snug">Enterprise encryption protects your traveler profile.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md flex items-start gap-3.5 hover:border-cyan-500/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Booking Protection</h3>
                  <p className="text-xs text-slate-400 leading-snug">Verified guest identity for ticket & hotel reservations.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md flex items-start gap-3.5 hover:border-cyan-500/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Trip Notifications</h3>
                  <p className="text-xs text-slate-400 leading-snug">Instant SMS alerts for departure & platform updates.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md flex items-start gap-3.5 hover:border-cyan-500/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Emergency Contact</h3>
                  <p className="text-xs text-slate-400 leading-snug">24/7 priority assistance during active trip itineraries.</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6 p-6 rounded-3xl bg-gradient-to-r from-cyan-950/20 via-blue-950/20 to-transparent border border-cyan-500/20 relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black shadow-xl shadow-cyan-500/20 shrink-0">
                <Plane className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  Verified Traveler Status <Sparkles className="w-4 h-4 text-cyan-400" />
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                  Once verified, your account is immediately granted priority manifest confirmation for group departures and luxury packages.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div
              className="w-full max-w-[520px] rounded-[24px] border border-white/[0.08] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-2xl transition-all duration-300"
              style={{
                background: "rgba(17, 24, 39, 0.85)",
                boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
              }}
            >
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center text-center py-6"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-500/10"
                    >
                      <ShieldCheck className="w-10 h-10 stroke-[2.2]" />
                    </motion.div>

                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
                      Phone Verified Successfully
                    </h2>
                    <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
                      Your account is now fully verified.
                    </p>

                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleContinue}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-base tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 hover:shadow-cyan-500/40 transition-all cursor-pointer"
                    >
                      Continue to Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="verify-form-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-extrabold text-white tracking-tight mb-1">
                        Mobile Verification
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Enter your 10-digit phone number to receive a secure SMS verification code.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div
                            className={`h-[60px] rounded-2xl border transition-all duration-200 flex items-center bg-slate-900/60 overflow-hidden ${
                              isValidPhone
                                ? "border-blue-500/80 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                                : "border-white/10 hover:border-white/20 focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                            }`}
                          >
                            <div className="relative border-r border-white/10 h-full">
                              <button
                                type="button"
                                onClick={() => setCountryDropdownOpen((v) => !v)}
                                className="h-full px-4 flex items-center gap-2 hover:bg-white/5 transition-colors text-slate-200 font-bold text-sm"
                              >
                                <span className="text-lg leading-none">{selectedCountry.flag}</span>
                                <span className="font-mono">{selectedCountry.dialCode}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              </button>

                              {countryDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50 max-h-60 overflow-y-auto backdrop-blur-xl">
                                  {COUNTRIES.map((c) => (
                                    <button
                                      key={c.code}
                                      type="button"
                                      onClick={() => {
                                        setSelectedCountry(c);
                                        setCountryDropdownOpen(false);
                                      }}
                                      className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors text-xs text-slate-200 font-semibold"
                                    >
                                      <span className="text-base">{c.flag}</span>
                                      <span className="flex-1 truncate">{c.name}</span>
                                      <span className="font-mono text-slate-400">{c.dialCode}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              placeholder="+91 98765 43210"
                              maxLength={10}
                              className="flex-1 h-full bg-transparent px-4 text-base font-bold text-white placeholder-white/35 outline-none tracking-wider font-mono"
                            />

                            <div className="px-4 flex items-center">
                              {isValidPhone ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : phoneNumber.length > 0 ? (
                                <AlertCircle className="w-5 h-5 text-slate-500" />
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-[#94A3B8] mt-1.5 pl-1 font-medium">
                          Example: +91 98765 43210
                        </p>
                      </div>

                      <motion.button
                        whileHover={isValidPhone && !otpSending ? { y: -2 } : {}}
                        whileTap={isValidPhone && !otpSending ? { scale: 0.98 } : {}}
                        onClick={handleSendOtp}
                        disabled={!isValidPhone || otpSending}
                        className={`w-full h-14 rounded-2xl font-extrabold text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                          isValidPhone && !otpSending
                            ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer"
                            : "bg-slate-800/80 text-slate-500 border border-white/5 cursor-not-allowed"
                        }`}
                      >
                        {otpSending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Sending Code...
                          </>
                        ) : otpSent ? (
                          "Resend Verification Code"
                        ) : (
                          "Send Verification Code"
                        )}
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {otpSent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: 15 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: 15 }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                          className="pt-5 border-t border-white/[0.08] space-y-5"
                        >
                          <div className="text-center space-y-1">
                            <p className="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">
                              Verification code sent to
                            </p>
                            <p className="text-sm font-extrabold text-white font-mono">
                              +91 ••••• ••{phoneNumber.length >= 3 ? phoneNumber.slice(-3) : "123"}
                            </p>
                            <p className="text-xs text-[#94A3B8] pt-1">
                              Enter the 6-digit verification code.
                            </p>
                          </div>

                          <div className="flex justify-center items-center gap-2.5 sm:gap-3" onPaste={handleOtpPaste}>
                            {otpDigits.map((digit, idx) => (
                              <div key={idx} className="relative">
                                <input
                                  ref={otpInputRefs[idx]}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={1}
                                  value={digit}
                                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                  className={`w-11 h-14 sm:w-13 sm:h-16 rounded-xl border bg-slate-900/90 text-center text-xl sm:text-2xl font-black text-white outline-none font-mono transition-all duration-200 ${
                                    digit
                                      ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                      : "border-white/10 focus:border-blue-500 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                                  }`}
                                />
                                {!digit && (
                                  <span className="absolute inset-0 flex items-center justify-center text-white/25 font-mono text-xl pointer-events-none">
                                    {idx + 1}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                            <span className="font-mono text-slate-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                              {canResend ? "Code expired" : `Resend available in ${formattedTimer}`}
                            </span>

                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={!canResend || otpSending}
                              className={`font-bold transition-colors ${
                                canResend && !otpSending
                                  ? "text-blue-400 hover:text-blue-300 cursor-pointer underline underline-offset-4"
                                  : "text-slate-600 cursor-not-allowed"
                              }`}
                            >
                              Resend Code
                            </button>
                          </div>

                          <motion.button
                            whileHover={otpDigits.join("").length === 6 && !otpVerifying ? { y: -2 } : {}}
                            whileTap={otpDigits.join("").length === 6 && !otpVerifying ? { scale: 0.98 } : {}}
                            onClick={() => handleVerifyCode()}
                            disabled={otpVerifying || otpDigits.join("").length < 6}
                            className={`w-full h-14 rounded-2xl font-extrabold text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                              otpDigits.join("").length === 6 && !otpVerifying
                                ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer"
                                : "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-75"
                            }`}
                          >
                            {otpVerifying ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                Verify & Continue
                                <ArrowRight className="w-5 h-5 text-white" />
                              </>
                            )}
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-2 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">
                      <Shield className="w-3.5 h-3.5 text-cyan-500/70 shrink-0" />
                      <span>Your phone number is encrypted using enterprise-grade security and is never shared with third parties.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </main>

      {!isModal && (
        <footer className="w-full max-w-[1400px] mx-auto px-8 py-6 text-center text-xs text-slate-600 border-t border-white/[0.04] z-10">
          © {new Date().getFullYear()} TravelLoop Inc. All rights reserved. · Encrypted & Verified Authentication
        </footer>
      )}
    </div>
  );
};

export default VerifyPhone;
