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
import {
  X, CheckCircle2, XCircle, Loader2, RefreshCw, Clock,
  AlertTriangle, CreditCard, Bus
} from "lucide-react";
import { getApiUrl } from "../../utils/api";
import { useToast } from "../mobile/MobileToast";

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const UPIPaymentModal = ({
  booking,       // { bookingId, tripTitle, totalAmount }
  passengers,    // PassengerData[]
  trip,
  onSuccess,     // (bookingId: string) => void
  onCancel,      // () => void — releases seats
  onClose,
}) => {
  const toast = useToast();
  const [phase, setPhase] = useState("pending"); // "pending" | "polling" | "success" | "failed"
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [error, setError] = useState(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const timerRef = useRef(null);

  const amount = booking?.totalAmount || 0;
  const bookingRef = booking?.bookingId || "BOOK";
  const tripTitle = trip?.title || booking?.tripTitle || "Bus Trip";

  const upiString = buildUPIString(amount, bookingRef, tripTitle);
  const isMobile = /Android|iPhone/i.test(navigator.userAgent);

  const handleOpenRazorpay = async () => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK is not loaded yet. Please wait a moment.");
      return;
    }
    setRazorpayLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      
      // 1. Create Razorpay Order
      const res = await fetch(getApiUrl("payment/create-order"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId: trip._id,
          seats: passengers?.length || 1
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to initiate payment");
      }

      // 2. Configure Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummykeyid",
        amount: data.amount * 100, // paise
        currency: data.currency || "INR",
        name: "TravelLoop",
        description: `Bus Seat Reservation - ${tripTitle}`,
        order_id: data.orderId,
        handler: async (response) => {
          setPhase("polling");
          try {
            // 3. Verify Signature
            const verifyRes = await fetch(getApiUrl("payment/verify"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: booking?._id
              })
            });
            const verifyData = await verifyRes.json();
            console.log("API URL:", getApiUrl("payment/verify"));
            console.log("confirmEndpoint (deprecated):", getApiUrl("bookings/confirm"));
            console.log("response:", verifyData);

            if (verifyData.success) {
              setPhase("success");
              setTimeout(() => onSuccess(booking?.bookingId || bookingRef), 1500);
            } else {
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            setPhase("failed");
            setError(err.message || "Verification failed");
          }
        },
        prefill: {
          name: passengers?.[0]?.name || "",
          contact: passengers?.[0]?.phone || "",
        },
        theme: {
          color: "#14B8A6"
        },
        modal: {
          ondismiss: () => {
            setRazorpayLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setRazorpayLoading(false);
    }
  };

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

  const handleCancel = () => {
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
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
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
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 pt-5 pb-4 rounded-t-3xl flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard size={16} className="text-teal-500" />
              Complete Payment
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{tripTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">

          {/* Billing Summary Card */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-700">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Total Amount to Pay</span>
              <span className="text-xl font-black text-teal-600 dark:text-teal-400">₹{amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="space-y-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Journey Name:</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{tripTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Booking ID:</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">{bookingRef}</span>
              </div>
              <div className="flex justify-between">
                <span>Seats Reserved:</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">
                  {passengers?.map((p) => p.seatNumber).join(", ")}
                </span>
              </div>
            </div>
            {/* Session countdown */}
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl w-fit">
              <Clock size={10} className="text-red-500" />
              <span className="text-[10px] font-black text-red-550 dark:text-red-400">
                Session expires in {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Passenger Section */}
          {passengers && passengers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide">Travelers Summary</p>
              <div className="space-y-2">
                {passengers.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700"
                  >
                    <div
                      className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                        p.gender === "Female" ? "bg-pink-500" : "bg-sky-500"
                      }`}
                    >
                      {p.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.gender} · {p.age} years</p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[10px] font-black border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                      <Bus size={10} /> {p.seatNumber}
                    </span>
                  </div>
                ))}
              </div>
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
            <div className="text-center py-8 space-y-3 bg-rose-50/10 dark:bg-rose-900/5 rounded-3xl border border-rose-150 p-6">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-white">Payment Failed</p>
              <p className="text-[11px] text-slate-500">{error || "The transaction was unsuccessful."}</p>
              <button
                onClick={() => { setPhase("pending"); setError(null); setTimeLeft(600); }}
                className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-black text-xs flex items-center gap-1.5 mx-auto shadow-md transition-colors"
              >
                <RefreshCw size={12} /> Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Razorpay Integration Card */}
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-wide">Razorpay Gateway</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-200/50">SECURED</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">Powered by Razorpay</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wide text-slate-400">Payment Status</span>
                    <span className="font-extrabold text-amber-500 uppercase">PENDING</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wide text-slate-400">Order ID</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">{bookingRef}</span>
                  </div>
                </div>

                <button
                  onClick={handleOpenRazorpay}
                  disabled={razorpayLoading}
                  className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md shadow-teal-500/10"
                >
                  {razorpayLoading ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                  {razorpayLoading ? "Connecting Gateway..." : `Proceed with Razorpay (Pay ₹${amount.toLocaleString("en-IN")})`}
                </button>
              </div>

              {/* Payment Methods Card */}
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <CreditCard size={12} className="text-teal-500" /> Supported Payment Methods
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-650 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Razorpay UPI
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Razorpay QR
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Google Pay
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" /> PhonePe
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Paytm
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" /> BHIM
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Amazon Pay
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Credit/Debit Card
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Net Banking & Wallets
                  </div>
                </div>
              </div>

              {phase === "polling" && (
                <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[11px] font-black">
                    Verifying payment signature with Razorpay...
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 pb-6 pt-3">
          <button
            onClick={handleCancel}
            className="w-full py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 font-black text-xs hover:border-rose-300 hover:text-rose-500 transition-colors"
          >
            Cancel & Release Seats
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UPIPaymentModal;
