/**
 * UPIPaymentModal.jsx — Premium Razorpay-inspired Checkout Experience
 *
 * - Renders a high-fidelity checkout visual containing:
 *   - Trip Summary: Journey Name, Boarding/Dropping points, Seats, Travel Date, Duration, Amount, Status.
 *   - Payment Methods Panel: UPI (Google Pay, PhonePe, Paytm, BHIM, Amazon Pay), Card, Net Banking, Wallets, EMI.
 *   - Secured by Razorpay / Powered by Razorpay visual badges.
 * - Integrates the real Razorpay SDK checkout overlay trigger using existing keys and verification APIs.
 * - Retains live status polling, QR generation fallback, and manual booking confirmation.
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  X, CheckCircle2, XCircle, Loader2, RefreshCw, Clock,
  Smartphone, Zap, AlertTriangle, Info, CreditCard,
  Copy, Bus, ShieldCheck, Landmark, Wallet, Sparkles, HelpCircle, Lock
} from "lucide-react";
import { getApiUrl } from "../../utils/api";
import { useToast } from "../mobile/MobileToast";

const UPI_VPA = import.meta.env.VITE_UPI_VPA || "traveloop@upi";
const PAYEE_NAME = "TravelLoop";
const POLL_INTERVAL = 3000;

// ─── BUILD UPI INTENT STRING FOR QR FALLBACK ─────────────────────────────────

const buildUPIString = (amount, bookingRef, tripTitle, seatNumbers) => {
  const upiId = import.meta.env.VITE_UPI_VPA || "traveloop@upi";
  const merchantName = "TravelLoop";
  const bookingId = bookingRef || "BOOK";
  const note = encodeURIComponent(`Bus Seat Booking - ${bookingId}`);
  const name = encodeURIComponent(merchantName);
  return `upi://pay?pa=${upiId}&pn=${name}&am=${amount || 0}&cu=INR&tn=${note}`;
};

const UPIPaymentModal = ({
  booking,       // { bookingId, tripTitle, totalAmount }
  passengers,    // PassengerData[]
  trip,
  onSuccess,     // (bookingId: string) => void
  onCancel,      // () => void
  onClose,
}) => {
  const toast = useToast();
  const [phase, setPhase] = useState("gateway"); // "gateway" | "polling" | "success" | "failed"
  const [activeMethod, setActiveMethod] = useState("upi"); // "upi" | "card" | "netbanking" | "wallets" | "emi"
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
  const seatNumbers = passengers?.map((p) => p.seatNumber).join(", ") || "";

  const upiString = buildUPIString(amount, bookingRef, tripTitle, seatNumbers);
  const qrData = upiString;
  const isMobile = /Android|iPhone/i.test(navigator.userAgent);

  // ── Real Razorpay Checkout Overlay Trigger ─────────────────────────────────
  const handleOpenRazorpay = async () => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK is not loaded yet. Please wait a moment.");
      return;
    }
    setRazorpayLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      
      // Create Razorpay Order on Backend
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

      // Configure Razorpay Options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummykeyid",
        amount: data.amount * 100, // paise
        currency: data.currency || "INR",
        name: "TravelLoop Payments",
        description: `Bus Seat Reservation - ${tripTitle}`,
        order_id: data.orderId,
        handler: async (response) => {
          setPhase("polling");
          try {
            // Verify payment
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

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_VPA);
    setCopiedUPI(true);
    toast.success("UPI VPA copied successfully!");
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  // Timer countdown
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

  // Status Polling
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
        // network retry
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

  // Manual payment check
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
    if (!upiString) {
      toast.error("UPI link is not generated");
      return;
    }
    const deepLink = app.replace("upi://", "tez://"); // tez is default tez/phonepe scheme replacer
    window.location.href = deepLink;
    setTimeout(startPolling, 3000);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Main Payment Checkout Card */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 280 }}
        className="relative w-full max-w-4xl h-full md:h-[88vh] bg-slate-900 border border-slate-800 text-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
      >
        {/* Success overlay */}
        <AnimatePresence>
          {phase === "success" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-white">Payment Confirmed Successfully!</h3>
                <p className="text-xs text-slate-400 mt-1">Directing you to your boarding pass...</p>
              </div>
              <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Panel: Trip Summary */}
        <div className="w-full md:w-[380px] bg-slate-950 border-r border-slate-850 p-6 flex flex-col overflow-y-auto shrink-0">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-5">
            <div className="flex items-center gap-2">
              <Bus size={18} className="text-teal-400" />
              <span className="text-sm font-black tracking-wider uppercase">Trip Details</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-500/10 px-2.5 py-1 rounded-xl">
              <Clock size={11} className="text-red-400" />
              <span className="text-[10px] font-black text-red-400 font-mono">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Ticket Information */}
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Journey Name</span>
              <p className="text-xs font-black text-white leading-normal truncate">{tripTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Boarding Point</span>
                <p className="text-xs font-bold text-slate-200 truncate">{trip?.pickupLocation || booking?.pickupLocation || "Main Terminal"}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dropping Point</span>
                <p className="text-xs font-bold text-slate-200 truncate">{trip?.dropPoint || "Terminal Drop"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Travel Date</span>
                <p className="text-xs font-mono font-bold text-slate-200">{trip?.startDate ? new Date(trip.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Duration</span>
                <p className="text-xs font-bold text-slate-200">{trip?.duration || "N/A"}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-850">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Passengers ({passengers?.length || 1})</span>
              <div className="space-y-2">
                {passengers?.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-350 bg-slate-900/60 rounded-xl px-3 py-2 border border-slate-850">
                    <span className="truncate max-w-[150px]">{p.name} ({p.gender[0]})</span>
                    <span className="text-teal-400 font-mono text-[10px] bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Seat {p.seatNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4.5 mt-5">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800 mb-2.5">
              <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Grand Total</span>
              <span className="text-xl font-black text-teal-400">₹{amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
              <Lock size={10} className="text-emerald-500" /> Secure SSL Connection
            </div>
          </div>
        </div>

        {/* Right Panel: Payment Options */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900">
          
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-850 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black flex items-center gap-2 text-white">
                <ShieldCheck size={18} className="text-teal-400 animate-pulse" />
                Select Payment Mode
              </h2>
              <p className="text-[10px] text-slate-450 mt-0.5">Secure payment gateway powered by Razorpay.</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Method Tabs Left Side */}
            <div className="w-full md:w-40 border-b md:border-b-0 md:border-r border-slate-850 flex md:flex-col shrink-0 bg-slate-950/20 overflow-x-auto md:overflow-x-visible">
              {[
                { id: "upi", label: "UPI Apps", icon: Smartphone },
                { id: "card", label: "Cards", icon: CreditCard },
                { id: "netbanking", label: "Net Banking", icon: Landmark },
                { id: "wallets", label: "Wallets", icon: Wallet },
                { id: "emi", label: "EMI Plans", icon: RefreshCw },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = activeMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setActiveMethod(method.id)}
                    className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-4 text-xs font-black uppercase tracking-wider text-left transition-all ${
                      isSelected
                        ? "bg-slate-800 text-teal-400 border-b-2 md:border-b-0 md:border-l-4 border-teal-400"
                        : "text-slate-400 hover:text-white hover:bg-slate-850/50"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Method Details Pane */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* Method 1: UPI */}
              {activeMethod === "upi" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pay directly with UPI app</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { name: "Google Pay", color: "from-blue-600 to-blue-700", bg: "bg-blue-600/10 border-blue-500/20" },
                        { name: "PhonePe", color: "from-purple-600 to-purple-700", bg: "bg-purple-600/10 border-purple-500/20" },
                        { name: "Paytm", color: "from-sky-500 to-sky-600", bg: "bg-sky-500/10 border-sky-500/20" },
                        { name: "BHIM", color: "from-orange-500 to-orange-600", bg: "bg-orange-500/10 border-orange-500/20" },
                        { name: "Amazon Pay", color: "from-amber-500 to-amber-600", bg: "bg-amber-500/10 border-amber-500/20" },
                      ].map((app) => (
                        <button
                          key={app.name}
                          onClick={() => handleAppOpen(app.name)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${app.bg} hover:border-teal-400 transition-all active:scale-95 text-center shrink-0 h-16`}
                        >
                          <span className="text-[9px] font-black text-white">{app.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* QR Fallback */}
                  <div className="border-t border-slate-850 pt-5 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scan QR Code to pay</p>
                    <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center">
                      {qrData ? (
                        <QRCodeSVG value={qrData} size={150} level="H" includeMargin fgColor="#0f172a" />
                      ) : (
                        <span className="text-[10px] text-rose-500 font-bold py-8">QR generation failed. Use gateway.</span>
                      )}
                    </div>
                    
                    {/* Copy VPA */}
                    <div className="w-full max-w-xs bg-slate-950/60 border border-slate-850 rounded-2xl p-3 flex items-center justify-between">
                      <div className="overflow-hidden mr-2">
                        <p className="text-[8px] text-slate-500 font-black uppercase">UPI Address</p>
                        <p className="text-[11px] font-bold text-slate-300 truncate">{UPI_VPA}</p>
                      </div>
                      <button
                        onClick={handleCopyUPI}
                        className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[9px] font-black px-2.5 py-1.5 rounded-xl transition-all"
                      >
                        {copiedUPI ? "Copied" : "Copy VPA"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Method 2: Cards */}
              {activeMethod === "card" && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit / Debit Card details</p>
                  
                  {/* Mock Premium Card UI */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl p-5 border border-white/10 shadow-lg relative overflow-hidden h-40 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Traveloop Classic</span>
                      <CreditCard size={18} className="text-teal-400" />
                    </div>
                    <div className="text-sm font-mono tracking-widest text-slate-300">••••  ••••  ••••  ••••</div>
                    <div className="flex justify-between items-end text-[9px] font-mono text-slate-400">
                      <div>
                        <span>CARD HOLDER</span>
                        <p className="font-bold text-white uppercase tracking-wider mt-0.5">Your Name</p>
                      </div>
                      <div className="text-right">
                        <span>EXPIRES</span>
                        <p className="font-bold text-white mt-0.5">MM/YY</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <input disabled placeholder="Card Number" className="col-span-3 px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-500 outline-none" />
                    <input disabled placeholder="Expiry (MM/YY)" className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-500 outline-none" />
                    <input disabled placeholder="CVV" className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-500 outline-none" />
                    <button onClick={handleOpenRazorpay} className="py-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-black uppercase">Secure Fill</button>
                  </div>
                </div>
              )}

              {/* Method 3: Net Banking */}
              {activeMethod === "netbanking" && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Popular Bank</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Punjab National Bank"].map((bank) => (
                      <button
                        key={bank}
                        onClick={handleOpenRazorpay}
                        className="flex items-center gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-850 hover:border-teal-400 hover:bg-slate-950 transition-all text-left font-bold"
                      >
                        <Landmark size={12} className="text-teal-400" />
                        <span className="truncate">{bank}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Method 4: Wallets */}
              {activeMethod === "wallets" && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Wallet Option</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {["Amazon Pay Wallet", "Paytm Wallet", "PhonePe Wallet", "MobiKwik"].map((wallet) => (
                      <button
                        key={wallet}
                        onClick={handleOpenRazorpay}
                        className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 hover:border-teal-400 hover:bg-slate-950 transition-all font-bold"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet size={12} className="text-teal-400" />
                          <span>{wallet}</span>
                        </div>
                        <span className="text-[9px] text-slate-450 uppercase">Connect</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Method 5: EMI */}
              {activeMethod === "emi" && (
                <div className="space-y-4 animate-fade-in text-center py-6">
                  <RefreshCw size={24} className="mx-auto text-teal-400 animate-spin" />
                  <p className="text-xs font-bold text-slate-300">EMI plans are available for amounts above ₹3,000</p>
                  <p className="text-[10px] text-slate-500">EMI options will be listed securely on the Razorpay overlay checkout.</p>
                  <button
                    onClick={handleOpenRazorpay}
                    className="px-5 py-2.5 bg-teal-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-wider mx-auto"
                  >
                    Check EMI eligibility
                  </button>
                </div>
              )}

              {/* Manual Confirmation (Already Paid warning) */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-2">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                    Already completed your UPI transaction? If verified on your phone, click manual verification to update booking status immediately.
                  </p>
                </div>
                <button
                  onClick={handleManualConfirm}
                  disabled={confirming}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {confirming ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  {confirming ? "Confirming..." : "I've Paid — Verify Payment"}
                </button>
              </div>

              {/* Error box */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 text-xs font-bold animate-pulse">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Polling Check */}
              {phase === "polling" && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[10px] font-black">
                    Validating transaction signature... (Attempt #{pollCount})
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-slate-850 bg-slate-950/40 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-4 border border-slate-850 hover:border-rose-500/30 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 font-black text-xs uppercase tracking-wider rounded-2xl transition-all"
            >
              Cancel & Release Seats
            </button>
            <button
              onClick={handleOpenRazorpay}
              disabled={razorpayLoading}
              className="flex-1.5 py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-500/10 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {razorpayLoading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={14} />}
              {razorpayLoading ? "Linking checkout..." : `Pay ₹${amount.toLocaleString("en-IN")} via Razorpay`}
            </button>
          </div>

        </div>

      </motion.div>
    </motion.div>
  );
};

export default UPIPaymentModal;
