import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, CheckCircle, Calendar, Ticket } from "lucide-react";
import { useToast } from "../mobile/MobileToast";

const CouponDetailsModal = ({ isOpen, onClose, coupon }) => {
  const toast = useToast();

  if (!isOpen || !coupon) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.couponCode);
    toast.success("Coupon code copied to clipboard!");
  };

  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal body */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-slate-900 border border-slate-800 shadow-2xl rounded-[32px] w-full max-w-sm p-6 text-center z-10 overflow-hidden"
        >
          {/* Decorative radial gradient */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div className="mx-auto w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 mt-2">
            <Ticket size={24} className="animate-pulse" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-black text-white font-poppins">Coupon Details</h3>
          <p className="text-xs text-slate-450 mt-1">Traveloop Discount Voucher</p>

          {/* Coupon Info Box */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 my-5 space-y-3.5 text-left text-xs font-semibold">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Discount:</span>
              <span className="text-base font-black text-teal-450">{coupon.discountPercent || coupon.rewardValue || "5"}% OFF</span>
            </div>

            <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Coupon Code:</span>
              <div className="flex items-center gap-1.5 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800 font-mono text-white text-xs font-bold select-all">
                <span>{coupon.couponCode}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-slate-450 hover:text-teal-400 transition-colors"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Status:</span>
              {coupon.used ? (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-black uppercase">
                  Used
                </span>
              ) : isExpired ? (
                <span className="px-2 py-0.5 rounded bg-rose-950/30 text-rose-400 text-[10px] font-black uppercase">
                  Expired
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-teal-950/30 text-teal-400 text-[10px] font-black uppercase flex items-center gap-1">
                  <CheckCircle size={10} />
                  Available
                </span>
              )}
            </div>

            {coupon.used && coupon.usedBookingId && (
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Booking ID:</span>
                <span className="font-mono text-slate-300 text-xs font-bold">{coupon.usedBookingId}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Expiry Date:</span>
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <Calendar size={11} className="text-slate-500" />
                {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "30 days from unlock"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleCopy}
              className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Copy size={13} />
              <span>Copy Code</span>
            </button>
            
            {!coupon.used && !isExpired && (
              <button
                onClick={onClose}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-lg shadow-teal-500/10"
              >
                Use Now
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CouponDetailsModal;
