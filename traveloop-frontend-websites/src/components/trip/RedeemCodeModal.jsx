import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ticket, Check, AlertTriangle, Loader2 } from "lucide-react";
import { getApiUrl } from "../../utils/api";
import { useToast } from "../mobile/MobileToast";

const RedeemCodeModal = ({
  trip,
  passengers,
  onConfirm, // (couponCode, discountAmount, finalAmount) => void
  onClose,
}) => {
  const toast = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const baseFare = (trip.offerPrice || trip.pricePerPerson || 2500) * passengers.length;
  const gst = Math.round(baseFare * 0.05);
  const convenienceFee = 150;
  const originalTotal = baseFare + gst + convenienceFee;

  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(originalTotal);
  const [discountType, setDiscountType] = useState("");
  const [discountValue, setDiscountValue] = useState(0);

  const handleApply = async () => {
    if (!couponCode.trim()) {
      setErrorMsg("❌ Please enter a coupon code");
      setSuccessMsg("");
      return;
    }

    setIsApplying(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = localStorage.getItem("token");
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = localUser?._id || localUser?.id;

      const res = await fetch(getApiUrl("coupons/validate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          tripId: trip?._id || trip?.id,
          userId: userId,
          bookingAmount: originalTotal
        })
      });

      const data = await res.json();
      if (data.success) {
        setDiscountAmount(data.discountAmount);
        setFinalTotal(data.updatedTotal || data.finalAmount);
        setAppliedCoupon(data.couponCode);
        setDiscountType(data.discountType || "");
        setDiscountValue(data.discountValue || 0);
        setSuccessMsg("✅ Coupon Applied Successfully");
        setErrorMsg("");
        toast.success("Coupon applied successfully!");
      } else {
        setErrorMsg(`❌ ${data.message || "Invalid Coupon Code"}`);
        setSuccessMsg("");
        setDiscountAmount(0);
        setFinalTotal(originalTotal);
        setAppliedCoupon(null);
        setDiscountType("");
        setDiscountValue(0);
      }
    } catch (err) {
      setErrorMsg("❌ Network error validating coupon");
      setSuccessMsg("");
    } finally {
      setIsApplying(false);
    }
  };

  const handleClear = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setFinalTotal(originalTotal);
    setAppliedCoupon(null);
    setDiscountType("");
    setDiscountValue(0);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleProceed = () => {
    console.log("[STEP 1] Button Click (Proceed to Payment)");
    if (errorMsg) {
      onConfirm("", 0, originalTotal);
    } else {
      onConfirm(appliedCoupon || "", discountAmount, finalTotal);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl p-6 overflow-hidden space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-black tracking-wider uppercase flex items-center gap-2">
            <Ticket className="w-5 h-5 text-teal-400" />
            <span>Payment Summary</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Trip Name & Passenger details */}
        <div className="space-y-4 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850 space-y-2.5">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Trip Name</span>
              <p className="font-bold text-slate-100">{trip.title}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Travelers & Seats</span>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] text-slate-300">
                {passengers.map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-teal-400">Seat {p.seatNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fare Summary */}
          <div className="space-y-2 px-1">
            <div className="flex justify-between text-slate-400 font-medium">
              <span>Base Fare</span>
              <span className="font-mono text-slate-200">₹{baseFare}</span>
            </div>
            <div className="flex justify-between text-slate-400 font-medium">
              <span>GST (5%)</span>
              <span className="font-mono text-slate-200">₹{gst}</span>
            </div>
            <div className="flex justify-between text-slate-400 font-medium">
              <span>Convenience Fee</span>
              <span className="font-mono text-slate-200">₹{convenienceFee}</span>
            </div>
            {appliedCoupon && (
              <div className="border-t border-slate-800/50 my-1 pt-1 space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px] font-medium">
                  <span>Coupon Applied</span>
                  <span className="font-bold text-teal-400">
                    {appliedCoupon} ({discountType === "PERCENTAGE" ? `-${discountValue}%` : `-₹${discountValue}`})
                  </span>
                </div>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Discount</span>
                <span className="font-mono">-₹{discountAmount}</span>
              </div>
            )}
            <div className="border-t border-slate-800 my-2 pt-2 flex justify-between text-xs font-black">
              <span>Payable Amount</span>
              <span className="font-mono text-teal-400">₹{finalTotal}</span>
            </div>
          </div>
        </div>

        {/* Redeem Code Section */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Redeem Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              disabled={appliedCoupon || isApplying}
              placeholder="Enter coupon code"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors uppercase font-mono tracking-wider disabled:opacity-50"
            />
            {appliedCoupon || errorMsg ? (
              <button
                type="button"
                onClick={handleClear}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 shrink-0"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying || !couponCode.trim()}
                className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl transition-all active:scale-95 shrink-0 flex items-center justify-center min-w-[70px]"
              >
                {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
              </button>
            )}
          </div>

          {/* Validation Messages */}
          <AnimatePresence mode="wait">
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 mt-2"
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 mt-2"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Proceed to Payment CTA */}
        <button
          type="button"
          onClick={handleProceed}
          className="w-full py-3.5 rounded-2xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-lg bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98]"
        >
          Proceed to Payment (₹{finalTotal})
        </button>
      </motion.div>
    </motion.div>
  );
};

export default RedeemCodeModal;
