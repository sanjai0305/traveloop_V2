/**
 * UPIPaymentModal.jsx — UPI Payment Flow with QR + Deep Links
 *
 * - Generates UPI intent string: upi://pay?pa=traveloop@upi&pn=TravelLoop&am=...&tn=...
 * - Renders QR code via qrcode.react
 * - One-tap deep links for Google Pay, PhonePe, Paytm, BHIM
 * - Status polling every 3s → /api/payment/status/:bookingId
 * - On success: calls onSuccess(bookingId)
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  X, CheckCircle2, XCircle, Loader2, RefreshCw, Clock,
  Smartphone, Zap, ExternalLink, AlertTriangle, Info, CreditCard
} from "lucide-react";
import { getApiUrl } from "../../utils/api";

// ─── UPI APP CONFIG ───────────────────────────────────────────────────────────

const UPI_VPA = import.meta.env.VITE_UPI_VPA || "traveloop@upi";
const PAYEE_NAME = "TravelLoop";
const POLL_INTERVAL = 3000; // 3 seconds

const UPI_APPS = [
  {
    id: "gpay",
    name: "Google Pay",
    emoji: "G",
    gradient: "from-blue-500 to-blue-700",
    scheme: (upiString) => upiString.replace("upi://", "tez://"),
    fallback: "https://pay.google.com",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    emoji: "P",
    gradient: "from-purple-500 to-purple-700",
    scheme: (upiString) => upiString.replace("upi://", "phonepe://"),
    fallback: "https://www.phonepe.com",
  },
  {
    id: "paytm",
    name: "Paytm",
    emoji: "₱",
    gradient: "from-sky-400 to-sky-600",
    scheme: (upiString) => upiString.replace("upi://", "paytmmp://"),
    fallback: "https://paytm.com",
  },
  {
    id: "bhim",
    name: "BHIM",
    emoji: "B",
    gradient: "from-orange-500 to-orange-700",
    scheme: (upiString) => `bhim://pay?${upiString.split("?")[1]}`,
    fallback: "https://www.bhimupi.org.in",
  },
];

// ─── BUILD UPI INTENT STRING ──────────────────────────────────────────────────

const buildUPIString = (amount, bookingRef, tripTitle) => {
  const note = encodeURIComponent(`Bus Seat Booking - ${bookingRef || "TravelLoop"}`);
  const name = encodeURIComponent(PAYEE_NAME);
  return `upi://pay?pa=${UPI_VPA}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const UPIPaymentModal = ({
  booking,       // { bookingId, tripTitle, totalAmount }
  passengers,    // PassengerData[]
  trip,
  onSuccess,     // (bookingId: string) => void
  onCancel,      // () => void — releases seats
  onClose,
}) => {
  const [phase, setPhase] = useState("qr"); // "qr" | "polling" | "success" | "failed"
  const [pollCount, setPollCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const amount = booking?.totalAmount || 0;
  const bookingRef = booking?.bookingId || "BOOK";
  const tripTitle = trip?.title || booking?.tripTitle || "Bus Trip";

  const upiString = buildUPIString(amount, bookingRef, tripTitle);

  // ── Countdown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase("failed");
          setError("Payment session expired. Your seats have been released.");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Payment status polling ──────────────────────────────────────────────────
  const startPolling = () => {
    if (pollRef.current) return;
    setPhase("polling");

    pollRef.current = setInterval(async () => {
      setPollCount((c) => c + 1);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          getApiUrl(`payment/status/${booking?._id || bookingRef}`),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();

        if (data.success) {
          const status = (data.status || data.booking?.paymentStatus || "").toUpperCase();
          if (status === "PAID" || status === "COMPLETED") {
            clearInterval(pollRef.current);
            clearInterval(timerRef.current);
            setPhase("success");
            setTimeout(() => onSuccess(booking?.bookingId || bookingRef), 1500);
          } else if (status === "FAILED" || status === "CANCELLED") {
            clearInterval(pollRef.current);
            setPhase("failed");
            setError("Payment failed or was cancelled.");
          }
        }
      } catch (err) {
        // Network error — continue polling
      }
    }, POLL_INTERVAL);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
      clearInterval(timerRef.current);
    };
  }, []);

  // ── Manual confirmation (for UPI QR — user confirms they paid) ─────────────
  const handleManualConfirm = async () => {
    setConfirming(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("payment/confirm-manual"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking?._id || bookingRef,
          paymentMethod: "upi_qr",
          transactionId: `UPI-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        stopPolling();
        clearInterval(timerRef.current);
        setPhase("success");
        setTimeout(() => onSuccess(booking?.bookingId || bookingRef), 1500);
      } else {
        setError(data.message || "Could not confirm payment.");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const handleAppOpen = (app) => {
    const deepLink = app.scheme(upiString);
    window.location.href = deepLink;
    // Start polling after app redirect
    setTimeout(startPolling, 3000);
  };

  const handleCancel = () => {
    stopPolling();
    clearInterval(timerRef.current);
    onCancel();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
      >
        {/* Success overlay */}
        <AnimatePresence>
          {phase === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Payment Confirmed!</h3>
                <p className="text-xs text-slate-500 mt-1">Generating your QR ticket…</p>
              </div>
              <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard size={16} className="text-teal-500" />
              Complete Payment
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{tripTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

          {/* Amount card */}
          <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-[11px] font-bold opacity-80 uppercase tracking-wide">Total Amount</p>
            <p className="text-3xl font-black mt-1">₹{amount.toLocaleString("en-IN")}</p>
            <p className="text-[11px] opacity-80 mt-1">
              {passengers?.length} passenger{(passengers?.length || 1) > 1 ? "s" : ""} ·{" "}
              {passengers?.map((p) => p.seatNumber).join(", ")}
            </p>
            {/* Countdown */}
            <div className="flex items-center gap-1.5 mt-3 bg-white/20 rounded-xl px-2.5 py-1.5 w-fit">
              <Clock size={10} />
              <span className="text-[10px] font-black">
                Session expires in {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Passenger summary */}
          {passengers && passengers.length > 0 && (
            <div className="space-y-1.5">
              {passengers.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                      p.gender === "Female" ? "bg-pink-400" : "bg-sky-400"
                    }`}
                  >
                    {p.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.gender} · {p.age} yrs</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[10px] font-black border border-teal-200 dark:border-teal-800">
                    {p.seatNumber}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-semibold">
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {phase === "failed" ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-white">Payment Failed</p>
              <button
                onClick={() => { setPhase("qr"); setError(null); setTimeLeft(600); }}
                className="px-6 py-2.5 rounded-xl bg-teal-500 text-white font-black text-xs flex items-center gap-1.5 mx-auto"
              >
                <RefreshCw size={12} /> Try Again
              </button>
            </div>
          ) : (
            <>
              {/* UPI QR Code */}
              <div className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide">Scan with any UPI App</p>
                <div className="p-2 bg-white rounded-xl shadow-inner border border-slate-100">
                  <QRCodeSVG
                    value={upiString}
                    size={160}
                    level="H"
                    includeMargin
                    fgColor="#0f172a"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-medium">UPI ID</p>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200">{UPI_VPA}</p>
                </div>
              </div>

              {/* Quick Pay Apps */}
              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Smartphone size={10} /> Quick Pay
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleAppOpen(app)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-gradient-to-b ${app.gradient} text-white shadow-md active:scale-95 transition-all`}
                    >
                      <span className="text-base font-black">{app.emoji}</span>
                      <span className="text-[9px] font-black leading-none">{app.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Polling indicator */}
              {phase === "polling" && (
                <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[11px] font-black">
                    Waiting for payment confirmation… (check #{pollCount})
                  </span>
                </div>
              )}

              {/* Manual confirm */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2 mb-2">
                  <Info size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                    Already paid via UPI? Click below to confirm your booking.
                  </p>
                </div>
                <button
                  onClick={handleManualConfirm}
                  disabled={confirming}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-black text-[11px] flex items-center justify-center gap-1.5 active:scale-98"
                >
                  {confirming ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                  {confirming ? "Verifying…" : "I've Paid — Confirm Booking"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleCancel}
            className="w-full py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 font-black text-xs hover:border-rose-300 hover:text-rose-500 transition-colors"
          >
            Cancel & Release Seats
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UPIPaymentModal;
