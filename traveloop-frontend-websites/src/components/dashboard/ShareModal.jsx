import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Send, Smartphone } from "lucide-react";
import { useToast } from "../mobile/MobileToast";

const ShareModal = ({ isOpen, onClose, referralCode }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `Explore amazing group trips with TravelLoop 🌍

Use my referral code: ${referralCode}

Get exclusive discounts on your first booking.

Website: https://traveloop.app
Download: https://traveloop.app/download

Join TravelLoop today and travel smarter.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Share message copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy message");
    }
  };

  const shareUrls = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    telegram: `https://t.me/share/url?url=https://traveloop.app&text=${encodeURIComponent(shareText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://traveloop.app")}`,
    instagram: "copy", // Instagram doesn't support direct URL sharing
  };

  const triggerSocialShare = (platform) => {
    if (shareUrls[platform] === "copy") {
      handleCopy();
      toast.info("Instagram does not support direct link sharing. Message copied for you to paste!");
    } else {
      window.open(shareUrls[platform], "_blank", "noopener,noreferrer");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="relative bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-[32px] sm:rounded-[28px] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 z-10 select-none pb-8 sm:pb-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-extrabold text-slate-850 dark:text-white">
              Share TravelLoop 🌍
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Share Text Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-h-40 overflow-y-auto mb-5 select-text">
            {shareText.split("\n").map((line, idx) => (
              <p key={idx} className={line.trim() === "" ? "h-2" : ""}>
                {line}
              </p>
            ))}
          </div>

          {/* Social Icons Grid */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {/* WhatsApp */}
            <button
              onClick={() => triggerSocialShare("whatsapp")}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                <span className="text-xl font-bold">WA</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => triggerSocialShare("telegram")}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc]">
                <Send size={18} />
              </div>
              <span className="text-[10px] font-bold text-slate-400">Telegram</span>
            </button>

            {/* Instagram */}
            <button
              onClick={() => triggerSocialShare("instagram")}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#E1306C]/10 flex items-center justify-center text-[#E1306C]">
                <span className="text-xl font-bold">IG</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Instagram</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => triggerSocialShare("facebook")}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
                <span className="text-xl font-bold">FB</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Facebook</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopy}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </div>
              <span className="text-[10px] font-bold text-slate-400">Copy Link</span>
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleCopy}
            className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15"
          >
            <Copy size={16} />
            <span>Copy Full Invitation</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
