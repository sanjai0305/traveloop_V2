import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Share2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../mobile/MobileToast";
import ShareModal from "./ShareModal";

const ReferralCard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const referralCode = user?.referralCode || "TLP-SANJAI-5821";

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("Referral code copied successfully!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  const handleShareApp = async () => {
    const shareText = `Explore amazing group trips with TravelLoop 🌍

Use my referral code: ${referralCode}

Get exclusive discounts on your first booking.

Website: https://traveloop.app
Download: https://traveloop.app/download

Join TravelLoop today and travel smarter.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "TravelLoop",
          text: shareText,
        });
        toast.success("Invitation shared successfully!");
      } catch (err) {
        console.log("Error sharing natively:", err);
        // Fallback to custom modal if cancelled or fails
        setIsShareOpen(true);
      }
    } else {
      setIsShareOpen(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.22, duration: 0.4 }}
        className="premium-card p-4 mx-4 mb-4 lg:py-4 lg:px-6 lg:mx-0 lg:mb-6 select-none lg:bg-slate-900/40 lg:border-white/10 lg:backdrop-blur-md"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          {/* Left: Icon + Title & Description in single row elements */}
          <div className="flex items-center gap-3 lg:flex-1 min-w-0">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
              <Gift size={16} className="lg:w-5 lg:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm lg:text-base font-extrabold text-slate-800 dark:text-white font-poppins truncate">
                Invite Friends & Earn Travel Rewards
              </h3>
              <p className="text-[11px] lg:text-xs text-slate-400 font-medium leading-normal truncate mt-0.5">
                Share TravelLoop with friends and get discounts on your next trip.
              </p>
            </div>
          </div>

          {/* Center: Referral Code */}
          <div className="flex items-center gap-2 p-2 lg:px-4 lg:py-2 bg-slate-50/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-xl lg:flex-shrink-0">
            <span className="text-[9px] lg:text-xs uppercase font-bold text-slate-400 tracking-wider">
              Code:
            </span>
            <span className="text-sm lg:text-base font-black text-teal-600 dark:text-teal-400 tracking-wide font-mono select-text">
              {referralCode}
            </span>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 lg:gap-3 lg:flex-shrink-0">
            {/* Copy Button */}
            <button
              onClick={handleCopyCode}
              className="h-9 lg:h-10 px-3.5 lg:px-5 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs lg:text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 flex items-center gap-1.5 border border-slate-200/20"
            >
              {copied ? <Check size={13} className="lg:w-4 lg:h-4" /> : <Copy size={13} className="lg:w-4 lg:h-4" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShareApp}
              className="h-9 lg:h-10 px-3.5 lg:px-5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs lg:text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 flex items-center gap-1.5 shadow-md shadow-teal-500/10"
            >
              <Share2 size={13} className="lg:w-4 lg:h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </motion.div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        referralCode={referralCode}
      />
    </>
  );
};

export default ReferralCard;
