/**
 * PassengerFormModal.jsx — Per-Seat Passenger Details Form
 *
 * - One form per selected seat
 * - Seat number auto-filled (read-only)
 * - Fields: Name, Age, Gender, Phone, Emergency Contact, Seat Preference, Special Request
 * - Pagination: Previous / Next passenger
 * - Final step: "Proceed to Payment" CTA
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Phone, AlertCircle, ChevronLeft, ChevronRight,
  Armchair, MessageSquare, Heart, CheckCircle2, Loader2, Bus
} from "lucide-react";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const SEAT_PREFERENCE_OPTIONS = ["Window", "Aisle", "No Preference"];

const emptyPassenger = (seatNumber) => ({
  seatNumber,
  name: "",
  age: "",
  gender: "Male",
  phone: "",
  emergencyContact: "",
  seatPreference: "No Preference",
  specialRequest: "",
});

const PassengerFormModal = ({
  selectedSeats,     // string[] e.g. ["A1", "A2"]
  trip,
  onConfirm,         // (passengers: PassengerData[]) => void
  onClose,
  onBack,            // go back to seat selection
}) => {
  const [passengers, setPassengers] = useState(() =>
    selectedSeats.map((seat) => emptyPassenger(seat))
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Sync if selectedSeats changes
  useEffect(() => {
    setPassengers(selectedSeats.map((seat, i) => passengers[i] || emptyPassenger(seat)));
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
    if (!current.name?.trim()) errs.name = "Passenger name is required";
    if (!current.age || Number(current.age) < 1 || Number(current.age) > 120)
      errs.age = "Valid age (1–120) is required";
    if (!current.gender) errs.gender = "Gender is required";
    if (!current.phone?.trim() || !/^\d{10}$/.test(current.phone.trim()))
      errs.phone = "Valid 10-digit phone number is required";
    if (!current.emergencyContact?.trim())
      errs.emergencyContact = "Emergency contact is required";
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
    // Normalize types
    const normalized = passengers.map((p) => ({
      ...p,
      age: Number(p.age),
    }));
    onConfirm(normalized);
  };

  const inputClass = (field) =>
    `w-full px-3.5 py-3 rounded-xl text-xs font-semibold border transition-all duration-150 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 ${
      errors[field]
        ? "border-rose-400 focus:ring-rose-300 dark:focus:ring-rose-800"
        : "border-slate-200 dark:border-slate-700 focus:ring-teal-300 dark:focus:ring-teal-800 focus:border-teal-400"
    }`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 pt-5 pb-4 rounded-t-3xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <User size={16} className="text-teal-500" />
                Passenger {currentIdx + 1} of {passengers.length}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Seat <span className="font-black text-teal-500">{current.seatNumber}</span> · {trip.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>

          {/* Step dots */}
          <div className="flex gap-1.5 items-center">
            {passengers.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < currentIdx
                    ? "bg-teal-500"
                    : i === currentIdx
                    ? "bg-blue-500"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 px-5 py-4 space-y-4"
          >
            {/* Seat badge */}
            <div className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
              <Bus size={14} className="text-teal-500" />
              <span className="text-xs font-black text-teal-700 dark:text-teal-300">
                Seat {current.seatNumber} — Auto Assigned
              </span>
              <span className="ml-auto px-2 py-0.5 rounded-lg bg-teal-500 text-white text-[10px] font-extrabold">RESERVED</span>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Passenger Name *
              </label>
              <input
                type="text"
                value={current.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Full name as on ID"
                className={inputClass("name")}
              />
              {errors.name && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.name}
                </p>
              )}
            </div>

            {/* Age + Gender row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
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
                  <p className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.age}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Gender *
                </label>
                <div className="flex gap-1.5">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update("gender", g)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black border-2 transition-all ${
                        current.gender === g
                          ? g === "Male"
                            ? "bg-sky-500 border-sky-600 text-white"
                            : g === "Female"
                            ? "bg-pink-500 border-pink-600 text-white"
                            : "bg-slate-500 border-slate-600 text-white"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {g === "Male" ? "♂" : g === "Female" ? "♀" : "⚪"} {g.slice(0, 1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Phone Number *
              </label>
              <div className="flex gap-2">
                <span className="px-3 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 flex items-center">
                  +91
                </span>
                <input
                  type="tel"
                  value={current.phone}
                  onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className={`flex-1 ${inputClass("phone")}`}
                />
              </div>
              {errors.phone && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.phone}
                </p>
              )}
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Heart size={10} className="text-rose-400" /> Emergency Contact *
              </label>
              <input
                type="tel"
                value={current.emergencyContact}
                onChange={(e) => update("emergencyContact", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Emergency contact number"
                className={inputClass("emergencyContact")}
              />
              {errors.emergencyContact && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.emergencyContact}
                </p>
              )}
            </div>

            {/* Seat Preference */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Armchair size={10} /> Seat Preference
              </label>
              <div className="flex gap-2">
                {SEAT_PREFERENCE_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => update("seatPreference", p)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all ${
                      current.seatPreference === p
                        ? "bg-teal-500 border-teal-600 text-white"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    {p === "Window" ? "🪟" : p === "Aisle" ? "🚶" : "✓"} {p === "No Preference" ? "Any" : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Request */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <MessageSquare size={10} /> Special Request
                <span className="text-slate-300 font-normal">(optional)</span>
              </label>
              <textarea
                value={current.specialRequest}
                onChange={(e) => update("specialRequest", e.target.value)}
                placeholder="Dietary needs, wheelchair, extra luggage…"
                rows={2}
                className={`${inputClass("specialRequest")} resize-none`}
              />
            </div>

            {/* Summary preview */}
            {current.name && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Preview</p>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">{current.name}</p>
                <p className="text-[11px] text-slate-500">
                  {current.age && `Age ${current.age}`}
                  {current.gender && ` · ${current.gender}`}
                  {` · Seat ${current.seatNumber}`}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 pb-6 pt-3 flex gap-2">
          <button
            onClick={isFirst ? onBack : handlePrev}
            className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs flex items-center justify-center gap-1.5 hover:border-slate-300 transition-colors"
          >
            <ChevronLeft size={14} />
            {isFirst ? "Change Seats" : "Previous"}
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/30 active:scale-98 transition-all"
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
              className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/30 active:scale-98"
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
