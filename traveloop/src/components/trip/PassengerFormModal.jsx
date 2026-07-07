import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Phone, AlertCircle, ChevronLeft, ChevronRight,
  Armchair, ShieldCheck, Lock, Heart, CheckCircle2, Loader2, Bus
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../mobile/MobileToast";
import { getApiUrl } from "../../utils/api";

const GENDER_OPTIONS = ["Male", "Female"];

const emptyPassenger = (seatNumber) => ({
  seatNumber,
  name: "",
  age: "",
  gender: "Male",
  bookingForOthers: false,
  travelerPhone: "",
  travelerPhoneVerified: false,
  verifiedAt: null,
});

const PassengerFormModal = ({
  selectedSeats,
  trip,
  onConfirm,
  onClose,
  onBack,
}) => {
  const { user, login } = useAuth();
  const toast = useToast();

  const getInitialPassenger = (seat, i) => {
    const empty = emptyPassenger(seat);
    if (i === 0 && user) {
      return {
        ...empty,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        gender: user.gender || "Male",
        age: user.age || "",
        bookingForOthers: false,
        travelerPhone: user.phone || user.phoneNumber || user.primaryMobile || "",
        travelerPhoneVerified: !!(user.phoneVerified || user.primaryVerified),
        verifiedAt: (user.phoneVerified || user.primaryVerified) ? new Date().toISOString() : null,
      };
    }
    return empty;
  };

  const [passengers, setPassengers] = useState(() =>
    selectedSeats.map((seat, i) => getInitialPassenger(seat, i))
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [modalOtpSending, setModalOtpSending] = useState(false);
  const [modalOtpSent, setModalOtpSent] = useState(false);
  const [modalOtpCode, setModalOtpCode] = useState("");
  const [modalOtpVerifying, setModalOtpVerifying] = useState(false);
  const [modalConfirmationResult, setModalConfirmationResult] = useState(null);
  const [modalOtpTimer, setModalOtpTimer] = useState(0);
  const modalOtpTimerRef = useRef(null);

  const startModalOtpTimer = () => {
    if (modalOtpTimerRef.current) clearInterval(modalOtpTimerRef.current);
    setModalOtpTimer(60);
    modalOtpTimerRef.current = setInterval(() => {
      setModalOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(modalOtpTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendModalOtp = async (phone) => {
    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit mobile number starting with 6-9");
      return;
    }
    setModalOtpSending(true);
    try {
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      const { auth } = await import("../../services/firebase");

      if (!window.modalRecaptchaVerifier) {
        window.modalRecaptchaVerifier = new RecaptchaVerifier(auth, "modal-recaptcha-container", {
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
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.modalRecaptchaVerifier);
      setModalConfirmationResult(confirmationResult);
      setModalOtpSent(true);
      startModalOtpTimer();
      toast.success("Verification SMS sent successfully!");
    } catch (err) {
      console.error("Firebase SMS send failure:", err);
      toast.error(err.message || "Failed to send verification SMS.");
    } finally {
      setModalOtpSending(false);
    }
  };

  const handleVerifyModalOtp = async (code, phone) => {
    if (!code || code.length < 6) {
      toast.error("Please enter a 6-digit OTP code");
      return;
    }
    setModalOtpVerifying(true);
    try {
      if (!modalConfirmationResult) {
        throw new Error("No active phone verification session found.");
      }
      const result = await modalConfirmationResult.confirm(code);
      const idToken = await result.user.getIdToken();

      // If bookingForOthers is FALSE, we verify and sync the account owner's phone to their profile!
      if (!current.bookingForOthers) {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl("user/verify-phone"), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ phone, idToken, isAlternate: false })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Verification sync failed on server.");
        }
        // Update user context
        const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const mergedUser = { ...cachedUser, ...data.user };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        login(mergedUser, token);
      }

      update("travelerPhone", phone);
      update("travelerPhoneVerified", true);
      update("verifiedAt", new Date().toISOString());

      setModalOtpSent(false);
      setModalOtpCode("");
      toast.success("Mobile number verified successfully!");
    } catch (err) {
      console.error("OTP verification failure:", err);
      toast.error(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setModalOtpVerifying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (modalOtpTimerRef.current) clearInterval(modalOtpTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setPassengers(prev =>
        prev.map((p, i) => {
          if (i === 0) {
            const isBookingForOthers = p.bookingForOthers || false;
            const isPhoneVerified = p.travelerPhoneVerified !== undefined 
              ? p.travelerPhoneVerified 
              : (isBookingForOthers ? false : (user.phoneVerified || user.primaryVerified || false));
            return {
              ...p,
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
              gender: p.gender || user.gender || "Male",
              age: p.age || user.age || "",
              bookingForOthers: isBookingForOthers,
              travelerPhone: p.travelerPhone || (isBookingForOthers ? "" : (user.phone || user.phoneNumber || user.primaryMobile || "")),
              travelerPhoneVerified: isPhoneVerified,
              verifiedAt: p.verifiedAt || ((user.phoneVerified || user.primaryVerified) ? new Date().toISOString() : null),
            };
          }
          return p;
        })
      );
    }
  }, [user]);

  useEffect(() => {
    setPassengers(selectedSeats.map((seat, i) => passengers[i] || getInitialPassenger(seat, i)));
  }, [selectedSeats]);

  const current = passengers[currentIdx] || {};
  const isLast = currentIdx === passengers.length - 1;
  const isFirst = currentIdx === 0;

  const update = (field, value) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], [field]: value };
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateCurrent = () => {
    const errs = {};
    if (!current.name?.trim() || current.name.trim().length < 3) {
      errs.name = "Passenger name must be at least 3 characters";
    }
    const ageNum = Number(current.age);
    if (!current.age || isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
      errs.age = "Valid age (1–100) is required";
    }
    if (!current.gender) {
      errs.gender = "Gender is required";
    }

    const isVerified = current.bookingForOthers
      ? current.travelerPhoneVerified
      : (user?.phoneVerified || user?.primaryVerified || current.travelerPhoneVerified);

    if (!isVerified) {
      toast.error("Mobile number verification is mandatory before proceeding");
      return false;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrent()) return;
    setCurrentIdx((i) => i + 1);
    setErrors({});
  };

  const handlePrev = () => {
    setCurrentIdx((i) => i - 1);
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validateCurrent()) return;
    setSubmitting(true);
    const normalized = passengers.map((p) => ({
      name: p.name,
      passengerName: p.name,
      age: Number(p.age),
      gender: p.gender,
      seatNumber: p.seatNumber,
      accountEmail: user?.email || "",
      travelerPhone: p.travelerPhone || user?.phone || user?.phoneNumber || user?.primaryMobile || "",
      travelerPhoneVerified: p.travelerPhoneVerified !== undefined ? p.travelerPhoneVerified : (user?.phoneVerified || user?.primaryVerified || false),
      bookingForOthers: p.bookingForOthers || false,
      verifiedAt: p.verifiedAt || (user?.phoneVerified || user?.primaryVerified ? new Date().toISOString() : null),
      // legacy fallback mapping
      phone: p.travelerPhone || user?.phone || user?.phoneNumber || user?.primaryMobile || "",
      email: user?.email || "",
      contactEmail: user?.email || "",
      contactPhone: p.travelerPhone || user?.phone || user?.phoneNumber || user?.primaryMobile || "",
      emailVerified: true,
      phoneVerified: p.travelerPhoneVerified !== undefined ? p.travelerPhoneVerified : (user?.phoneVerified || user?.primaryVerified || false),
    }));
    onConfirm(normalized);
  };

  const inputClass = (field, disabled = false) =>
    `w-full px-3.5 py-3 rounded-xl text-xs font-semibold border transition-all duration-150 outline-none focus:ring-2 ${
      disabled
        ? "bg-slate-100 dark:bg-slate-800/60 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"
        : "bg-white dark:bg-slate-800 text-slate-850 dark:text-slate-200 placeholder:text-slate-400"
    } ${
      errors[field]
        ? "border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800"
        : "border-slate-200 dark:border-slate-700 focus:ring-teal-300 dark:focus:ring-teal-800 focus:border-teal-400"
    }`;

  const isPrimary = currentIdx === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col text-white"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-white/5 px-5 pt-5 pb-4 rounded-t-3xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <User size={16} className="text-teal-400" />
                Passenger {currentIdx + 1} of {passengers.length}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Seat <span className="font-black text-teal-450">{current.seatNumber}</span> · {trip.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex gap-1.5 items-center">
            {passengers.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < currentIdx
                    ? "bg-teal-500"
                    : i === currentIdx
                    ? "bg-teal-400"
                    : "bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Selected Seat Chips */}
        <div className="flex flex-wrap gap-2 px-5 py-3 bg-slate-950/40 border-b border-white/5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide flex items-center mr-1">
            Allocations:
          </span>
          {selectedSeats.map((seat, i) => (
            <button
              key={seat}
              type="button"
              onClick={() => {
                if (i <= currentIdx || validateCurrent()) {
                  setCurrentIdx(i);
                  setErrors({});
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black border flex items-center gap-1 transition-all ${
                i === currentIdx
                  ? "bg-teal-500 border-teal-600 text-slate-950 shadow-sm shadow-teal-500/20"
                  : i < currentIdx
                  ? "bg-teal-500/10 border-teal-500/20 text-teal-400"
                  : "bg-slate-850 border-slate-800 text-slate-500"
              }`}
            >
              <Armchair size={10} />
              {seat}
              {i < currentIdx && <span className="text-[8px]">✓</span>}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 px-5 py-4 space-y-4"
          >
            {/* Seat assignment status badge */}
            <div className="flex items-center gap-2 p-3 bg-teal-500/10 rounded-xl border border-teal-500/20">
              <Bus size={14} className="text-teal-450" />
              <span className="text-xs font-black text-teal-300">
                Seat {current.seatNumber} Assigned
              </span>
            </div>

            {/* Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wide">
                  Passenger Name *
                </label>
                {isPrimary && (
                  <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-0.5">
                    <ShieldCheck size={10} /> Profile Linked
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={current.name}
                  onChange={(e) => update("name", e.target.value)}
                  disabled={isPrimary}
                  readOnly={isPrimary}
                  placeholder="Full name as on ID"
                  className={inputClass("name", isPrimary)}
                />
                {isPrimary && <Lock size={12} className="absolute right-3.5 top-3.5 text-slate-500" />}
              </div>
              {errors.name && (
                <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.name}
                </p>
              )}
            </div>

            {/* Age + Gender row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1.5">
                  Age *
                </label>
                <input
                  type="number"
                  value={current.age}
                  onChange={(e) => update("age", e.target.value)}
                  placeholder="e.g. 24"
                  min="1"
                  max="120"
                  className={inputClass("age")}
                />
                {errors.age && (
                  <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.age}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1.5">
                  Gender *
                </label>
                <select
                  value={current.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className={inputClass("gender")}
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g} className="bg-slate-900 text-white">
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Booking For Someone Else Toggle */}
            <div className="flex items-center justify-between bg-slate-900 border border-white/5 rounded-2xl px-4 py-3">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-200">Booking For Someone Else</span>
                <span className="text-[9px] text-slate-400">Specify if someone else is travelling</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = !current.bookingForOthers;
                  update("bookingForOthers", newVal);
                  update("travelerPhone", newVal ? "" : (user?.phone || user?.phoneNumber || user?.primaryMobile || ""));
                  update("travelerPhoneVerified", newVal ? false : (user?.phoneVerified || user?.primaryVerified || false));
                  setModalOtpSent(false);
                  setModalOtpCode("");
                }}
                className="relative w-10 h-6 rounded-full transition-colors shrink-0"
                style={{ background: current.bookingForOthers ? "#14B8B5" : "#E2E8F0" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                  style={{ left: current.bookingForOthers ? "18px" : "2px" }}
                />
              </button>
            </div>

            {/* Contact Verification Cards */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-4.5 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-1 flex items-center gap-1.5">
                📞 Traveler Contact Details
              </p>

              {!current.bookingForOthers ? (
                /* Booking for Self */
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Email Address</label>
                    <div className="w-full px-4 py-3 rounded-xl border border-white/5 bg-slate-950 text-xs font-bold text-slate-500 select-none flex justify-between items-center">
                      <span>{user?.email || "No email available"}</span>
                      <span className="text-[9px] font-black text-teal-400 tracking-wider">✓ Verified</span>
                    </div>
                  </div>

                  {user?.phoneVerified || user?.primaryVerified ? (
                    /* Scenario 2: Returning traveler (Verified) */
                    <div>
                      <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Mobile Number</label>
                      <div className="w-full px-4 py-3 rounded-xl border border-white/5 bg-slate-950 text-xs font-bold text-slate-500 select-none flex justify-between items-center">
                        <span>{user?.phone || user?.phoneNumber || user?.primaryMobile}</span>
                        <span className="text-[9px] font-black text-teal-400 tracking-wider">✓ Verified</span>
                      </div>
                    </div>
                  ) : (
                    /* Scenario 1: First-time traveler (Unverified) */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Mobile Number</label>
                        <input
                          type="tel"
                          value={current.travelerPhone || ""}
                          onChange={(e) => update("travelerPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="Enter 10-digit number"
                          disabled={current.travelerPhoneVerified}
                          className="w-full px-4 py-3 rounded-xl border border-white/5 bg-slate-950 text-xs font-bold text-white outline-none focus:border-teal-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      {current.travelerPhoneVerified ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold flex items-center justify-between">
                          <span>✓ Mobile Verified</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {!modalOtpSent ? (
                            <button
                              type="button"
                              onClick={() => handleSendModalOtp(current.travelerPhone)}
                              disabled={modalOtpSending || !current.travelerPhone || current.travelerPhone.length !== 10}
                              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-955 font-black text-xs transition-all disabled:opacity-50"
                            >
                              {modalOtpSending ? "Sending OTP..." : "Verify Mobile Number"}
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                maxLength="6"
                                value={modalOtpCode}
                                onChange={(e) => setModalOtpCode(e.target.value.replace(/\D/g, ""))}
                                placeholder="Enter 6-digit OTP"
                                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-slate-950 text-center font-bold text-xs text-white outline-none focus:border-teal-400"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleVerifyModalOtp(modalOtpCode, current.travelerPhone)}
                                  disabled={modalOtpVerifying || modalOtpCode.length !== 6}
                                  className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-955 font-bold text-xs transition-all disabled:opacity-50"
                                >
                                  {modalOtpVerifying ? "Verifying..." : "Verify OTP"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setModalOtpSent(false)}
                                  className="px-3 py-2 rounded-xl border border-white/5 hover:border-white/10 text-slate-400 text-xs font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Booking for Others */
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Passenger Mobile Number</label>
                    <input
                      type="tel"
                      value={current.travelerPhone || ""}
                      onChange={(e) => update("travelerPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Enter Passenger Mobile"
                      disabled={current.travelerPhoneVerified}
                      className="w-full px-4 py-3 rounded-xl border border-white/5 bg-slate-950 text-xs font-bold text-white outline-none focus:border-teal-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {current.travelerPhoneVerified ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold flex items-center justify-between">
                      <span>✓ Verified</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {!modalOtpSent ? (
                        <button
                          type="button"
                          onClick={() => handleSendModalOtp(current.travelerPhone)}
                          disabled={modalOtpSending || !current.travelerPhone || current.travelerPhone.length !== 10}
                          className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-955 font-black text-xs transition-all disabled:opacity-50"
                        >
                          {modalOtpSending ? "Sending OTP..." : "Send OTP"}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            maxLength="6"
                            value={modalOtpCode}
                            onChange={(e) => setModalOtpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="Enter 6-digit OTP"
                            className="w-full px-4 py-3 rounded-xl border border-white/5 bg-slate-955 text-center font-bold text-xs text-white outline-none focus:border-teal-400"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleVerifyModalOtp(modalOtpCode, current.travelerPhone)}
                              disabled={modalOtpVerifying || modalOtpCode.length !== 6}
                              className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-955 font-bold text-xs transition-all disabled:opacity-50"
                            >
                              {modalOtpVerifying ? "Verifying..." : "Verify OTP"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalOtpSent(false)}
                              className="px-3 py-2 rounded-xl border border-white/5 hover:border-white/10 text-slate-400 text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div id="modal-recaptcha-container" className="hidden" />
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-white/5 px-4 pb-6 pt-3 flex gap-2">
          <button
            onClick={isFirst ? onBack : handlePrev}
            className="flex-1 py-3.5 rounded-2xl border-2 border-slate-700 text-slate-400 font-black text-xs flex items-center justify-center gap-1.5 hover:border-white transition-colors"
          >
            <ChevronLeft size={14} />
            {isFirst ? "Change Seats" : "Previous"}
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-[2] py-3.5 rounded-2xl bg-teal-500 text-slate-955 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 active:scale-98 transition-all"
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle2 size={14} /> Proceed to Payment</>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-[2] py-3.5 rounded-2xl bg-teal-500 text-slate-955 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 active:scale-98"
            >
              Next Passenger
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PassengerFormModal;
