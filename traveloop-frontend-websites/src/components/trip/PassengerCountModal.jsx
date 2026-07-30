/**
 * PassengerCountModal.jsx
 *
 * Step 0 of the booking flow presented before seat selection.
 * User selects how many passengers (1-10) are travelling.
 * Matches TravelLoop dark glassmorphism theme exactly.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Minus, Plus, ArrowRight, X, Armchair } from "lucide-react";

const MAX_PASSENGERS = 10;
const MIN_PASSENGERS = 1;

const PassengerCountModal = ({
  trip,
  onConfirm,   // (count: number) => void
  onClose,
}) => {
  const [count, setCount] = useState(1);

  const basePrice = trip?.offerPrice || trip?.pricePerPerson || 0;
  const subtotal  = basePrice * count;
  const gst       = Math.round(subtotal * 0.05);
  const fee       = 150;
  const total     = subtotal + gst + fee;

  const decrement = () => setCount((c) => Math.max(MIN_PASSENGERS, c - 1));
  const increment = () => setCount((c) => Math.min(MAX_PASSENGERS, c + 1));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4"
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 290 }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-teal-500/60 rounded-full blur-sm" />

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
              <Users size={18} className="text-teal-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">How many are travelling?</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Select passenger count (max {MAX_PASSENGERS})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="flex items-center justify-center gap-6">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={decrement}
              disabled={count <= MIN_PASSENGERS}
              className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all font-black text-xl ${count <= MIN_PASSENGERS ? "border-slate-800 text-slate-700 cursor-not-allowed" : "border-slate-700 text-slate-300 hover:border-teal-500 hover:text-teal-400 active:bg-teal-950/20"}`}
            >
              <Minus size={20} />
            </motion.button>

            <motion.div
              key={count}
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="flex flex-col items-center min-w-[72px]"
            >
              <span className="text-5xl font-black text-white leading-none">{count}</span>
              <span className="text-[11px] text-slate-400 font-bold mt-1.5">{count === 1 ? "Passenger" : "Passengers"}</span>
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={increment}
              disabled={count >= MAX_PASSENGERS}
              className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all font-black text-xl ${count >= MAX_PASSENGERS ? "border-slate-800 text-slate-700 cursor-not-allowed" : "border-teal-500 text-teal-400 hover:bg-teal-500/10 active:bg-teal-500/20"}`}
            >
              <Plus size={20} />
            </motion.button>
          </div>

          <div className="flex items-center justify-center gap-1.5 flex-wrap px-4">
            {Array.from({ length: MAX_PASSENGERS }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  backgroundColor: i < count ? "rgb(20 184 166 / 0.9)" : "rgb(51 65 85 / 0.5)",
                  borderColor: i < count ? "rgb(13 148 136)" : "rgb(51 65 85)",
                  scale: i < count ? 1 : 0.88,
                }}
                transition={{ duration: 0.18, delay: i * 0.03 }}
                className="w-7 h-7 rounded-lg border-2 flex items-center justify-center"
              >
                <Armchair size={12} className={i < count ? "text-white" : "text-slate-600"} />
              </motion.div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={count}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2 text-xs font-semibold"
            >
              <div className="flex justify-between text-slate-400">
                <span>Base fare</span>
                <span className="font-bold text-slate-300">
                  {basePrice > 0 ? `\u20b9${new Intl.NumberFormat("en-IN").format(basePrice)} \u00d7 ${count}` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (5%)</span>
                <span className="font-bold text-slate-300">{basePrice > 0 ? `\u20b9${new Intl.NumberFormat("en-IN").format(gst)}` : "—"}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience fee</span>
                <span className="font-bold text-slate-300">\u20b9150</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                <span className="text-slate-300 font-bold uppercase text-[10px] tracking-wider">Estimated Total</span>
                <span className="text-teal-400 font-black text-base">
                  {basePrice > 0 ? `\u20b9${new Intl.NumberFormat("en-IN").format(total)}` : "—"}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-[10px] text-slate-500 font-medium leading-relaxed px-2">
            {"You'll select seat numbers on the next screen.\nExactly "}
            <span className="text-teal-400 font-bold">{count}</span>
            {` seat${count !== 1 ? "s" : ""} must be chosen.`}
          </p>
        </div>

        <div className="px-6 pb-6 pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 24px), 24px)" }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onConfirm(count)}
            className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-extrabold text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2.5 transition-colors"
          >
            <Armchair size={16} />
            Continue to Seat Selection
            <ArrowRight size={15} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PassengerCountModal;
