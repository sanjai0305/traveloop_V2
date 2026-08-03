import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ticket, Check, AlertTriangle, Loader2, Sparkles, Tag, ArrowRight } from "lucide-react";
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

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  const baseFare = (trip.offerPrice || trip.pricePerPerson || 2500) * passengers.length;
  const gst = Math.round(baseFare * 0.05);
  const convenienceFee = 150;
  const originalTotal = baseFare + gst + convenienceFee;

  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(originalTotal);
  const [discountType, setDiscountType] = useState("");
  const [discountValue, setDiscountValue] = useState(0);

  // ── Fetch Available Coupons ──────────────────────────────────────────
  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      try {
        setLoadingCoupons(true);
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(getApiUrl("coupons/my"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const now = new Date();
          const active = (data.available || data.coupons || []).filter((c) => {
            const notExpired = !c.expiryDate || new Date(c.expiryDate) >= now;
            const notUsed = c.userStatus !== "Used";
            const isActive = c.status === "ACTIVE";
            return notExpired && notUsed && isActive;
          });
          setAvailableCoupons(active);
        }
      } catch (err) {
        console.error("Fetch available coupons error:", err);
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchAvailableCoupons();
  }, []);

  // ── Core Apply Validation Logic ──────────────────────────────────────
  const validateAndApply = async (codeToValidate) => {
    const targetCode = (codeToValidate || couponCode).trim().toUpperCase();
    if (!targetCode) {
      setErrorMsg("Please enter a coupon code");
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          couponCode: targetCode,
          tripId: trip?._id || trip?.id,
          userId: userId,
          bookingAmount: originalTotal,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDiscountAmount(data.discountAmount);
        setFinalTotal(data.updatedTotal || data.finalAmount);
        setAppliedCoupon(data.couponCode);
        setCouponCode(data.couponCode);
        setDiscountType(data.discountType || "");
        setDiscountValue(data.discountValue || 0);
        setSuccessMsg(`Coupon ${data.couponCode} applied successfully. You saved ₹${data.discountAmount}.`);
        setErrorMsg("");
        toast.success(`Coupon ${data.couponCode} applied! Saved ₹${data.discountAmount}`);
      } else {
        setErrorMsg(data.message || "Invalid Coupon Code");
        setSuccessMsg("");
        setDiscountAmount(0);
        setFinalTotal(originalTotal);
        setAppliedCoupon(null);
        setDiscountType("");
        setDiscountValue(0);
      }
    } catch (err) {
      setErrorMsg("Network error validating coupon");
      setSuccessMsg("");
    } finally {
      setIsApplying(false);
    }
  };

  const handleApply = () => {
    validateAndApply(couponCode);
  };

  const handleApplySpecific = (code) => {
    setCouponCode(code);
    validateAndApply(code);
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
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl p-6 overflow-hidden space-y-5 max-h-[90vh] overflow-y-auto hide-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
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

          {/* Fare Summary Breakdown */}
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

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Coupon Discount</span>
                <span className="font-mono">-₹{discountAmount}</span>
              </div>
            )}

            <div className="border-t border-slate-800 my-2 pt-2 flex justify-between text-xs font-black">
              <span>Payable Amount</span>
              <span className="font-mono text-teal-400">₹{finalTotal}</span>
            </div>

            {/* Savings Banner */}
            {discountAmount > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center justify-between animate-pulse">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  Coupon {appliedCoupon} applied!
                </span>
                <span className="font-mono text-emerald-300 font-black">Savings ₹{discountAmount} 🎉</span>
              </div>
            )}
          </div>
        </div>

        {/* Manual Redeem Code Section */}
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
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
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
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── AVAILABLE COUPONS SECTION ── */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-teal-400" />
              Available Coupons
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              {availableCoupons.length} Active
            </span>
          </div>

          {loadingCoupons ? (
            <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-400" /> Loading coupons...
            </div>
          ) : availableCoupons.length === 0 ? (
            <div className="py-3 px-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-500 text-center font-medium">
              No active coupons available in your wallet.
            </div>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {availableCoupons.map((c) => {
                const isMinMet = originalTotal >= (c.minimumAmount || 0);
                const isCurrentApplied = appliedCoupon === c.couponCode;

                return (
                  <div
                    key={c._id || c.couponCode}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrentApplied
                        ? "bg-teal-950/40 border-teal-500/50 shadow-xs"
                        : isMinMet
                        ? "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        : "bg-slate-950/30 border-slate-900 opacity-60"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-teal-400 uppercase tracking-wider bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/40 shrink-0">
                          {c.couponCode}
                        </span>
                        <span className="text-[11px] font-black text-slate-200 truncate">
                          {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `Flat ₹${c.discountValue} OFF`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                        <span>Min Booking: ₹{c.minimumAmount || 0}</span>
                        {c.expiryDate && (
                          <span>Expires: {new Date(c.expiryDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isCurrentApplied ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black flex items-center gap-1">
                          <Check className="w-3 h-3" /> Applied
                        </span>
                      ) : isMinMet ? (
                        <button
                          type="button"
                          onClick={() => handleApplySpecific(c.couponCode)}
                          disabled={isApplying}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          Apply
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-500 text-[10px] font-bold">
                          Min ₹{c.minimumAmount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Proceed to Payment CTA */}
        <button
          type="button"
          onClick={handleProceed}
          className="w-full py-3.5 rounded-2xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-lg bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98] sticky bottom-0 z-10"
        >
          <span>Proceed to Payment (₹{finalTotal})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default RedeemCodeModal;
