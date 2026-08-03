// src/pages/VerifyPhone.jsx
// Enterprise-Grade Phone Verification Onboarding Page - Inspired by Stripe, Linear, Notion, Apple & Revolut

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Phone,
  HelpCircle,
  ChevronDown,
  AlertCircle,
  Sparkles,
  Search,
  Plane,
  Bell,
  Copy,
  EyeOff,
  Info,
} from "lucide-react";
import { AsYouType, isValidPhoneNumber } from "libphonenumber-js";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";
import { auth } from "../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Comprehensive dataset of countries with dial codes, flags, ISO codes, and default examples
const COUNTRIES = [
  { code: "IN", dialCode: "+91", flag: "🇮🇳", name: "India", example: "98765 43210" },
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "United States", example: "(123) 456-7890" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom", example: "07123 456789" },
  { code: "AE", dialCode: "+971", flag: "🇦🇪", name: "United Arab Emirates", example: "50 123 4567" },
  { code: "SG", dialCode: "+65", flag: "🇸🇬", name: "Singapore", example: "8123 4567" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦", name: "Canada", example: "(123) 456-7890" },
  { code: "AU", dialCode: "+61", flag: "🇦🇺", name: "Australia", example: "0412 345 678" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪", name: "Germany", example: "0151 23456789" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "France", example: "06 12 34 56 78" },
  { code: "MY", dialCode: "+60", flag: "🇲🇾", name: "Malaysia", example: "012-345 6789" },
  { code: "SA", dialCode: "+966", flag: "🇸🇦", name: "Saudi Arabia", example: "51 234 5678" },
  { code: "JP", dialCode: "+81", flag: "🇯🇵", name: "Japan", example: "090-1234-5678" },
  { code: "CH", dialCode: "+41", flag: "🇨🇭", name: "Switzerland", example: "079 123 45 67" },
  { code: "NL", dialCode: "+31", flag: "🇳🇱", name: "Netherlands", example: "06 12345678" },
  { code: "IT", dialCode: "+39", flag: "🇮🇹", name: "Italy", example: "312 345 6789" },
  { code: "ES", dialCode: "+34", flag: "🇪🇸", name: "Spain", example: "612 34 56 78" },
  { code: "BR", dialCode: "+55", flag: "🇧🇷", name: "Brazil", example: "11 91234-5678" },
];

export const VerifyPhone = ({ isModal = false, onComplete }) => {
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated, loading, userRefreshed } = useAuth();
  const toast = useToast();

  // Selected Country state — default India (+91)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");

  // Raw digits entered by user (excluding country code)
  const [rawPhoneDigits, setRawPhoneDigits] = useState("");
  // Formatted phone string for display inside input box
  const [formattedPhoneDisplay, setFormattedPhoneDisplay] = useState("");

  // OTP state
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Resend Timer (30 seconds resend cooldown)
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Copy Feedback states
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Validation Shake animation trigger
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const dropdownRef = useRef(null);
  const otpInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Formatted Timer String (MM:SS e.g. 00:29)
  const formattedTimer = useMemo(() => {
    const mins = Math.floor(resendTimer / 60);
    const secs = resendTimer % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [resendTimer]);

  // Auto-redirect if user's phone is already verified
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

  // Pre-populate phone number if existing in user profile
  useEffect(() => {
    if (user?.phoneNumber || user?.phone) {
      const raw = user.phoneNumber || user.phone || "";
      const digitsOnly = raw.replace(/\D/g, "");
      
      const matchedCountry = COUNTRIES.find((c) =>
        digitsOnly.startsWith(c.dialCode.replace("+", ""))
      );

      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        const nationalDigits = digitsOnly.slice(matchedCountry.dialCode.replace("+", "").length);
        setRawPhoneDigits(nationalDigits);
        const formatted = new AsYouType(matchedCountry.code).input(nationalDigits);
        setFormattedPhoneDisplay(formatted);
      } else if (digitsOnly.length === 10) {
        setRawPhoneDigits(digitsOnly);
        const formatted = new AsYouType(selectedCountry.code).input(digitsOnly);
        setFormattedPhoneDisplay(formatted);
      }
    }
  }, [user]);

  // Handle click outside country selector dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered countries for country selector search
  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return COUNTRIES;
    const q = countrySearchQuery.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countrySearchQuery]);

  // Live Phone Validation check using libphonenumber-js
  const isValidPhone = useMemo(() => {
    if (!rawPhoneDigits || rawPhoneDigits.length < 5) return false;
    const fullE164 = `${selectedCountry.dialCode}${rawPhoneDigits}`;
    try {
      return isValidPhoneNumber(fullE164, selectedCountry.code);
    } catch {
      return rawPhoneDigits.length >= 7 && rawPhoneDigits.length <= 12;
    }
  }, [rawPhoneDigits, selectedCountry]);

  // Live auto-formatting while typing
  const handlePhoneInputChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    const cappedRaw = rawVal.slice(0, 14);
    setRawPhoneDigits(cappedRaw);

    if (!cappedRaw) {
      setFormattedPhoneDisplay("");
      return;
    }

    const formatted = new AsYouType(selectedCountry.code).input(cappedRaw);
    setFormattedPhoneDisplay(formatted);
  };

  // Handle Country Selection change
  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setCountryDropdownOpen(false);
    setCountrySearchQuery("");
    if (rawPhoneDigits) {
      const formatted = new AsYouType(country.code).input(rawPhoneDigits);
      setFormattedPhoneDisplay(formatted);
    }
  };

  // One-click Auto-fill & Copy Test Phone Number
  const handleCopyTestPhone = () => {
    const testNum = "+91 12345 12345";
    navigator.clipboard.writeText(testNum);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);

    const inCountry = COUNTRIES.find((c) => c.code === "IN");
    if (inCountry) setSelectedCountry(inCountry);
    setRawPhoneDigits("1234512345");
    setFormattedPhoneDisplay("12345 12345");
    toast.success("Test phone number copied & auto-filled!");
  };

  // Copy Test OTP
  const handleCopyTestOtp = () => {
    navigator.clipboard.writeText("123456");
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
    
    if (otpSent) {
      setOtpDigits(["1", "2", "3", "4", "5", "6"]);
    }
    toast.success("Test OTP (123456) copied!");
  };

  // Resend Countdown Timer logic (30 seconds cooldown)
  useEffect(() => {
    let interval = null;
    if (otpSent && resendTimer > 0 && !isSuccess) {
      setCanResend(false);
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, resendTimer, isSuccess]);

  // WebOTP API — Automatic SMS Code Detection
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
              setOtpDigits(codeStr.split(""));
              toast.success("SMS verification code detected automatically.");
              handleVerifyCode(codeStr);
            }
          }
        })
        .catch((err) => {
          console.warn("[WebOTP] Auto-read not triggered:", err?.message || err);
        });
    }
    return () => ac.abort();
  }, [otpSent, isSuccess]);

  // Send Verification Code via Firebase SMS
  const handleSendOtp = async () => {
    if (!isValidPhone) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 600);
      toast.error(`Please enter a valid phone number for ${selectedCountry.name}.`);
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

      const formattedPhoneE164 = `${selectedCountry.dialCode}${rawPhoneDigits}`;
      console.log("[Firebase Phone Auth] Requesting OTP for:", formattedPhoneE164);

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneE164,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;

      setOtpSent(true);
      setResendTimer(30);
      setCanResend(false);
      
      if (rawPhoneDigits === "1234512345") {
        setOtpDigits(["1", "2", "3", "4", "5", "6"]);
      } else {
        setOtpDigits(["", "", "", "", "", ""]);
      }
      
      toast.success("Verification code sent successfully.");

      // Auto-focus first digit box after transition
      setTimeout(() => {
        otpInputRefs[0]?.current?.focus();
      }, 350);
    } catch (err) {
      console.error("[PhoneAuth] Error sending OTP:", err);
      toast.error(err.message || "Failed to send verification SMS. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  // OTP Input handlers
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
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
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

  // Confirm Verification Code with 1.5s celebratory success animation before redirect
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

      const formattedPhoneE164 = `${selectedCountry.dialCode}${rawPhoneDigits}`;

      const res = await fetch(getApiUrl("user/verify-phone"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: formattedPhoneE164,
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
        phoneNumber: data.user?.phoneNumber || formattedPhoneE164,
      });

      setIsSuccess(true);
      toast.success("Phone number verified successfully!");

      // 1.5s delay for celebratory check animation before redirecting
      setTimeout(() => {
        handleContinue();
      }, 1500);
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
    if (user?.name) return user.name.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "TL";
  }, [user]);

  return (
    <div className="h-screen max-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans relative overflow-hidden select-none lg:overflow-hidden max-lg:h-auto max-lg:max-h-none max-lg:overflow-y-auto selection:bg-cyan-500 selection:text-white">
      {/* ── AMBIENT GLASS & SOFT BLUE GRADIENT BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-gradient-to-br from-cyan-500/12 via-blue-600/8 to-transparent rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-to-tl from-indigo-600/10 via-blue-500/8 to-transparent rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-950/20 rounded-full blur-[180px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Recaptcha container */}
      <div id="recaptcha-container" className="hidden"></div>

      {/* ── NAVIGATION HEADER (Compact h-14 / 56px) ── */}
      {!isModal && (
        <header className="w-full max-w-[1300px] mx-auto px-6 sm:px-8 h-14 flex items-center justify-between z-20 relative border-b border-white/[0.06] shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group text-decoration-none">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
              TL
            </div>
            <span className="text-lg font-black tracking-tight text-white uppercase">
              Travel<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Loop</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-400">
              <Link to="/activities" className="hover:text-white transition-colors">Explore</Link>
              <Link to="/saved-destinations" className="hover:text-white transition-colors">Destinations</Link>
              <a href="mailto:support@traveloop.com" className="hover:text-white transition-colors flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Support
              </a>
            </nav>

            <div className="flex items-center gap-3 border-l border-white/10 pl-5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-[1.5px] shadow-sm shadow-cyan-500/10">
                <div className="w-full h-full rounded-full bg-[#070B14] flex items-center justify-center font-bold text-[11px] text-white">
                  {userInitials}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ── MAIN CONTENT CONTAINER (Zero-Scroll 100vh Layout) ── */}
      <main className="w-full max-w-[1300px] mx-auto px-6 sm:px-8 py-3 lg:py-4 flex-1 flex flex-col justify-center z-10 lg:overflow-hidden">
        
        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center h-full">

          {/* ════════════════════════════════════════════════════════════ */}
          {/* ── LEFT SECTION (60% Width -> lg:col-span-7) ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="lg:col-span-7 space-y-4 flex flex-col justify-center"
          >
            {/* Top Pill Tag */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Enterprise Identity Verification</span>
              </div>
            </div>

            {/* Heading & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black text-white tracking-tight leading-tight">
                Verify Your Phone Number
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal max-w-xl">
                Your phone number is used only for account security, login verification, booking confirmations, emergency alerts and important travel updates.
              </p>
            </div>

            {/* 4 COMPACT SECURITY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-xl hover:border-cyan-500/30 transition-all duration-300 group shadow-md shadow-black/10">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white leading-tight">Secure Authentication</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug pl-10">
                  Protect your account with enterprise-grade verification.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300 group shadow-md shadow-black/10">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                    <Plane className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white leading-tight">Booking Protection</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug pl-10">
                  Prevent unauthorized booking changes.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-xl hover:border-cyan-500/30 transition-all duration-300 group shadow-md shadow-black/10">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white leading-tight">Instant Travel Alerts</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug pl-10">
                  Receive flight & itinerary notifications.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300 group shadow-md shadow-black/10">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white leading-tight">Privacy Guaranteed</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug pl-10">
                  Your phone number is encrypted & never shared.
                </p>
              </div>
            </div>

            {/* COMPACT TRUST & SECURITY SECTION */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-900/60 border border-white/[0.08] backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-extrabold text-white tracking-wide uppercase">
                    Trust & Security Standards
                  </h4>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">AES-256 Encrypted</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1.5 gap-x-3 text-[11px] font-semibold text-slate-300">
                <div className="flex items-center gap-1.5 truncate">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Bank-grade Security</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Google Firebase Auth</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>5 Min OTP Expiry</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>No Spam Calls</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>No Marketing SMS</span>
                </div>
                <div className="flex items-center gap-1.5 truncate text-emerald-400">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Verification Only</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* ── RIGHT COLUMN: SANDBOX & VERIFICATION (40% -> lg:col-span-5) ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
            className="lg:col-span-5 space-y-3.5 flex flex-col justify-center items-center lg:items-end"
          >
            {/* ────────────────────────────────────────────────────────── */}
            {/* 1. DEVELOPER SANDBOX CARD                                  */}
            {/* ────────────────────────────────────────────────────────── */}
            <div
              className="w-full max-w-[460px] rounded-[18px] border border-blue-500/20 p-4 sm:p-4.5 shadow-xl relative overflow-hidden backdrop-blur-2xl transition-all duration-300"
              style={{
                background: "rgba(13, 17, 23, 0.92)",
                boxShadow: "0 0 30px rgba(59, 130, 246, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-sm shrink-0">
                    🧪
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-white tracking-tight leading-none mb-0.5">
                      Development Sandbox
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium leading-none">
                      Firebase Test Authentication
                    </p>
                  </div>
                </div>

                <div className="text-[9px] font-black tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded uppercase shrink-0">
                  DEVELOPMENT ONLY
                </div>
              </div>

              {/* Info Banner */}
              <div className="mb-2.5 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2 text-[10.5px] text-blue-200 leading-tight font-medium">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  Prototype credentials provided below for instant testing. No real SMS sent.
                </div>
              </div>

              {/* CODE BLOCKS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                {/* Test Mobile Number Block */}
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-white/10 space-y-1 hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase font-mono">
                      TEST PHONE
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTestPhone}
                      className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      {copiedPhone ? (
                        <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedPhone ? "Copied" : "Use"}</span>
                    </button>
                  </div>

                  <div className="text-sm font-black text-white font-mono tracking-wider pt-0.5 truncate">
                    +91 12345 12345
                  </div>
                </div>

                {/* Test OTP Block */}
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-white/10 space-y-1 hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase font-mono">
                      TEST OTP
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTestOtp}
                      className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      {copiedOtp ? (
                        <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedOtp ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="text-base font-black text-emerald-400 font-mono tracking-[0.2em] pt-0.5">
                    123456
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="p-2 rounded-lg bg-slate-900/60 border border-white/[0.08] flex items-center justify-between text-[10.5px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Firebase Test Active</span>
                </div>
                <div className="flex items-center gap-1 font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[9.5px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ready</span>
                </div>
              </div>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* 2. PHONE VERIFICATION FORM & OTP CARD                      */}
            {/* ────────────────────────────────────────────────────────── */}
            <div
              className="w-full max-w-[460px] rounded-[18px] border border-white/[0.1] p-4.5 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-2xl transition-all duration-300"
              style={{
                background: "rgba(15, 23, 42, 0.75)",
                boxShadow: "0 20px 50px -15px rgba(0, 0, 0, 0.75), 0 0 25px rgba(59, 130, 246, 0.08)",
              }}
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              <AnimatePresence mode="wait">
                {isSuccess ? (
                  /* ── CELEBRATORY SUCCESS STATE WITH ANIMATION ── */
                  <motion.div
                    key="success-view"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex flex-col items-center text-center py-6 space-y-4"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 240, damping: 16 }}
                      className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20"
                    >
                      <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
                    </motion.div>

                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-white tracking-tight">
                        Phone Number Verified
                      </h2>
                      <p className="text-emerald-400 font-mono text-xs font-bold flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Redirecting to Dashboard...</span>
                      </p>
                    </div>
                  </motion.div>
                ) : otpSent ? (
                  /* ── MODERN ENTERPRISE OTP VERIFICATION STATE ── */
                  <motion.div
                    key="otp-view"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="space-y-3.5"
                  >
                    {/* Header & Phone Highlight */}
                    <div className="space-y-1">
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        Verify Security Code
                      </h3>
                      <p className="text-xs text-slate-300 leading-snug">
                        Enter the 6-digit verification code sent to{" "}
                        <span className="text-cyan-400 font-mono font-bold">
                          {selectedCountry.dialCode} {formattedPhoneDisplay || rawPhoneDigits}
                        </span>
                      </p>
                    </div>

                    {/* Compact Inline Status */}
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold pt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Verification code sent successfully</span>
                    </div>

                    {/* SIX EQUALLY SIZED OTP INPUT BOXES WITH FOCUS GLOW */}
                    <div className="space-y-2">
                      <div className="flex justify-center items-center gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, idx) => (
                          <div key={idx} className="relative">
                            <input
                              ref={otpInputRefs[idx]}
                              type="text"
                              disabled={otpVerifying}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className={`w-10 h-12 sm:w-[48px] sm:h-[52px] rounded-xl border bg-slate-900/90 text-center text-2xl font-black text-white outline-none font-mono transition-all duration-200 ${
                                digit
                                  ? "border-cyan-400/80 bg-cyan-500/10 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                                  : "border-white/10 hover:border-white/20 focus:border-cyan-400 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                              }`}
                            />
                          </div>
                        ))}
                      </div>

                      {/* TIMER & PROTOTYPE CODE BADGE */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        {canResend ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400">Didn't receive the code?</span>
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 cursor-pointer transition-colors"
                            >
                              Resend Code
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400 flex items-center gap-1.5 text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                            Resend available in <strong className="text-white font-bold">{formattedTimer}</strong>
                          </span>
                        )}

                        {/* Development Build Prototype Helper Badge */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <span>Dev OTP:</span>
                          <button
                            type="button"
                            onClick={handleCopyTestOtp}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold hover:bg-emerald-500/25 transition-colors cursor-pointer text-[10.5px]"
                          >
                            123456
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS (PRIMARY VERIFY + SECONDARY CHANGE PHONE) */}
                    <div className="space-y-2 pt-1">
                      <motion.button
                        whileHover={otpDigits.join("").length === 6 && !otpVerifying ? { y: -1 } : {}}
                        whileTap={otpDigits.join("").length === 6 && !otpVerifying ? { scale: 0.98 } : {}}
                        onClick={() => handleVerifyCode()}
                        disabled={otpVerifying || otpDigits.join("").length < 6}
                        className={`w-full h-11 rounded-xl font-extrabold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                          otpDigits.join("").length === 6 && !otpVerifying
                            ? "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white shadow-md shadow-blue-500/25 hover:shadow-cyan-500/35 cursor-pointer"
                            : "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-75"
                        }`}
                      >
                        {otpVerifying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify Code</span>
                            <ArrowRight className="w-4 h-4 text-white" />
                          </>
                        )}
                      </motion.button>

                      {/* Change Phone Number Text Action */}
                      <button
                        type="button"
                        disabled={otpVerifying}
                        onClick={() => setOtpSent(false)}
                        className="w-full text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1 flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                        <span>Change Phone Number</span>
                      </button>
                    </div>

                    {/* CARD FOOTER NOTICE */}
                    <div className="pt-1.5 border-t border-white/[0.06] text-center text-[10.5px] text-slate-500">
                      <span>AES-256 Encrypted & Firebase Authenticated</span>
                    </div>
                  </motion.div>
                ) : (
                  /* ── INITIAL PHONE INPUT FORM STATE ── */
                  <motion.div
                    key="phone-view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="space-y-3.5"
                  >
                    {/* Card Title & Subtitle */}
                    <div className="space-y-0.5">
                      <h3 className="text-xl font-black text-white tracking-tight">
                        Phone Verification
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Enter your mobile number to receive a secure SMS verification code.
                      </p>
                    </div>

                    {/* PHONE INPUT CONTAINER */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-extrabold text-slate-300 uppercase tracking-wider block">
                          Mobile Number
                        </label>

                        {/* Input Wrapper */}
                        <motion.div
                          animate={shakeTrigger ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                          transition={{ duration: 0.35 }}
                          className={`relative h-[48px] rounded-xl border transition-all duration-200 flex items-center bg-slate-900/80 overflow-hidden ${
                            isValidPhone
                              ? "border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                              : inputFocused
                              ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                              : rawPhoneDigits.length > 5 && !isValidPhone
                              ? "border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          {/* SEPARATE COUNTRY CODE SELECTOR BUTTON */}
                          <div className="relative border-r border-white/10 h-full shrink-0" ref={dropdownRef}>
                            <button
                              type="button"
                              onClick={() => setCountryDropdownOpen((v) => !v)}
                              className="h-full px-3 flex items-center gap-1.5 font-mono text-xs font-bold hover:bg-white/5 cursor-pointer text-white transition-colors"
                            >
                              <span className="text-base leading-none">{selectedCountry.flag}</span>
                              <span className="text-slate-200 font-extrabold">{selectedCountry.dialCode}</span>
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </button>

                            {/* COUNTRY SEARCH DROPDOWN */}
                            {countryDropdownOpen && (
                              <div className="absolute top-full left-0 mt-1 w-60 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-2 z-50 max-h-56 overflow-y-auto backdrop-blur-2xl">
                                <div className="relative mb-1.5 px-0.5">
                                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                  <input
                                    type="text"
                                    value={countrySearchQuery}
                                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                                    placeholder="Search country..."
                                    className="w-full bg-slate-800/90 border border-white/10 rounded-md pl-7 pr-2 py-1 text-[11px] text-white placeholder-slate-500 outline-none focus:border-blue-500"
                                  />
                                </div>

                                <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
                                  {filteredCountries.map((c) => (
                                    <button
                                      key={c.code}
                                      type="button"
                                      onClick={() => handleSelectCountry(c)}
                                      className={`w-full px-2.5 py-1.5 flex items-center gap-2 text-left rounded-md hover:bg-white/10 transition-colors text-[11px] font-semibold ${
                                        selectedCountry.code === c.code ? "bg-blue-600/20 text-blue-400 font-bold" : "text-slate-200"
                                      }`}
                                    >
                                      <span className="text-sm leading-none">{c.flag}</span>
                                      <span className="flex-1 truncate">{c.name}</span>
                                      <span className="font-mono text-slate-400 text-[10px]">{c.dialCode}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* PHONE INPUT FIELD */}
                          <div className="flex-1 flex items-center px-2.5 gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                              type="tel"
                              value={formattedPhoneDisplay}
                              onChange={handlePhoneInputChange}
                              onFocus={() => setInputFocused(true)}
                              onBlur={() => setInputFocused(false)}
                              placeholder={selectedCountry.example}
                              className="w-full bg-transparent text-base font-bold text-white placeholder-slate-600 outline-none tracking-wide font-mono"
                            />
                          </div>

                          {/* AUTO VALIDATION INDICATOR */}
                          <div className="pr-2.5 flex items-center">
                            {isValidPhone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : rawPhoneDigits.length > 5 ? (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            ) : null}
                          </div>
                        </motion.div>

                        {/* EXAMPLE HELPER TEXT */}
                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5 px-0.5 font-mono">
                          <span>Example: {selectedCountry.example}</span>
                          <span className="text-[10px] text-slate-400">
                            {selectedCountry.code} ({selectedCountry.dialCode})
                          </span>
                        </div>
                      </div>

                      {/* NOTICE */}
                      <p className="text-[10.5px] text-emerald-400/90 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>We'll send a 6-digit SMS verification code.</span>
                      </p>

                      {/* PRIMARY ACTION BUTTON */}
                      <motion.button
                        whileHover={isValidPhone && !otpSending ? { y: -1 } : {}}
                        whileTap={isValidPhone && !otpSending ? { scale: 0.98 } : {}}
                        onClick={handleSendOtp}
                        disabled={!isValidPhone || otpSending}
                        className={`w-full h-11 rounded-xl font-extrabold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden ${
                          isValidPhone && !otpSending
                            ? "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white shadow-md shadow-blue-500/25 hover:shadow-cyan-500/35 cursor-pointer"
                            : "bg-slate-800/80 text-slate-500 border border-white/5 cursor-not-allowed opacity-70"
                        }`}
                      >
                        {otpSending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* CARD FOOTER NOTICE */}
                    <div className="pt-2 border-t border-white/[0.06] text-center text-[10.5px] text-slate-500">
                      <span>AES-256 Encrypted & Firebase Authenticated</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
};

export default VerifyPhone;
