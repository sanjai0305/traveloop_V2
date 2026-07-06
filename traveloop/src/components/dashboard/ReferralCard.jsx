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
        className="premium-card p-4 mx-4 mb-4 select-none"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Gift size={16} />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white font-poppins">
            Invite Friends & Earn Travel Rewards
          </h3>
        </div>

        {/* Subtitle */}
        <p className="text-[11px] text-slate-400 font-medium leading-normal mb-3.5 pl-9">
          Share TravelLoop with friends and get discounts on your next trip.
        </p>

        {/* Code & Buttons Container */}
        <div className="flex items-center justify-between gap-3 p-3 bg-slate-50/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
          <div className="flex flex-col pl-1">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Referral Code
            </span>
            <span className="text-sm font-black text-teal-605 dark:text-teal-400 tracking-wide font-mono mt-0.5 select-text">
              {referralCode}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Copy Button */}
            <button
              onClick={handleCopyCode}
              className="h-9 px-3.5 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-1.5 border border-slate-200/20"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShareApp}
              className="h-9 px-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-1.5 shadow-md shadow-teal-500/10"
            >
              <Share2 size={13} />
              <span>Share App</span>
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
