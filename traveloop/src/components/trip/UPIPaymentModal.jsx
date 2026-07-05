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
  Smartphone, Zap, ExternalLink, AlertTriangle, Info, CreditCard,
  Copy, Check, Bus
} from "lucide-react";
import { getApiUrl } from "../../utils/api";
import { useToast } from "../mobile/MobileToast";

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
  const toast = useToast();
  const [phase, setPhase] = useState("qr"); // "qr" | "polling" | "success" | "failed"
  const [pollCount, setPollCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const amount = booking?.totalAmount || 0;
  const bookingRef = booking?.bookingId || "BOOK";
  const tripTitle = trip?.title || booking?.tripTitle || "Bus Trip";

  const upiString = buildUPIString(amount, bookingRef, tripTitle);

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
            if (verifyData.success) {
              // 4. Confirm entire booking passenger/seats
              const confirmRes = await fetch(getApiUrl("bookings/confirm"), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  bookingId: booking?.bookingId || bookingRef,
                  travellers: passengers,
                  tripId: trip._id
                })
              });
              const confirmData = await confirmRes.json();
              if (confirmData.success) {
                setPhase("success");
                setTimeout(() => onSuccess(booking?.bookingId || bookingRef), 1500);
              } else {
                throw new Error(confirmData.message || "Seat confirmation failed");
              }
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

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_VPA);
    setCopiedUPI(true);
    toast.success("UPI VPA copied successfully!");
    setTimeout(() => setCopiedUPI(false), 2000);
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
            // Confirm seats on backend
            const confirmRes = await fetch(getApiUrl("bookings/confirm"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                bookingId: booking?.bookingId || bookingRef,
                travellers: passengers,
                tripId: trip._id
              })
            });
            const confirmData = await confirmRes.json();
            if (confirmData.success) {
              clearInterval(pollRef.current);
              clearInterval(timerRef.current);
              setPhase("success");
              setTimeout(() => onSuccess(booking?.bookingId || bookingRef), 1500);
            }
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
        // Confirm seats on backend
        const confirmRes = await fetch(getApiUrl("bookings/confirm"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            bookingId: booking?.bookingId || bookingRef,
            travellers: passengers,
            tripId: trip._id
          })
        });
        const confirmData = await confirmRes.json();
        if (confirmData.success) {
          stopPolling();
          clearInterval(timerRef.current);
          setPhase("success");
          setTimeout(() => onSuccess(booking?.bookingId || bookingRef), 1500);
        } else {
          setError(confirmData.message || "Seat confirmation failed");
        }
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
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-white">Payment Failed</p>
              <button
                onClick={() => { setPhase("qr"); setError(null); setTimeLeft(600); }}
                className="px-6 py-2.5 rounded-xl bg-teal-500 text-white font-black text-xs flex items-center gap-1.5 mx-auto shadow-md"
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
                  {razorpayLoading ? "Connecting Gateway..." : "Open Razorpay Secure Checkout"}
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
                    <CheckCircle2 size={12} className="text-emerald-500" /> UPI ID
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
                    <CheckCircle2 size={12} className="text-emerald-500" /> Credit/Debit Card
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Net Banking & Wallets
                  </div>
                </div>
              </div>

              {/* UPI QR Code Container */}
              <div className="flex flex-col items-center gap-3.5 p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Smartphone size={12} className="text-teal-500" /> Scan & Pay using UPI QR
                </p>
                <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center">
                  <QRCodeSVG
                    value={upiString}
                    size={170}
                    level="H"
                    includeMargin
                    fgColor="#0f172a"
                  />
                </div>
                
                {/* Secured by Razorpay branding */}
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-150 dark:border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Secured by Razorpay
                </div>

                {/* UPI ID Merchant Section */}
                <div className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                  <div className="overflow-hidden mr-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Merchant UPI ID</p>
                    <p className="text-xs font-black text-slate-750 dark:text-slate-250 mt-0.5 truncate">{UPI_VPA}</p>
                  </div>
                  <button
                    onClick={handleCopyUPI}
                    className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-355 text-[10px] font-black px-3 py-1.5 rounded-xl transition-colors shadow-xs"
                  >
                    {copiedUPI ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUPI ? "Copied" : "Copy VPA"}
                  </button>
                </div>
              </div>

              {/* Quick Pay Apps */}
              <div className="space-y-2">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Smartphone size={12} className="text-teal-500" /> Pay using any UPI App
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleAppOpen(app)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b ${app.gradient} text-white shadow-md active:scale-95 transition-all aspect-square border border-white/10`}
                    >
                      <span className="text-lg font-black">{app.emoji}</span>
                      <span className="text-[9px] font-black leading-none tracking-wide text-center">{app.name.split(" ")[0]}</span>
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

              {/* Manual confirm warning & button */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">
                    Already paid via UPI? Click below to confirm your booking.
                  </p>
                </div>
                <button
                  onClick={handleManualConfirm}
                  disabled={confirming}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-colors shadow-md"
                >
                  {confirming ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  {confirming ? "Verifying…" : "I've Paid — Confirm Booking"}
                </button>
              </div>
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
