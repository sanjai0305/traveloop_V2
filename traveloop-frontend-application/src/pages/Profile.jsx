import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Avatar from "../components/common/Avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../i18n/metadata";
import { loadLanguageBundle } from "../i18n/i18n";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import {
  User, Mail, Phone, MapPin, Globe, CalendarDays, ShieldCheck,
  ChevronRight, Bell, Lock, Eye, Palette, HelpCircle, LogOut,
  Camera, Map, Plane, Clock, Moon, Sun, Award, Flame, Star,
  Languages, ChevronDown, Heart, AlertTriangle, Trash2, FileText, Info,
  Gift, Share2, Copy, RefreshCw
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import BottomSheet from "../components/mobile/BottomSheet";
import { useToast } from "../components/mobile/MobileToast";
import { verifyReferralCode } from "../services/authService";
import ScratchCardModal from "../components/dashboard/ScratchCardModal";
import CouponDetailsModal from "../components/dashboard/CouponDetailsModal";
import { auth } from "../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";



// STATS is now calculated dynamically inside the Profile component

const ACHIEVEMENTS = [
  { emoji: "🏆", label: "First Trip Created", desc: "Created your first trip" },
  { emoji: "🏆", label: "Explorer", desc: "Created 5 trips" },
  { emoji: "🏆", label: "Planner Pro", desc: "Created 10 trips" },
  { emoji: "🏆", label: "Collaboration Pro", desc: "Collaborate on a trip" },
  { emoji: "🏆", label: "Budget Master", desc: "Logged your first expense" },
  { emoji: "🏆", label: "Journal Keeper", desc: "Created a journal entry" },
  { emoji: "🏆", label: "Flight Tracker", desc: "Tracked your first flight" },
  { emoji: "🏆", label: "Chat Starter", desc: "Sent your first chat message" },
];

const SETTINGS_GROUPS = [
  {
    title: "profile.accountTitle",
    items: [
      { key: "personalInfo", icon: User,       label: "profile.personalInfo",      sub: "profile.personalInfoSub",     color: "#14B8B5", bg: "rgba(20,184,181,0.1)"  },
      { key: "savedPlaces",  icon: Heart,      label: "profile.savedPlaces",       sub: "profile.savedPlacesSub",     color: "#EF4444", bg: "rgba(239,68,68,0.1)", path: "/saved-destinations" },
      { key: "security",     icon: ShieldCheck,label: "profile.security",          sub: "profile.securitySub",        color: "#8B5CF6", bg: "rgba(139,92,246,0.1)"  },
      { key: "notifications",icon: Bell,       label: "profile.notifications",     sub: "profile.notificationsSub",   color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
    ],
  },
  {
    title: "profile.preferencesTitle",
    items: [
      { key: "privacy",      icon: Eye,        label: "profile.privacy",           sub: "profile.privacySub",         color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
      { key: "language",     icon: Languages,  label: "profile.language",          sub: "profile.languageSub",        color: "#3B82F6", bg: "rgba(59,130,246,0.1)"  },
    ],
  },
  {
    title: "profile.supportTitle",
    items: [
      { key: "helpSupport",  icon: HelpCircle, label: "profile.helpSupport",       sub: "profile.helpSupportSub",     color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
      { key: "termsConditions", icon: FileText,   label: "profile.termsConditions", sub: "profile.termsConditionsSub", color: "#14B8B5", bg: "rgba(20,184,181,0.1)", path: "/terms-and-conditions" },
      { key: "about",        icon: Info,       label: "profile.about",             sub: "profile.aboutSub",           color: "#3B82F6", bg: "rgba(59,130,246,0.1)", path: "/about" },
    ],
  },
];

const maskSentPhone = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  const base = cleaned.slice(-10);
  return `+91 ${base.slice(0, 5)} ${base.slice(5).replace(/./g, "X")}`;
};

const OtpVerifier = ({ phone, isAlternate, onVerify, onResend, onCancel }) => {
  const [otp, setOtp] = React.useState(new Array(6).fill(""));
  const [timer, setTimer] = React.useState(120);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const inputRefs = React.useRef([]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, "0");
    const seconds = (secs % 60).toString().padStart(2, "0");
    return `${mins}:${seconds}`;
  };

  const handleChange = (val, index) => {
    if (isNaN(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);
    setError("");

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        newOtp[index] = "";
        setOtp(newOtp);
      }
      setError("");
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      setError("");
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onVerify(code);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError("");
    setOtp(new Array(6).fill(""));
    try {
      await onResend();
      setTimer(120);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    }
  };

  const maskedPhone = maskSentPhone(phone);

  return (
    <div className="w-full bg-slate-900 border border-teal-500/25 rounded-2xl p-5 shadow-2xl relative overflow-hidden text-white font-sans">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {success ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center py-6 text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30"
          >
            <ShieldCheck size={36} className="text-slate-950" />
          </motion.div>
          <h3 className="text-lg font-black text-teal-400">Verification Successful!</h3>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Your phone number is now linked and verified.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <ShieldCheck size={16} className="text-teal-400" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-450">TravelLoop Secure</h4>
                <p className="text-[10px] text-slate-400 font-bold">SMS Sent</p>
              </div>
            </div>
            <span className="text-[10px] bg-teal-500/15 text-teal-405 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              OTP Sent Successfully
            </span>
          </div>

          <div className="text-center py-2">
            <p className="text-[11px] text-slate-400 font-semibold">Code sent to</p>
            <p className="text-sm font-black text-teal-350 mt-0.5 tracking-wide">{maskedPhone}</p>
          </div>

          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-10 h-12 bg-slate-800 border border-slate-700 focus:border-teal-400 rounded-xl text-center text-lg font-black text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            ))}
          </div>

          {error && (
            <p className="text-[10px] text-red-400 font-bold text-center">{error}</p>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1.5 text-slate-450">
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-teal-455 font-bold">
                {formatTimer(timer)}
              </span>
              <span className="text-[10px] font-semibold">remaining</span>
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0}
              className={`text-xs font-bold transition-all ${
                timer > 0 
                  ? "text-slate-600 cursor-not-allowed" 
                  : "text-teal-400 hover:text-teal-300 hover:underline"
              }`}
            >
              Resend OTP
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-750 hover:border-slate-600 text-slate-300 font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || otp.join("").length < 6}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-teal-500/10 flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Confirm</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Profile = () => {
  const navigate  = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const [logoutSheet, setLogoutSheet] = useState(false);
  const toast = useToast();

  // Sheets state
  const [personalSheet, setPersonalSheet] = useState(false);
  const [securitySheet, setSecuritySheet] = useState(false);
  const [notificationSheet, setNotificationSheet] = useState(false);
  const [privacySheet, setPrivacySheet] = useState(false);
  const [languageSheet, setLanguageSheet] = useState(false);
  const [helpSheet, setHelpSheet] = useState(false);
  const [deleteConfirmSheet, setDeleteConfirmSheet] = useState(false);

  // Forms state
  const [profileUser, setProfileUser] = useState(null);
  const [personalForm, setPersonalForm] = useState({ firstName: "", lastName: "", phone: "", city: "", country: "", upiId: "" });
  const [securityForm, setSecurityForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notifForm, setNotifForm] = useState({ reminders: true, budget: true, weather: true, statusUpdates: true });
  const [achievements, setAchievements] = useState([]);

  const [showPrimaryOtp, setShowPrimaryOtp] = useState(false);
  const [showAlternateOtp, setShowAlternateOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [alternateEnabled, setAlternateEnabled] = useState(false);

  console.log('alternateEnabled:', alternateEnabled);
  console.log('setter:', setAlternateEnabled);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(getApiUrl("auth/me"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setAchievements(data.achievements || []);
        }
      } catch (err) {
        console.error("Failed to fetch achievements:", err);
      }
    };
    fetchProfile();
  }, []);
  const [deleteText, setDeleteText] = useState("");
  const [supportForm, setSupportForm] = useState({ email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(getApiUrl("trips"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setTrips(data.trips || []);
        }
      } catch (err) {
        console.error("Failed to fetch trips for profile stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchTrips();
  }, []);

  const [referralStats, setReferralStats] = useState({
    referralCode: "",
    totalInvites: 0,
    successfulBookings: 0,
    coinsEarned: 0,
    discountEarned: 0,
    walletBalance: 0,
    scratchCards: [],
    scratchCardsEarned: 0,
    rewardsClaimed: 0,
    couponsAvailable: 0,
    referralVerified: false,
    referredBy: "",
  });

  // Referral code entry state
  const [enteredCode, setEnteredCode]     = useState("");
  const [verifyState, setVerifyState]     = useState("idle"); // idle | loading | success | error
  const [verifyError, setVerifyError]     = useState("");
  const [verifyResult, setVerifyResult]   = useState(null);

  // Scratch card modal state
  const [selectedCard, setSelectedCard]       = useState(null);
  const [showScratchModal, setShowScratchModal] = useState(false);
  const [selectedProfileCoupon, setSelectedProfileCoupon] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);



  const fetchReferralStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(getApiUrl("profile/referral-dashboard"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReferralStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch referral stats:", err);
    }
  };

  useEffect(() => {
    fetchReferralStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyReferral = async () => {
    if (!enteredCode.trim()) return;
    setVerifyState("loading");
    setVerifyError("");
    setVerifyResult(null);
    try {
      const token = localStorage.getItem("token");
      const data = await verifyReferralCode(enteredCode.trim(), token);
      setVerifyResult(data);
      setVerifyState("success");
      // Refresh stats to show new scratch cards
      await fetchReferralStats();
      toast.success(`✅ Referral verified! Invited by ${data.referralOwner}`);

      // Check if we received cardId in response or fetch it from refreshed stats
      const tokenRefetched = localStorage.getItem("token");
      const refetchedRes = await fetch(getApiUrl("profile/referral-dashboard"), {
        headers: { Authorization: `Bearer ${tokenRefetched}` }
      });
      const refetchedData = await refetchedRes.json();
      
      let cardToScratch = null;
      if (refetchedData.success && refetchedData.scratchCards) {
        // Find the unscratched card
        cardToScratch = refetchedData.scratchCards.find(c => !c.scratched && !c.claimed);
      }
      
      if (cardToScratch) {
        setSelectedCard(cardToScratch);
        setShowScratchModal(true);
      }
    } catch (err) {
      setVerifyError(err.message || "Verification failed. Please try again.");
      setVerifyState("error");
    }
  };



  const stats = useMemo(() => {
    const tripsCount = trips.length;
    const countriesCount = new Set(trips.map(t => {
      if (!t.destination) return "";
      const parts = t.destination.split(",");
      return parts[parts.length - 1].trim();
    }).filter(Boolean)).size;
    const totalDays = trips.reduce((sum, trip) => {
      if (!trip.startDate || !trip.endDate) return sum + 1;
      const diff = new Date(trip.endDate) - new Date(trip.startDate);
      return sum + Math.max(1, Math.ceil(diff / 86400000));
    }, 0);

    return [
      { icon: Map,   label: "profile.trips",     value: loadingStats ? "..." : String(tripsCount), color: "#14B8B5", bg: "rgba(20,184,181,0.1)"  },
      { icon: Globe, label: "profile.countries", value: loadingStats ? "..." : String(countriesCount),  color: "#8B5CF6", bg: "rgba(139,92,246,0.1)"  },
      { icon: Clock, label: "profile.days",      value: loadingStats ? "..." : String(totalDays), color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
    ];
  }, [trips, loadingStats]);

  const { user: authUser, logout, login } = useAuth();

  useEffect(() => {
    if (authUser) {
      setProfileUser(authUser);
      setAlternateEnabled(!!authUser.alternateMobile);
      setPersonalForm({
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        phone: authUser.phoneNumber || authUser.primaryMobile || authUser.phone || "",
        primaryMobile: authUser.phoneNumber || authUser.primaryMobile || authUser.phone || "",
        alternateMobile: authUser.alternateNumber || authUser.alternateMobile || "",
        emergencyContact: authUser.emergencyContact || "",
        age: authUser.age || "",
        gender: authUser.gender || "",
        city: authUser.city || "",
        country: authUser.country || "",
        upiId: authUser.upiId || "",
      });
      if (authUser.notificationPreferences) {
        setNotifForm({
          reminders: authUser.notificationPreferences.reminders !== false,
          budget: authUser.notificationPreferences.budget !== false,
          weather: authUser.notificationPreferences.weather !== false,
          statusUpdates: authUser.notificationPreferences.statusUpdates !== false,
        });
      }
    }
  }, [authUser]);

  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) {
        setProfileUser(e.detail);
        setAlternateEnabled(!!(e.detail.alternateNumber || e.detail.alternateMobile));
        setPersonalForm({
          firstName: e.detail.firstName || "",
          lastName: e.detail.lastName || "",
          phone: e.detail.phoneNumber || e.detail.primaryMobile || e.detail.phone || "",
          primaryMobile: e.detail.phoneNumber || e.detail.primaryMobile || e.detail.phone || "",
          alternateMobile: e.detail.alternateNumber || e.detail.alternateMobile || "",
          emergencyContact: e.detail.emergencyContact || "",
          age: e.detail.age || "",
          gender: e.detail.gender || "",
          city: e.detail.city || "",
          country: e.detail.country || "",
          upiId: e.detail.upiId || "",
        });
        if (e.detail.notificationPreferences) {
          setNotifForm({
            reminders: e.detail.notificationPreferences.reminders !== false,
            budget: e.detail.notificationPreferences.budget !== false,
            weather: e.detail.notificationPreferences.weather !== false,
            statusUpdates: e.detail.notificationPreferences.statusUpdates !== false,
          });
        }
      }
    };
    window.addEventListener("userUpdated", handleUserUpdate);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  if (!profileUser) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl">😕</span>
          <p className="text-xl font-bold text-slate-700">{t("profile.notLoggedIn")}</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 rounded-full text-white font-bold" style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}>
            {t("profile.goToLogin")}
          </button>
        </div>
      </MainLayout>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const updateProfileDetails = async (bodyPayload, successMsg) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("profile/update"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (data.success) {
        const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const mergedUser = { ...cachedUser, ...data.user };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        setProfileUser(mergedUser);
        login(mergedUser, token); // Keep AuthContext sync'd
        alert(successMsg || "Settings updated successfully! ✨");
        return true;
      } else {
        alert(data.message || "Failed to update profile");
        return false;
      }
    } catch (err) {
      alert("Error connecting to server");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const compressImage = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 512;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(t("profileValidation.imageSizeLimit"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalBase64 = event.target.result;
      try {
        const compressedBase64 = await compressImage(originalBase64);
        
        // Optimistic update
        const updatedUser = { ...profileUser, avatar: compressedBase64 };
        setProfileUser(updatedUser);
        
        const ok = await updateProfileDetails({ avatar: compressedBase64 }, t("toast.avatarUpdated"));
        if (!ok) {
          setProfileUser(profileUser);
        }
      } catch (err) {
        console.error("Failed to compress or upload image", err);
        alert(t("profileValidation.imageProcessError"));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...personalForm,
      age: personalForm.age ? Number(personalForm.age) : null,
      usersettingsCompleted: true
    };
    const ok = await updateProfileDetails(payload, t("toast.profileUpdated"));
    if (ok) setPersonalSheet(false);
  };

  // OTP and alternate number states moved to the top of component

  const handleSendOtp = async (phone, isAlternate) => {
    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit mobile number starting with 6-9");
      return;
    }
    setOtpSending(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: (response) => {
            console.log("reCAPTCHA solved");
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired");
          }
        });
      }

      const formattedPhone = `+91${phone}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;

      toast.success("Verification SMS sent successfully!");
      if (isAlternate) {
        setShowAlternateOtp(true);
      } else {
        setShowPrimaryOtp(true);
      }
    } catch (err) {
      console.error("Firebase SMS send failure:", err);
      toast.error(err.message || "Failed to send verification SMS via Firebase.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (code, phone, isAlternate) => {
    if (!code || code.length < 6) {
      throw new Error("Please enter a 6-digit OTP code");
    }
    if (!window.confirmationResult) {
      throw new Error("No active phone verification session found.");
    }

    const result = await window.confirmationResult.confirm(code);
    const idToken = await result.user.getIdToken();

    // Submit token to backend PATCH /user/verify-phone
    const token = localStorage.getItem("token");
    const res = await fetch(getApiUrl("user/verify-phone"), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ phone, idToken, isAlternate })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Verification sync failed on server.");
    }

    const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const mergedUser = { ...cachedUser, ...data.user };
    localStorage.setItem("user", JSON.stringify(mergedUser));
    setProfileUser(mergedUser);
    login(mergedUser, token);

    setPersonalForm(f => ({
      ...f,
      phone: mergedUser.phone || "",
      primaryMobile: mergedUser.primaryMobile || "",
      alternateMobile: mergedUser.alternateMobile || "",
    }));

    if (isAlternate) {
      setShowAlternateOtp(false);
    } else {
      setShowPrimaryOtp(false);
    }
  };

  const handleNotifToggle = async (field) => {
    const updated = { ...notifForm, [field]: !notifForm[field] };
    setNotifForm(updated);
    await updateProfileDetails({ notificationPreferences: updated }, t("toast.notifUpdated"));
  };

  const handleLanguageSelect = async (langCode, langName) => {
    await loadLanguageBundle(langCode);
    i18n.changeLanguage(langCode);
    localStorage.setItem("i18nextLng", langCode);
    const ok = await updateProfileDetails({ language: langCode }, t("toast.languageUpdated", { lang: langName }));
    if (ok) setLanguageSheet(false);
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert(t("profileValidation.passwordMatch"));
      return;
    }
    alert(t("profileValidation.simulated"));
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setSecuritySheet(false);
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const userEmail = (supportForm.email || profileUser.email || "").trim();
    const message = (supportForm.message || "").trim();

    if (!userEmail) {
      toast.error(t("auth.validation.emailRequired"));
      return;
    }
    if (!emailRegex.test(userEmail)) {
      toast.error(t("auth.validation.emailInvalid"));
      return;
    }
    if (!message) {
      toast.error(t("faq.validation.messageRequired"));
      return;
    }
    if (message.length <= 5) {
      toast.error(t("faq.validation.messageMinLength"));
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userName = `${profileUser.firstName || ""} ${profileUser.lastName || ""}`.trim() || profileUser.email;
      
      const res = await fetch(getApiUrl("support"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          message: message
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Support request sent successfully.");
        setSupportForm(f => ({ ...f, message: "" })); // keep email field, clear message field
        setHelpSheet(false);
      } else {
        toast.error(data.message || "Failed to send support request.");
      }
    } catch (err) {
      console.error("Support Route Error:", err);
      toast.error("Failed to send support request.");
    }
  };

  const handleDownloadData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profileUser, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `traveloop_profile_${profileUser.firstName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") {
      alert("Please type DELETE to confirm");
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("profile/delete-account"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert("Account permanently deleted. Hope to travel with you again! ✈️");
        logout();
        navigate("/");
      } else {
        alert(data.message || "Failed to delete account");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setSubmitting(false);
    }
  };

  const initial = profileUser.firstName?.[0]?.toUpperCase() || "T";

  return (
    <MainLayout>
      {/* ── HERO HEADER (Desktop: Larger height) ── */}
      <div className="relative overflow-hidden h-44 lg:h-56">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0F172A 0%, #14B8B5 100%)" }} />
        <motion.div animate={{ x: [0,20,0], y: [0,-10,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 -right-12 w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-white/5" />
        <motion.div animate={{ x: [0,-15,0], y: [0,10,0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-8 -left-8 w-36 h-36 lg:w-48 lg:h-48 rounded-full bg-teal-400/15" />
        <div className="absolute top-6 right-24 w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-white/5" />
        <Plane size={24} className="absolute top-8 left-6 text-white/20 rotate-12 lg:w-8 lg:h-8" />
      </div>

      {/* ── AVATAR SECTION (Desktop: Centered, larger) ── */}
      <div className="px-4 lg:px-content-desktop -mt-14 lg:-mt-16 mb-5 lg:mb-8">
        <div className="flex items-end justify-between lg:items-center lg:justify-start lg:gap-6">
          <div className="relative">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-white p-1 shadow-float overflow-hidden flex items-center justify-center">
              <Avatar user={profileUser} size={88} className="lg:w-28 lg:h-28" />
            </div>
            <label className="absolute bottom-1 right-1 w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-teal-50 border-2 border-white flex items-center justify-center shadow-sm cursor-pointer">
              <Camera size={12} className="text-white lg:w-4 lg:h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {profileUser.authProvider === "google" ? (
              <div className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-full bg-blue-50 border border-blue-200 flex items-center gap-1.5">
                <span className="text-blue-700 text-xs lg:text-sm font-bold">{t("profile.googleConnected")}</span>
              </div>
            ) : (
              <div className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-full bg-slate-100 border border-slate-200 flex items-center gap-1.5">
                <span className="text-slate-700 text-xs lg:text-sm font-bold">{t("profile.emailConnected")}</span>
              </div>
            )}
            <div className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-500 lg:w-4 lg:h-4" />
              <span className="text-emerald-700 text-xs lg:text-sm font-bold">{t("profile.verified")}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 lg:mt-4">
          <h1 className="text-xl lg:text-3xl font-extrabold text-slate-800">{profileUser.firstName} {profileUser.lastName}</h1>
          <p className="text-slate-400 text-sm lg:text-base mt-0.5">{profileUser.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Flame size={14} className="text-orange-500 lg:w-5 lg:h-5" />
            <span className="text-xs lg:text-sm font-bold text-orange-500">{t("profile.streak", { count: profileUser.streak || 0 })}</span>
          </div>

          {/* Level and XP Progress Bar */}
          <div className="mt-3 max-w-[280px] lg:max-w-[400px]">
            <div className="flex justify-between items-center text-xs lg:text-sm font-bold text-slate-600 mb-1">
              <span>{t("profile.level", { level: profileUser.level || 1 })}</span>
              <span className="text-slate-400">{t("profile.xp", { xp: (profileUser.xp || 0) % 100 })}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className="h-full bg-teal-500 rounded-full" 
                style={{ width: `${(profileUser.xp || 0) % 100}%`, transition: "width 0.5s ease-out" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS (Desktop: Larger cards) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-4 lg:mx-content-desktop mb-5 lg:mb-8 premium-card p-4 lg:p-6"
      >
        <div className="flex items-center justify-around">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * i + 0.2, type: "spring" }}
                className="flex flex-col items-center gap-2 lg:gap-3"
              >
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-[16px] lg:rounded-2xl flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon size={20} className="lg:w-6 lg:h-6" style={{ color: s.color }} />
                </div>
                <span className="text-xl lg:text-2xl font-extrabold text-slate-800">{s.value}</span>
                <span className="text-[11px] lg:text-sm font-semibold text-slate-400">{t(s.label)}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── ACHIEVEMENTS (Desktop: Grid layout) ── */}
      <div className="mx-4 lg:mx-content-desktop mb-5 lg:mb-8">
        <div className="flex items-center gap-2 mb-3 lg:mb-4">
          <Award size={16} className="text-amber-500 lg:w-5 lg:h-5" />
          <h3 className="text-[17px] lg:text-heading-lg font-bold text-slate-800">{t("profile.achievements")}</h3>
        </div>
        <div className="flex gap-3 lg:gap-4 overflow-x-auto lg:grid lg:grid-cols-4 lg:overflow-visible hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 pb-1 lg:pb-0">
          {(achievements.length > 0 ? achievements : ACHIEVEMENTS).map((badge, i) => (
            <motion.div
              key={badge.title || badge.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 + 0.2 }}
              className={`flex-shrink-0 lg:flex-1 flex flex-col items-center gap-2 lg:gap-3 p-3 lg:p-4 rounded-[20px] lg:rounded-2xl bg-white border border-slate-100 shadow-xs w-24 lg:w-auto transition-opacity duration-300 ${
                badge.unlocked === false ? "opacity-40" : "opacity-100"
              }`}
            >
              <span className="text-3xl lg:text-4xl">{badge.icon || badge.emoji}</span>
              <p className="text-[11px] lg:text-sm font-bold text-slate-700 text-center leading-tight">{badge.title || badge.label}</p>
              <p className="text-[9px] lg:text-xs text-slate-400 text-center leading-tight">{badge.description || badge.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── REFERRAL DASHBOARD ── */}
      <div className="mx-4 mb-5 select-none">
        <div className="flex items-center gap-2 mb-3">
          <Gift size={16} className="text-teal-500" />
          <h3 className="text-[17px] font-bold text-slate-805 dark:text-white font-poppins">Referral Dashboard</h3>
        </div>
        
        <div className="premium-card p-4 space-y-4 bg-white dark:bg-slate-900/60">
          {/* Referral Code Info */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-955/30 border border-slate-100 dark:border-slate-850 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Your Invite Code</span>
              <span className="text-sm font-black text-teal-600 dark:text-teal-400 tracking-wide font-mono mt-0.5 select-text">
                {referralStats.referralCode || profileUser?.referralCode || "TLP-SANJAI-5821"}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralStats.referralCode || profileUser?.referralCode || "");
                  toast.success("Referral code copied!");
                }}
                className="h-8 px-3.5 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1 border border-slate-200/10"
              >
                <Copy size={12} />
                <span>Copy</span>
              </button>
              <button
                onClick={() => {
                  const shareText = `Explore amazing group trips with TravelLoop 🌍\n\nUse my referral code: ${referralStats.referralCode || profileUser?.referralCode || "TLP-SANJAI-5821"}\n\nGet exclusive discounts on your first booking.\n\nWebsite: https://traveloop.app\nDownload: https://traveloop.app/download\n\nJoin TravelLoop today and travel smarter.`;
                  if (navigator.share) {
                    navigator.share({ title: "TravelLoop", text: shareText });
                  } else {
                    navigator.clipboard.writeText(shareText);
                    toast.success("Share link copied!");
                  }
                }}
                className="h-8 px-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl transition-all active:scale-95 flex items-center gap-1 shadow-md shadow-teal-500/10"
              >
                <Share2 size={12} />
                <span>Share Link</span>
              </button>
            </div>
          </div>

          {/* ── ENTER REFERRAL CODE (only shown if not yet verified) ── */}
          {!referralStats.referralVerified && !referralStats.referredBy && verifyState !== "success" && (
            <div className="p-3 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Have a referral code?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => {
                    setEnteredCode(e.target.value.toUpperCase());
                    if (verifyState === "error") { setVerifyState("idle"); setVerifyError(""); }
                  }}
                  placeholder="e.g. TLP-RAHUL-4821"
                  maxLength={20}
                  className="flex-1 h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none focus:border-teal-400 transition-colors"
                />
                <button
                  id="verify-referral-btn"
                  onClick={handleVerifyReferral}
                  disabled={verifyState === "loading" || !enteredCode.trim()}
                  className="h-9 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-black rounded-xl transition-all active:scale-95 flex-shrink-0"
                >
                  {verifyState === "loading" ? "Verifying…" : "Verify"}
                </button>
              </div>
              {verifyState === "error" && verifyError && (
                <p className="text-[10px] text-red-500 font-semibold mt-1.5">{verifyError}</p>
              )}
            </div>
          )}

          {/* ── VERIFY SUCCESS BANNER ── */}
          {(verifyState === "success" || referralStats.referralVerified) && referralStats.referredBy && (
            <div className="p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                <Gift size={15} className="text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-teal-700 dark:text-teal-300">✅ Referral Verified</p>
                <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70 mt-0.5 font-medium truncate">
                  Invited by <span className="font-black">{referralStats.referredBy}</span>
                  {verifyResult?.rewardValue ? ` · Reward: ${verifyResult.rewardValue}` : " · Scratch card unlocked"}
                </p>
              </div>
            </div>
          )}


          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Invites */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Invites</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-1">{referralStats.totalInvites}</span>
            </div>

            {/* Successful Bookings */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bookings</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-1">{referralStats.successfulBookings}</span>
            </div>

            {/* Coins Earned */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Coins Earned</span>
              <span className="text-xl font-black text-teal-605 dark:text-teal-400 mt-1">{referralStats.coinsEarned} 🪙</span>
            </div>

            {/* Discount Earned */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Discount Earned</span>
              <span className="text-xl font-black text-teal-605 dark:text-teal-400 mt-1">₹{new Intl.NumberFormat('en-IN').format(referralStats.discountEarned || 0)}</span>
            </div>

            {/* Scratch Cards Earned */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Scratch Cards</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-1">{referralStats.scratchCardsEarned || 0}</span>
            </div>

            {/* Rewards Claimed */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rewards Claimed</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-1">{referralStats.rewardsClaimed || 0}</span>
            </div>

            {/* Coupons Available */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Coupons Available</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{referralStats.couponsAvailable || 0}</span>
            </div>
          </div>

          {/* Scratch Cards List */}
          {referralStats.scratchCards && referralStats.scratchCards.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-855">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-2">My Scratch Cards</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {referralStats.scratchCards.map((c) => (
                  <div
                    key={c.cardId}
                    onClick={() => {
                      if (!c.claimed) {
                        setSelectedCard(c);
                        setShowScratchModal(true);
                      }
                    }}
                    className={`flex-shrink-0 w-24 p-2 rounded-xl text-center border relative overflow-hidden cursor-pointer active:scale-95 transition-transform ${
                      c.claimed
                        ? "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400"
                        : "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-400"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider block">{c.cardType}</span>
                    <span className="text-[9px] block mt-1 opacity-90">{c.rewardValue || c.rewardType}</span>
                    <span className="text-[8px] font-bold block mt-1.5 uppercase px-1 py-0.5 rounded bg-white/40 dark:bg-black/20">
                      {c.claimed ? "Claimed" : "Scratch"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MY REWARDS SECTION ── */}
          {referralStats.rewards && referralStats.rewards.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-855">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-2 font-poppins">My Rewards</h4>
              <div className="space-y-2">
                {(() => {
                  const now = new Date();
                  return referralStats.rewards.map((reward, index) => {
                    const isExpired = reward.expiresAt && new Date(reward.expiresAt) < now;
                    let status = "Available";
                    let statusBg = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";
                    
                    if (reward.used || reward.status === "USED") {
                      status = "Used";
                      statusBg = "bg-slate-100 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400";
                    } else if (isExpired || reward.status === "EXPIRED") {
                      status = "Expired";
                      statusBg = "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400";
                    }

                    return (
                      <div
                        key={reward._id || reward.couponCode || index}
                        className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 dark:text-white font-mono select-text">
                            {reward.couponCode}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${statusBg}`}>
                            {status}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                          <span>Discount: <span className="text-teal-605 dark:text-teal-400 font-extrabold">{reward.discountPercent}% OFF</span></span>
                          <span>Expiry: {reward.expiresAt ? new Date(reward.expiresAt).toLocaleDateString() : "30 days"}</span>
                        </div>

                        {reward.used && (
                          <div className="text-[9px] text-slate-450 font-bold mt-0.5 border-t border-slate-100 dark:border-slate-800 pt-1 space-y-0.5">
                            <div>Applied Booking: <span className="font-mono text-slate-600 dark:text-slate-350 select-text">{reward.usedBookingId || "—"}</span></div>
                            {reward.usedAt && <div>Used On: <span className="text-slate-500 dark:text-slate-400">{new Date(reward.usedAt).toLocaleDateString()}</span></div>}
                          </div>
                        )}

                        {status === "Available" && (
                          <button
                            onClick={() => {
                              setSelectedProfileCoupon(reward);
                              setShowCouponModal(true);
                            }}
                            className="w-full mt-1.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-955 text-[10px] font-extrabold rounded-xl transition-colors active:scale-95 flex items-center justify-center gap-1 shadow-sm"
                          >
                            Open Coupon
                          </button>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DARK MODE TOGGLE ── */}
      <div className="mx-4 mb-4 premium-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: isDark ? "rgba(15,23,42,0.15)" : "rgba(245,158,11,0.1)" }}>
            {isDark ? <Moon size={18} className="text-slate-700" /> : <Sun size={18} className="text-amber-500" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{t("profile.darkMode")}</p>
            <p className="text-xs text-slate-400">{isDark ? t("profile.darkThemeActive") : t("profile.lightThemeActive")}</p>
          </div>
        </div>
        <motion.button
          onClick={toggleTheme}
          className="relative w-14 h-7 rounded-full transition-colors duration-300"
          style={{ background: isDark ? "#14B8B5" : "#E2E8F0" }}
        >
          <motion.div
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
            animate={{ left: isDark ? "calc(100% - 24px)" : "4px" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        </motion.button>
      </div>

      {/* ── SETTINGS GROUPS ── */}
      {SETTINGS_GROUPS.map((group, gi) => (
        <div key={group.title} className="mx-4 mb-4 premium-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(group.title)}</p>
          </div>
          {group.items.map((item, idx, arr) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (item.path) {
                    navigate(item.path);
                  } else {
                    if (item.key === "personalInfo") setPersonalSheet(true);
                    if (item.key === "security") setSecuritySheet(true);
                    if (item.key === "notifications") setNotificationSheet(true);
                    if (item.key === "privacy") setPrivacySheet(true);
                    if (item.key === "language") setLanguageSheet(true);
                    if (item.key === "helpSupport") setHelpSheet(true);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-4 text-left active:bg-slate-50 transition-colors ${
                  idx < arr.length - 1 ? "border-b border-slate-50" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{t(item.label)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.key === "personalInfo" && profileUser.upiId 
                      ? `UPI ID: ${profileUser.upiId}` 
                      : (item.key === "language" 
                        ? (LANGUAGES.find(l => l.code === i18n.language)?.name || t(item.sub)) 
                        : t(item.sub))}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
      ))}

      {/* ── LOGOUT ── */}
      <div className="mx-4 mb-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setLogoutSheet(true)}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-[20px] bg-red-50 border border-red-100 text-red-500 font-bold text-sm"
        >
          <LogOut size={18} />
          {t("profile.signOut")}
        </motion.button>
      </div>

      {/* ── VERSION DISPLAY ── */}
      <div className="text-center pb-24">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("profile.version")}</p>
      </div>

      {/* ── PERSONAL INFO SHEET ── */}
      <BottomSheet isOpen={personalSheet} onClose={() => setPersonalSheet(false)} title={t("personal.title")} snapPoints={["85vh"]}>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pb-6 px-1">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">First Name</label>
              <input
                type="text"
                required
                value={personalForm.firstName}
                onChange={e => setPersonalForm(f => ({ ...f, firstName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Last Name</label>
              <input
                type="text"
                required
                value={personalForm.lastName}
                onChange={e => setPersonalForm(f => ({ ...f, lastName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Age & Gender Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Age</label>
              <input
                type="number"
                value={personalForm.age || ""}
                onChange={e => setPersonalForm(f => ({ ...f, age: e.target.value }))}
                placeholder="Enter age"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Gender</label>
              <select
                value={personalForm.gender || ""}
                onChange={e => setPersonalForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Email (Prefilled & Locked) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Email Address (Locked)</label>
            <div className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-slate-55/40 dark:bg-slate-850/40 text-slate-500 text-sm font-semibold select-none">
              <span>{profileUser.email}</span>
              <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider flex items-center gap-1">
                Verified ✔
              </span>
            </div>
          </div>

          {/* Primary Mobile */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Primary Mobile Number</label>
            {profileUser.primaryVerified ? (
              <div className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-slate-55/40 dark:bg-slate-850/40 text-slate-500 text-sm font-semibold select-none">
                <span>{profileUser.primaryMobile || profileUser.phone}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider flex items-center gap-1">
                    Verified ✔
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPersonalForm(f => ({ ...f, primaryMobile: "" }));
                      setProfileUser(prev => ({ ...prev, primaryVerified: false }));
                    }}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {!showPrimaryOtp ? (
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={personalForm.primaryMobile}
                      onChange={e => setPersonalForm(f => ({ ...f, primaryMobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendOtp(personalForm.primaryMobile, false)}
                      disabled={otpSending}
                      className="px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
                    >
                      {otpSending ? "Sending..." : "Verify"}
                    </button>
                  </div>
                ) : (
                  <OtpVerifier
                    phone={personalForm.primaryMobile}
                    isAlternate={false}
                    onVerify={(code) => handleVerifyOtp(code, personalForm.primaryMobile, false)}
                    onResend={() => handleSendOtp(personalForm.primaryMobile, false)}
                    onCancel={() => setShowPrimaryOtp(false)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Alternate Mobile */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase">Enable Alternate Mobile Number</label>
              <button
                type="button"
                onClick={() => setAlternateEnabled(!alternateEnabled)}
                className="relative w-10 h-6 rounded-full transition-colors"
                style={{ background: alternateEnabled ? "#14B8B5" : "#E2E8F0" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                  style={{ left: alternateEnabled ? "18px" : "2px" }}
                />
              </button>
            </div>

            {alternateEnabled && (
              <div>
                {profileUser.alternateVerified && (profileUser.alternateMobile === personalForm.alternateMobile || profileUser.alternateNumber === personalForm.alternateMobile) ? (
                  <div className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200/60 bg-slate-55/40 dark:bg-slate-850/40 text-slate-500 text-sm font-semibold select-none">
                    <span>{profileUser.alternateNumber || profileUser.alternateMobile}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">
                        Verified ✔
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPersonalForm(f => ({ ...f, alternateMobile: "" }));
                          updateProfileDetails({ alternateMobile: "", alternateVerified: false });
                        }}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {!showAlternateOtp ? (
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          placeholder="Enter alternate 10-digit number"
                          value={personalForm.alternateMobile}
                          onChange={e => setPersonalForm(f => ({ ...f, alternateMobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendOtp(personalForm.alternateMobile, true)}
                          disabled={otpSending}
                          className="px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
                        >
                          {otpSending ? "Sending..." : "Verify"}
                        </button>
                      </div>
                    ) : (
                      <OtpVerifier
                        phone={personalForm.alternateMobile}
                        isAlternate={true}
                        onVerify={(code) => handleVerifyOtp(code, personalForm.alternateMobile, true)}
                        onResend={() => handleSendOtp(personalForm.alternateMobile, true)}
                        onCancel={() => setShowAlternateOtp(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Emergency Contact</label>
            <input
              type="tel"
              placeholder="10-digit emergency contact number"
              value={personalForm.emergencyContact}
              onChange={e => setPersonalForm(f => ({ ...f, emergencyContact: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handlePersonalSubmit}
            disabled={submitting}
            className="w-full py-4 rounded-xl text-white font-bold text-sm shadow-brand mt-4 hover:opacity-90 active:scale-[0.99] transition-all"
            style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
          >
            {submitting ? t("personal.saving") : t("personal.saveChanges")}
          </button>
          
          {/* Recaptcha container placeholder for Firebase invisible phone auth verification */}
          <div id="recaptcha-container"></div>
        </div>
      </BottomSheet>

      {/* ── SECURITY SHEET ── */}
      <BottomSheet isOpen={securitySheet} onClose={() => setSecuritySheet(false)} title={t("security.title")} snapPoints={["55vh"]}>
        <form onSubmit={handleSecuritySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{t("security.currentPassword")}</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={securityForm.currentPassword}
              onChange={e => setSecurityForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{t("security.newPassword")}</label>
            <input
              type="password"
              required
              placeholder={t("security.newPasswordPlaceholder")}
              value={securityForm.newPassword}
              onChange={e => setSecurityForm(f => ({ ...f, newPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{t("security.confirmPassword")}</label>
            <input
              type="password"
              required
              placeholder={t("security.confirmPasswordPlaceholder")}
              value={securityForm.confirmPassword}
              onChange={e => setSecurityForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full py-4 rounded-full text-white font-bold text-sm shadow-brand mt-2"
            style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
          >
            {t("security.updatePassword")}
          </motion.button>
        </form>
      </BottomSheet>

      {/* ── NOTIFICATIONS SHEET ── */}
      <BottomSheet isOpen={notificationSheet} onClose={() => setNotificationSheet(false)} title={t("notifications.title")} snapPoints={["50vh"]}>
        <div className="space-y-4 divide-y divide-slate-100">
          {[
            { key: "reminders", title: t("notifications.tripReminders"), desc: t("notifications.tripRemindersDesc") },
            { key: "budget", title: t("notifications.budgetUpdates"), desc: t("notifications.budgetUpdatesDesc") },
            { key: "weather", title: t("notifications.weatherWarnings"), desc: t("notifications.weatherWarningsDesc") },
            { key: "statusUpdates", title: t("notifications.tripStatusAlerts"), desc: t("notifications.tripStatusAlertsDesc") },
          ].map((item, idx) => (
            <div key={item.key} className={`flex items-center justify-between ${idx > 0 ? "pt-4" : ""}`}>
              <div className="pr-4">
                <p className="text-sm font-bold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => handleNotifToggle(item.key)}
                className="relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0"
                style={{ background: notifForm[item.key] ? "#14B8B5" : "#E2E8F0" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs"
                  style={{ left: notifForm[item.key] ? "calc(100% - 22px)" : "2px", transition: "left 0.2s" }}
                />
              </button>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* ── PRIVACY SHEET ── */}
      <BottomSheet isOpen={privacySheet} onClose={() => setPrivacySheet(false)} title={t("privacy.title")} snapPoints={["52vh"]}>
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-sm font-bold text-slate-800">{t("privacy.rightsTitle")}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t("privacy.rightsDesc")}
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleDownloadData}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 active:bg-slate-50 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-bold text-slate-700">{t("privacy.downloadData")}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t("privacy.downloadDataDesc")}</p>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button
              onClick={() => {
                setPrivacySheet(false);
                setDeleteConfirmSheet(true);
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/50 active:bg-red-50 transition-colors text-red-600"
            >
              <div className="text-left">
                <p className="text-sm font-bold">{t("privacy.deleteAccount")}</p>
                <p className="text-xs text-red-400 mt-0.5">{t("privacy.deleteAccountDesc")}</p>
              </div>
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── LANGUAGE SHEET ── */}
      <BottomSheet isOpen={languageSheet} onClose={() => setLanguageSheet(false)} title={t("profile.language")} snapPoints={["60vh"]}>
        <div className="space-y-3">
          {LANGUAGES.map(lang => {
            const isSelected = profileUser.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code, lang.name)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                  isSelected ? "border-teal-400 bg-teal-50/50" : "border-slate-100 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{lang.native} ({lang.name})</p>
                  </div>
                </div>
                {isSelected && <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* ── HELP & SUPPORT SHEET ── */}
      <BottomSheet isOpen={helpSheet} onClose={() => setHelpSheet(false)} title={t("profile.helpSupport")} snapPoints={["80vh"]}>
        <div className="space-y-6">
          {/* FAQs */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t("faq.title")}</h4>
            <div className="space-y-3">
              {[
                { q: t("faq.q1"), a: t("faq.a1") },
                { q: t("faq.q2"), a: t("faq.a2") },
                { q: t("faq.q3"), a: t("faq.a3") },
              ].map((faq, index) => (
                <details key={index} className="group p-3 rounded-xl border border-slate-100 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                    <p className="text-sm font-bold text-slate-700 pr-4">{faq.q}</p>
                    <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* SUPPORT FORM */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t("faq.supportTicketTitle")}</h4>
            <form onSubmit={handleSupportSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("faq.emailLabel")}</label>
                <input
                  type="email"
                  required
                  placeholder={profileUser.email}
                  value={supportForm.email || profileUser.email}
                  onChange={e => setSupportForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("faq.messageLabel")}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={t("faq.messagePlaceholder")}
                  value={supportForm.message}
                  onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-teal-400 resize-none"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full py-3 rounded-full text-white font-bold text-xs shadow-brand mt-1"
                style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
              >
                {t("faq.sendBtn")}
              </motion.button>
            </form>
          </div>
        </div>
      </BottomSheet>

      {/* ── DELETE ACCOUNT CONFIRMATION SHEET ── */}
      <BottomSheet isOpen={deleteConfirmSheet} onClose={() => setDeleteConfirmSheet(false)} title={t("dangerZone.title")} snapPoints={["50vh"]}>
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">{t("dangerZone.confirmDelete")}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[280px] mx-auto">
              {t("dangerZone.confirmDesc")}
            </p>
          </div>
          <div>
            <label className="block text-left text-[10px] font-bold text-slate-400 uppercase mb-1.5">{t("dangerZone.typeDelete")}</label>
            <input
              type="text"
              placeholder="DELETE"
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-red-200 text-sm font-extrabold tracking-widest text-center uppercase outline-none focus:border-red-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirmSheet(false)}
              className="flex-1 py-3.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs"
            >
              {t("profile.cancel")}
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteText !== "DELETE" || submitting}
              className="flex-1 py-3.5 rounded-full bg-red-500 text-white font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? t("dangerZone.deleting") : t("dangerZone.permanentlyDelete")}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── LOGOUT SHEET ── */}
      <AnimatePresence>
        {logoutSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogoutSheet(false)}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[999] bg-white rounded-t-[32px] p-6"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
            >
              <div className="flex justify-center mb-5">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-3">
                  <LogOut size={28} className="text-red-400" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">{t("profile.signOutConfirm")}</h3>
                <p className="text-slate-400 text-sm mt-1">{t("profile.signOutDesc")}</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLogoutSheet(false)}
                  className="flex-1 py-4 rounded-full bg-slate-100 text-slate-700 font-bold text-sm"
                >
                  {t("profile.cancel")}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex-1 py-4 rounded-full bg-red-500 text-white font-bold text-sm shadow-sm"
                >
                  {t("profile.signOut")}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Scratch Card Modal Overlay */}
      <ScratchCardModal
        isOpen={showScratchModal}
        onClose={() => setShowScratchModal(false)}
        card={selectedCard}
        onClaimed={() => {
          fetchReferralStats();
        }}
      />
      {/* Coupon Details Modal Overlay */}
      <CouponDetailsModal
        isOpen={showCouponModal}
        onClose={() => {
          setShowCouponModal(false);
          setSelectedProfileCoupon(null);
        }}
        coupon={selectedProfileCoupon}
      />
    </MainLayout>
  );
};

export default Profile;
