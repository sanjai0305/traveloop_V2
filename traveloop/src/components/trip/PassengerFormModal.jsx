import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Phone, AlertCircle, ChevronLeft, ChevronRight,
  Armchair, ShieldCheck, Lock, Heart, CheckCircle2, Loader2, Bus
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const GENDER_OPTIONS = ["Male", "Female", "Other"];

const emptyPassenger = (seatNumber) => ({
  seatNumber,
  name: "",
  age: "",
  gender: "Male",
  phone: "",
  email: "",
  emergencyContact: "",
  emergencyOption: "custom",
});

const PassengerFormModal = ({
  selectedSeats,
  trip,
  onConfirm,
  onClose,
  onBack,
}) => {
  const { user } = useAuth();

  const getInitialPassenger = (seat, i) => {
    const empty = emptyPassenger(seat);
    if (i === 0 && user) {
      const primaryPhone = user.phoneNumber || user.primaryMobile || user.phone || "";
      const alternatePhone = user.alternateNumber || user.alternateMobile || "";
      let defaultEmergencyOpt = "custom";
      let defaultEmergencyVal = user.emergencyContact || "";

      if (primaryPhone) {
        defaultEmergencyOpt = "primary";
        defaultEmergencyVal = primaryPhone;
      }

      return {
        ...empty,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email || "",
        phone: primaryPhone,
        gender: user.gender || "Male",
        age: user.age || "",
        emergencyOption: defaultEmergencyOpt,
        emergencyContact: defaultEmergencyVal,
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

  useEffect(() => {
    if (user) {
      setPassengers(prev =>
        prev.map((p, i) => {
          if (i === 0) {
            const primaryPhone = user.phoneNumber || user.primaryMobile || user.phone || "";
            const alternatePhone = user.alternateNumber || user.alternateMobile || "";
            const emergencyOpt = p.emergencyOption === "custom" && !p.emergencyContact ? (primaryPhone ? "primary" : "custom") : p.emergencyOption;
            let emergencyVal = p.emergencyContact;
            if (emergencyOpt === "primary") emergencyVal = primaryPhone;
            if (emergencyOpt === "alternate") emergencyVal = alternatePhone;

            return {
              ...p,
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
              email: user.email || "",
              phone: primaryPhone,
              gender: p.gender || user.gender || "Male",
              age: p.age || user.age || "",
              emergencyOption: emergencyOpt,
              emergencyContact: emergencyVal,
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

  const handleEmergencyOptionChange = (option) => {
    const primaryPhone = user?.phoneNumber || user?.primaryMobile || user?.phone || "";
    const alternatePhone = user?.alternateNumber || user?.alternateMobile || "";
    let val = "";
    if (option === "primary") val = primaryPhone;
    else if (option === "alternate") val = alternatePhone;
    else val = "";

    setPassengers((prev) => {
      const next = [...prev];
      next[currentIdx] = {
        ...next[currentIdx],
        emergencyOption: option,
        emergencyContact: val,
      };
      return next;
    });
    setErrors((prev) => ({ ...prev, emergencyContact: "" }));
  };

  const validateCurrent = () => {
    const errs = {};
    if (!current.name?.trim()) errs.name = "Passenger name is required";
    if (!current.age || Number(current.age) < 1 || Number(current.age) > 120)
      errs.age = "Valid age (1–120) is required";
    if (!current.gender) errs.gender = "Gender is required";

    if (!currentIdx === 0) {
      if (!current.phone?.trim() || !/^\d{10}$/.test(current.phone.trim()))
        errs.phone = "Valid 10-digit phone number is required";
      if (!current.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.email.trim()))
        errs.email = "Valid email address is required";
    }

    if (!current.emergencyContact?.trim() || !/^\d{10}$/.test(current.emergencyContact.trim()))
      errs.emergencyContact = "Valid 10-digit emergency contact is required";

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
      ...p,
      age: Number(p.age),
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
              <span className="ml-auto flex items-center gap-1 text-[10px] font-black text-teal-400">
                <ShieldCheck size={12} />
                Verified ✓
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

            {/* Email (Pre-filled readonly for primary) */}
            {isPrimary ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wide">
                    Email Address
                  </label>
                  <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-0.5 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                    Verified ✓
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={current.email}
                    disabled
                    readOnly
                    className={inputClass("email", true)}
                  />
                  <Lock size={12} className="absolute right-3.5 top-3.5 text-slate-500" />
                </div>
              </div>
            ) : null}

            {/* Primary Mobile (Pre-filled readonly for primary) */}
            {isPrimary ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wide">
                    Primary Mobile Number
                  </label>
                  <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-0.5 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                    Verified ✓
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    value={current.phone}
                    disabled
                    readOnly
                    className={inputClass("phone", true)}
                  />
                  <Lock size={12} className="absolute right-3.5 top-3.5 text-slate-500" />
                </div>
              </div>
            ) : null}

            {/* Emergency Contact */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Heart size={10} className="text-rose-400" /> Emergency Contact *
              </label>

              {/* Selector Tabs */}
              <div className="flex gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => handleEmergencyOptionChange("primary")}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                    current.emergencyOption === "primary"
                      ? "bg-teal-500 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Primary
                </button>
                {user?.alternateNumber || user?.alternateMobile ? (
                  <button
                    type="button"
                    onClick={() => handleEmergencyOptionChange("alternate")}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                      current.emergencyOption === "alternate"
                        ? "bg-teal-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Alternate
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleEmergencyOptionChange("custom")}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                    current.emergencyOption === "custom"
                      ? "bg-teal-500 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Input field */}
              <input
                type="tel"
                value={current.emergencyContact}
                onChange={(e) => update("emergencyContact", e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={current.emergencyOption !== "custom"}
                placeholder="Emergency contact number"
                className={inputClass("emergencyContact", current.emergencyOption !== "custom")}
              />
              {errors.emergencyContact && (
                <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.emergencyContact}
                </p>
              )}
            </div>
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
