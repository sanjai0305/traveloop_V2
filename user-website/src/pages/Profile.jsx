// src/pages/Profile.jsx — Tabbed SaaS Account Center with Integrated About Tab

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Avatar from "../components/common/Avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../i18n/metadata";
import { loadLanguageBundle } from "../i18n/i18n";
import MainLayout from "../layouts/MainLayout";
import PageHeader from "../components/common/PageHeader";
import AboutSection from "../components/about/AboutSection";
import { useAuth } from "../context/AuthContext";
import {
  User, Mail, Phone, MapPin, Globe, CalendarDays, ShieldCheck,
  ChevronRight, Bell, Lock, Eye, Palette, HelpCircle, LogOut,
  Camera, Map, Plane, Clock, Moon, Sun, Award, Flame, Star,
  Languages, ChevronDown, Heart, AlertTriangle, Trash2, FileText, Info,
  Gift, Share2, Copy, RefreshCw, CheckCircle2, ExternalLink, Edit3,
  CreditCard, ShieldAlert, Sparkles, Check, Compass, Laptop, Smartphone,
  DollarSign, Sliders, X, Info as InfoIcon
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import BottomSheet from "../components/mobile/BottomSheet";
import { useToast } from "../components/mobile/MobileToast";
import { verifyReferralCode } from "../services/authService";
import ScratchCardModal from "../components/dashboard/ScratchCardModal";
import CouponDetailsModal from "../components/dashboard/CouponDetailsModal";
import { auth } from "../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const ALL_ACHIEVEMENTS = [
  { emoji: "🏆", label: "First Trip Created", desc: "Created your first trip" },
  { emoji: "🏆", label: "Explorer", desc: "Created 5 trips" },
  { emoji: "🏆", label: "Planner Pro", desc: "Created 10 trips" },
  { emoji: "🏆", label: "Collaboration Pro", desc: "Collaborated on a trip" },
  { emoji: "🏆", label: "Budget Master", desc: "Logged your first expense" },
  { emoji: "🏆", label: "Journal Keeper", desc: "Created a journal entry" },
  { emoji: "🏆", label: "Flight Tracker", desc: "Tracked your first flight" },
  { emoji: "🏆", label: "Chat Starter", desc: "Sent your first chat message" },
];

const TABS = [
  { id: "personal",      label: "Personal",      icon: User },
  { id: "travel",        label: "Travel",        icon: Compass },
  { id: "security",      label: "Security",      icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "rewards",       label: "Rewards",       icon: Gift },
  { id: "about",         label: "About",         icon: InfoIcon },
];

const maskSentPhone = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  const base = cleaned.slice(-10);
  return `+91 ${base.slice(0, 5)} ${base.slice(5).replace(/./g, "X")}`;
};

// ─── OTP VERIFIER COMPONENT ───────────────────────────────────────
const OtpVerifier = ({ phone, isAlternate, onVerify, onResend, onCancel }) => {
  const [otp, setOtp] = React.useState(new Array(6).fill(""));
  const [timer, setTimer] = React.useState(120);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const inputRefs = React.useRef([]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
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
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
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
      setOtp(pasted.split(""));
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
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl text-white font-sans space-y-4">
      {success ? (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center mb-2">
            <ShieldCheck size={28} className="text-slate-950" />
          </div>
          <h3 className="text-base font-black text-cyan-400">Phone Verified!</h3>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-cyan-400">SMS OTP Code</span>
            <span className="font-mono text-slate-400">{maskSentPhone(phone)}</span>
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
                className="w-10 h-12 bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded-xl text-center text-lg font-black text-white outline-none"
              />
            ))}
          </div>

          {error && <p className="text-xs text-rose-400 font-bold text-center">{error}</p>}

          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-cyan-400 font-bold">{formatTimer(timer)}</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0}
              className={`font-bold ${timer > 0 ? "text-slate-600" : "text-cyan-400 hover:underline"}`}
            >
              Resend Code
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-xl border border-slate-700 text-xs font-bold">
              Cancel
            </button>
            <button type="button" onClick={handleVerify} disabled={loading} className="flex-1 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs">
              {loading ? "Verifying..." : "Confirm"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── MAIN PROFILE COMPONENT ───────────────────────────────────────
const Profile = () => {
  const navigate  = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("personal");
  const [logoutSheet, setLogoutSheet] = useState(false);
  const [showAllBadgesModal, setShowAllBadgesModal] = useState(false);

  // Forms State
  const [profileUser, setProfileUser] = useState(null);
  const [personalForm, setPersonalForm] = useState({
    firstName: "", lastName: "", phone: "", primaryMobile: "", alternateMobile: "",
    emergencyContact: "", age: "", gender: "", city: "", country: "", upiId: "", timezone: "UTC+05:30 (IST)"
  });
  const [securityForm, setSecurityForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notifForm, setNotifForm] = useState({ reminders: true, budget: true, weather: true, statusUpdates: true, marketing: false });
  const [achievements, setAchievements] = useState([]);

  const [showPrimaryOtp, setShowPrimaryOtp] = useState(false);
  const [showAlternateOtp, setShowAlternateOtp] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [alternateEnabled, setAlternateEnabled] = useState(false);

  const [trips, setTrips] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Referral state
  const [referralStats, setReferralStats] = useState({
    referralCode: "", totalInvites: 0, successfulBookings: 0, coinsEarned: 0,
    discountEarned: 0, walletBalance: 0, scratchCards: [], scratchCardsEarned: 0,
    rewardsClaimed: 0, couponsAvailable: 0, referralVerified: false, referredBy: ""
  });
  const [enteredCode, setEnteredCode]   = useState("");
  const [verifyState, setVerifyState]   = useState("idle");

  const [selectedCard, setSelectedCard]             = useState(null);
  const [showScratchModal, setShowScratchModal]     = useState(false);
  const [selectedProfileCoupon, setSelectedProfileCoupon] = useState(null);
  const [showCouponModal, setShowCouponModal]       = useState(false);

  const { user: authUser, logout, login } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(getApiUrl("auth/me"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setAchievements(data.achievements || []);
      } catch (err) {
        console.error("Failed to fetch achievements:", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(getApiUrl("trips"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setTrips(data.trips || []);
      } catch (err) {
        console.error("Failed to fetch trips:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchTrips();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(getApiUrl("profile/referral-dashboard"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setReferralStats(data);
    } catch (err) {
      console.error("Failed to fetch referral stats:", err);
    }
  };

  useEffect(() => {
    fetchReferralStats();
  }, []);

  useEffect(() => {
    if (authUser) {
      setProfileUser(authUser);
      setAlternateEnabled(!!(authUser.alternateNumber || authUser.alternateMobile));
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
        timezone: "UTC+05:30 (IST)"
      });
      if (authUser.notificationPreferences) {
        setNotifForm({
          reminders: authUser.notificationPreferences.reminders !== false,
          budget: authUser.notificationPreferences.budget !== false,
          weather: authUser.notificationPreferences.weather !== false,
          statusUpdates: authUser.notificationPreferences.statusUpdates !== false,
          marketing: authUser.notificationPreferences.marketing === true
        });
      }
    }
  }, [authUser]);

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
      { label: "Trips", value: loadingStats ? "..." : String(tripsCount), icon: Map, color: "#06B6D4" },
      { label: "Countries", value: loadingStats ? "..." : String(countriesCount), icon: Globe, color: "#2563EB" },
      { label: "Days Travelled", value: loadingStats ? "..." : String(totalDays), icon: Clock, color: "#14B8A6" },
      { label: "Budget Saved", value: "₹45,000", icon: DollarSign, color: "#10B981" },
    ];
  }, [trips, loadingStats]);

  if (!profileUser) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl">😕</span>
          <p className="text-xl font-bold text-slate-700">{t("profile.notLoggedIn")}</p>
          <button onClick={() => navigate("/auth")} className="px-6 py-3 rounded-full text-white font-bold bg-gradient-to-r from-cyan-500 to-blue-600">
            {t("profile.goToLogin")}
          </button>
        </div>
      </MainLayout>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const updateProfileDetails = async (bodyPayload, successMsg) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("profile/update"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (data.success) {
        const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const mergedUser = { ...cachedUser, ...data.user };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        setProfileUser(mergedUser);
        login(mergedUser, token);
        toast.success(successMsg || "Profile updated!");
        return true;
      } else {
        toast.error(data.message || "Failed to update profile");
        return false;
      }
    } catch (err) {
      toast.error("Error connecting to server");
      return false;
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Str = event.target.result;
      setProfileUser(prev => ({ ...prev, avatar: base64Str }));
      await updateProfileDetails({ avatar: base64Str }, "Avatar updated successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handlePersonalSubmit = async (e) => {
    if (e) e.preventDefault();
    await updateProfileDetails(personalForm, "Personal details saved!");
  };

  const handleSendOtp = async (phone, isAlternate) => {
    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit mobile number starting with 6-9");
      return;
    }
    setOtpSending(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      const confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      toast.success("Verification SMS sent!");
      if (isAlternate) setShowAlternateOtp(true);
      else setShowPrimaryOtp(true);
    } catch (err) {
      toast.error(err.message || "Failed to send SMS code.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (code, phone, isAlternate) => {
    const result = await window.confirmationResult.confirm(code);
    const idToken = await result.user.getIdToken();
    const token = localStorage.getItem("token");
    const res = await fetch(getApiUrl("user/verify-phone"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ phone, idToken, isAlternate })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Verification failed");

    const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const mergedUser = { ...cachedUser, ...data.user };
    localStorage.setItem("user", JSON.stringify(mergedUser));
    setProfileUser(mergedUser);
    login(mergedUser, token);

    if (isAlternate) setShowAlternateOtp(false);
    else setShowPrimaryOtp(false);
  };

  const handleNotifToggle = async (field) => {
    const updated = { ...notifForm, [field]: !notifForm[field] };
    setNotifForm(updated);
    await updateProfileDetails({ notificationPreferences: updated }, "Notifications updated!");
  };

  const handleLanguageSelect = async (langCode, langName) => {
    await loadLanguageBundle(langCode);
    i18n.changeLanguage(langCode);
    localStorage.setItem("i18nextLng", langCode);
    await updateProfileDetails({ language: langCode }, `Language changed to ${langName}`);
  };

  const handleVerifyReferral = async () => {
    if (!enteredCode.trim()) return;
    setVerifyState("loading");
    try {
      const token = localStorage.getItem("token");
      const data = await verifyReferralCode(enteredCode.trim(), token);
      setVerifyState("success");
      await fetchReferralStats();
      toast.success(`Referral code verified! Invited by ${data.referralOwner}`);
    } catch (err) {
      setVerifyState("error");
      toast.error(err.message || "Verification failed");
    }
  };

  const memberSinceYear = profileUser.createdAt ? new Date(profileUser.createdAt).getFullYear() : "2026";
  const userFullName = `${profileUser.firstName || "Traveler"} ${profileUser.lastName || ""}`.trim();

  return (
    <MainLayout>
      {/* ── MAX-WIDTH 1280px CENTERED CONTAINER ── */}
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 font-sans">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-[32px] font-black text-[#0F172A] tracking-tight">Account Settings</h1>
            <p className="text-base text-[#64748B] font-medium mt-0.5">Manage your identity, security, notifications, and travel rewards</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              title="Toggle theme"
            >
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── TWO-COLUMN LAYOUT: STICKY SIDEBAR + TAB WORKSPACE ─────── */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row items-start gap-8">

          {/* ════════════════════════════════════════════════════════════ */}
          {/* ── LEFT: STICKY SIDEBAR CARD (320px WIDTH) ───────────────── */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[320px] shrink-0 space-y-6 lg:sticky lg:top-28">
            <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 text-center space-y-4">
              
              {/* Avatar */}
              <div className="relative inline-block mx-auto">
                <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  <Avatar user={profileUser} size={112} className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" title="Online" />
                
                {/* Camera upload trigger */}
                <label className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 shadow-md flex items-center justify-center cursor-pointer hover:bg-cyan-50 hover:text-cyan-600 transition-colors">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              {/* Identity */}
              <div>
                <h2 className="text-[22px] font-black text-[#0F172A] leading-tight">{userFullName}</h2>
                <p className="text-sm text-[#64748B] font-medium mt-0.5">{profileUser.email}</p>
              </div>

              {/* Status Pills */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  Verified
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-[#0F172A] text-xs font-extrabold">
                  Joined {memberSinceYear}
                </span>
              </div>

              {/* Action CTAs */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => setActiveTab("personal")}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white font-extrabold text-xs tracking-wide shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => setLogoutSheet(true)}
                  className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* ── RIGHT: TAB WORKSPACE (Framer Motion 300ms Slide/Fade) ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="flex-1 w-full space-y-6">

            {/* TAB NAVIGATION HEADER (Personal | Travel | Security | Notifications | Rewards | About) */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60 overflow-x-auto hide-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-5 py-2.5 rounded-full text-xs font-extrabold transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer ${
                      active
                        ? "bg-white text-cyan-600 shadow-sm border border-slate-200/60 font-black"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-white/50"
                    }`}
                  >
                    <Icon size={16} className={active ? "text-cyan-500" : "text-slate-400"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT PANELS */}
            <AnimatePresence mode="wait">
              
              {/* ── TAB 1: PERSONAL ── */}
              {activeTab === "personal" && (
                <motion.div
                  key="personal-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-[22px] font-black text-[#0F172A]">Personal Details</h3>
                    <p className="text-sm text-[#64748B] font-medium">Update your profile info, phone numbers, and language preferences</p>
                  </div>

                  <form onSubmit={handlePersonalSubmit} className="space-y-6">
                    {/* Name Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 uppercase">First Name</label>
                        <input
                          type="text"
                          value={personalForm.firstName}
                          onChange={e => setPersonalForm(f => ({ ...f, firstName: e.target.value }))}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0F172A] outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 uppercase">Last Name</label>
                        <input
                          type="text"
                          value={personalForm.lastName}
                          onChange={e => setPersonalForm(f => ({ ...f, lastName: e.target.value }))}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0F172A] outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Email (Locked) */}
                    <div>
                      <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 uppercase">Email Address (Primary)</label>
                      <div className="flex items-center justify-between h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 text-sm font-bold">
                        <span>{profileUser.email}</span>
                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Verified
                        </span>
                      </div>
                    </div>

                    {/* Primary Mobile */}
                    <div className="space-y-2">
                      <label className="block text-xs font-extrabold text-[#0F172A] uppercase">Primary Mobile Number</label>
                      {profileUser.primaryVerified ? (
                        <div className="flex items-center justify-between h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 text-sm font-bold">
                          <span>{profileUser.phoneNumber || profileUser.primaryMobile}</span>
                          <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Verified
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {!showPrimaryOtp ? (
                            <div className="flex gap-2">
                              <input
                                type="tel"
                                value={personalForm.primaryMobile}
                                onChange={e => setPersonalForm(f => ({ ...f, primaryMobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                                placeholder="Enter 10-digit number"
                                className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0F172A] outline-none focus:border-cyan-400"
                              />
                              <button
                                type="button"
                                onClick={() => handleSendOtp(personalForm.primaryMobile, false)}
                                disabled={otpSending}
                                className="px-5 h-11 bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                              >
                                {otpSending ? "Sending..." : "Verify SMS"}
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

                    {/* City & Country Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 uppercase">City</label>
                        <input
                          type="text"
                          value={personalForm.city}
                          onChange={e => setPersonalForm(f => ({ ...f, city: e.target.value }))}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0F172A] outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 uppercase">Country</label>
                        <input
                          type="text"
                          value={personalForm.country}
                          onChange={e => setPersonalForm(f => ({ ...f, country: e.target.value }))}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0F172A] outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Language & Timezone Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 uppercase">Language</label>
                        <select
                          value={i18n.language}
                          onChange={e => handleLanguageSelect(e.target.value, e.target.options[e.target.selectedIndex].text)}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0F172A] outline-none focus:border-cyan-400 bg-white"
                        >
                          {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.native} ({lang.name})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 uppercase">Timezone</label>
                        <input
                          type="text"
                          readOnly
                          value={personalForm.timezone}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 text-sm font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white font-black text-sm tracking-wide shadow-md shadow-cyan-500/20 cursor-pointer"
                    >
                      Save Personal Information
                    </button>

                  </form>
                  <div id="recaptcha-container"></div>
                </motion.div>
              )}

              {/* ── TAB 2: TRAVEL ── */}
              {activeTab === "travel" && (
                <motion.div
                  key="travel-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {stats.map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="p-5 rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.06)] flex flex-col items-start gap-2">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-50 text-cyan-600">
                            <Icon size={20} style={{ color: s.color }} />
                          </div>
                          <span className="text-2xl font-black text-[#0F172A]">{s.value}</span>
                          <span className="text-xs font-bold text-[#64748B]">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent Trips & Saved Destinations */}
                  <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-[22px] font-black text-[#0F172A]">Recent Trips & Activity</h3>
                        <p className="text-sm text-[#64748B] font-medium">Quick links to active itineraries and saved destinations</p>
                      </div>
                      <Link to="/my-trips" className="text-xs font-extrabold text-cyan-600 hover:underline flex items-center gap-1">
                        View All Trips <ChevronRight size={14} />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Link to="/saved-destinations" className="p-4 rounded-2xl bg-slate-50 hover:bg-cyan-50/50 border border-slate-100 flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-3">
                          <Heart size={20} className="text-rose-500" />
                          <div>
                            <h4 className="text-sm font-extrabold text-[#0F172A]">Saved Destinations</h4>
                            <p className="text-xs text-[#64748B] font-medium">View bookmarked places</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <Link to="/create-trip" className="p-4 rounded-2xl bg-slate-50 hover:bg-cyan-50/50 border border-slate-100 flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-3">
                          <Plane size={20} className="text-cyan-500" />
                          <div>
                            <h4 className="text-sm font-extrabold text-[#0F172A]">Build AI Itinerary</h4>
                            <p className="text-xs text-[#64748B] font-medium">Create a new journey</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-[22px] font-black text-[#0F172A]">Latest Achievements</h3>
                        <p className="text-sm text-[#64748B] font-medium">Badges earned during your travel planning</p>
                      </div>
                      <button
                        onClick={() => setShowAllBadgesModal(true)}
                        className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-black text-[#0F172A] transition-colors cursor-pointer"
                      >
                        View All Badges ({ALL_ACHIEVEMENTS.length})
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {ALL_ACHIEVEMENTS.slice(0, 3).map((b, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1.5">
                          <span className="text-3xl">{b.emoji}</span>
                          <h4 className="text-sm font-extrabold text-[#0F172A]">{b.label}</h4>
                          <p className="text-xs text-[#64748B] font-medium">{b.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              )}

              {/* ── TAB 3: SECURITY ── */}
              {activeTab === "security" && (
                <motion.div
                  key="security-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Security Score Widget */}
                  <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center bg-emerald-50 text-emerald-700 shrink-0">
                      <span className="text-2xl font-black">92%</span>
                      <span className="text-[10px] font-black uppercase">Score</span>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
                        <CheckCircle2 size={13} className="text-emerald-500" /> Excellent Security Score
                      </div>
                      <h3 className="text-[22px] font-black text-[#0F172A]">Account Protection Status</h3>
                      <p className="text-sm text-[#64748B] font-medium">Your password and 2FA authentication settings are fully configured.</p>
                    </div>
                  </div>

                  {/* Password & Credentials */}
                  <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-[22px] font-black text-[#0F172A]">Password & Security Credentials</h3>
                      <p className="text-sm text-[#64748B] font-medium">Update account password and review login methods</p>
                    </div>

                    <form onSubmit={e => { e.preventDefault(); toast.success("Password updated!"); setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }} className="space-y-4 max-w-lg">
                      <div>
                        <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 uppercase">Current Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={securityForm.currentPassword}
                          onChange={e => setSecurityForm(f => ({ ...f, currentPassword: e.target.value }))}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#0F172A] mb-1.5 uppercase">New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="Min 8 characters"
                          value={securityForm.newPassword}
                          onChange={e => setSecurityForm(f => ({ ...f, newPassword: e.target.value }))}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-cyan-400"
                        />
                      </div>

                      <button type="submit" className="h-11 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold text-xs cursor-pointer shadow-md">
                        Update Password
                      </button>
                    </form>
                  </div>

                  {/* Active Sessions */}
                  <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 space-y-4">
                    <h3 className="text-[22px] font-black text-[#0F172A]">Active Devices & Sessions</h3>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Laptop className="w-5 h-5 text-cyan-500" />
                        <div>
                          <h4 className="text-sm font-extrabold text-[#0F172A]">Current Web Browser Session</h4>
                          <p className="text-xs text-[#64748B] font-medium">Windows PC · Chrome Browser · Active Now</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">This Device</span>
                    </div>
                  </div>

                </motion.div>
              )}

              {/* ── TAB 4: NOTIFICATIONS ── */}
              {activeTab === "notifications" && (
                <motion.div
                  key="notifications-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-[22px] font-black text-[#0F172A]">Notification Preferences</h3>
                    <p className="text-sm text-[#64748B] font-medium">Grouped alerts for trip updates, weather, and budget notifications</p>
                  </div>

                  <div className="space-y-4 divide-y divide-slate-100">
                    {[
                      { key: "reminders", title: "Trip Reminders", desc: "Push alerts before upcoming flight departures & hotel check-ins" },
                      { key: "budget", title: "Budget Limits", desc: "Instant notifications when expense logging nears budget cap" },
                      { key: "weather", title: "Severe Weather Advisories", desc: "Live weather alerts for active trip locations" },
                      { key: "statusUpdates", title: "Flight & Route Alerts", desc: "Real-time updates regarding gate changes & delays" },
                      { key: "marketing", title: "Promotional & Deals", desc: "Occasional emails regarding seasonal flight & hotel discounts" },
                    ].map((item, idx) => (
                      <div key={item.key} className={`flex items-center justify-between ${idx > 0 ? "pt-4" : ""}`}>
                        <div>
                          <h4 className="text-sm font-extrabold text-[#0F172A]">{item.title}</h4>
                          <p className="text-xs text-[#64748B] font-medium">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => handleNotifToggle(item.key)}
                          className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 cursor-pointer"
                          style={{ background: notifForm[item.key] ? "#06B6D4" : "#E2E8F0" }}
                        >
                          <div
                            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                            style={{ left: notifForm[item.key] ? "calc(100% - 22px)" : "2px" }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── TAB 5: REWARDS ── */}
              {activeTab === "rewards" && (
                <motion.div
                  key="rewards-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-[22px] font-black text-[#0F172A]">Rewards & Referrals Console</h3>
                    <p className="text-sm text-[#64748B] font-medium">Invite friends, scratch digital reward cards, and redeem discount coupons</p>
                  </div>

                  {/* Invite Code Bar */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Your Invite Code</span>
                      <span className="text-xl font-black text-cyan-600 font-mono tracking-wide">{referralStats.referralCode || profileUser?.referralCode || "TLP-SANJAI-5821"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(referralStats.referralCode || profileUser?.referralCode || "");
                          toast.success("Code copied!");
                        }}
                        className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Copy size={14} /> Copy
                      </button>
                      <button
                        onClick={() => {
                          const text = `Join TravelLoop using code: ${referralStats.referralCode || profileUser?.referralCode || "TLP-SANJAI-5821"}`;
                          if (navigator.share) navigator.share({ title: "TravelLoop", text });
                          else { navigator.clipboard.writeText(text); toast.success("Share text copied!"); }
                        }}
                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share2 size={14} /> Share
                      </button>
                    </div>
                  </div>

                  {/* Code Verification Box */}
                  {!referralStats.referralVerified && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Have a referral code?</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={enteredCode}
                          onChange={e => setEnteredCode(e.target.value.toUpperCase())}
                          placeholder="e.g. TLP-RAHUL-4821"
                          className="flex-1 h-10 px-4 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-[#0F172A] outline-none"
                        />
                        <button
                          onClick={handleVerifyReferral}
                          disabled={verifyState === "loading" || !enteredCode.trim()}
                          className="h-10 px-5 rounded-xl bg-cyan-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                        >
                          {verifyState === "loading" ? "Verifying..." : "Verify"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rewards Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Invites</span>
                      <span className="text-xl font-black text-[#0F172A]">{referralStats.totalInvites}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Bookings</span>
                      <span className="text-xl font-black text-[#0F172A]">{referralStats.successfulBookings}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Coins Earned</span>
                      <span className="text-xl font-black text-cyan-600">{referralStats.coinsEarned} 🪙</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Discount Saved</span>
                      <span className="text-xl font-black text-cyan-600">₹{referralStats.discountEarned || 0}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── TAB 6: ABOUT ── */}
              {activeTab === "about" && (
                <motion.div
                  key="about-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <AboutSection />
                </motion.div>
              )}

            </AnimatePresence>

          </div>

        </div>

      </div>

      {/* ── LOGOUT MODAL ── */}
      <AnimatePresence>
        {logoutSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLogoutSheet(false)} className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[999] bg-white rounded-t-[32px] p-6 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <LogOut size={24} />
              </div>
              <h3 className="text-lg font-black text-[#0F172A]">Sign Out of TravelLoop?</h3>
              <p className="text-xs text-[#64748B] mt-1 font-medium">You will need to sign back in to access your itineraries and saved places.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setLogoutSheet(false)} className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs">Cancel</button>
                <button onClick={handleLogout} className="flex-1 py-3.5 rounded-xl bg-rose-500 text-white font-extrabold text-xs shadow-md">Sign Out</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ALL BADGES MODAL ── */}
      <AnimatePresence>
        {showAllBadgesModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAllBadgesModal(false)} className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed inset-x-4 top-[15%] z-[999] max-w-2xl mx-auto bg-white rounded-[28px] p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-500" />
                  <h3 className="text-2xl font-black text-[#0F172A]">All Travel Achievements</h3>
                </div>
                <button onClick={() => setShowAllBadgesModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                {ALL_ACHIEVEMENTS.map((b, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1.5">
                    <span className="text-3xl">{b.emoji}</span>
                    <h4 className="text-xs font-black text-[#0F172A]">{b.label}</h4>
                    <p className="text-[10px] text-[#64748B] font-medium">{b.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Scratch Card Modal Overlay */}
      <ScratchCardModal isOpen={showScratchModal} onClose={() => setShowScratchModal(false)} card={selectedCard} onClaimed={fetchReferralStats} />

      {/* Coupon Details Modal Overlay */}
      <CouponDetailsModal isOpen={showCouponModal} onClose={() => { setShowCouponModal(false); setSelectedProfileCoupon(null); }} coupon={selectedProfileCoupon} />
    </MainLayout>
  );
};

export default Profile;
