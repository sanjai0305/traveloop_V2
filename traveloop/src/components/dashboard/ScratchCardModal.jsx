import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Check, Coins } from "lucide-react";
import ScratchCardCanvas from "./ScratchCardCanvas";
import { getApiUrl } from "../../utils/api";
import { useToast } from "../mobile/MobileToast";

const ScratchCardModal = ({ isOpen, onClose, card, onClaimed }) => {
  const toast = useToast();
  const [scratched, setScratched] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimedData, setClaimedData] = useState(null);

  if (!isOpen || !card) return null;

  const handleScratchComplete = () => {
    setScratched(true);
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`profile/claim-scratch-card/${card.cardId}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setClaimedData(data.reward);
        toast.success("Reward claimed successfully!");
        if (onClaimed) onClaimed();
      } else {
        toast.error(data.message || "Failed to claim reward");
      }
    } catch (err) {
      toast.error("Network error claiming reward");
    } finally {
      setClaiming(false);
    }
  };

  // Color theme mapping by card tier
  const cardThemes = {
    Bronze: "from-[#D97706] to-[#78350F]",
    Silver: "from-[#94A3B8] to-[#475569]",
    Gold: "from-[#F59E0B] to-[#B45309]",
    Diamond: "from-[#06B6D4] to-[#0369A1]"
  };

  const themeClass = cardThemes[card.cardType] || cardThemes.Bronze;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal content container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-slate-900 w-full max-w-sm rounded-[32px] p-6 border border-slate-800 shadow-2xl text-center z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-poppins uppercase tracking-wider">
              <Gift className="w-4 h-4 text-teal-400" />
              <span>🎁 Reward Unlocked</span>
            </h3>
            {!claiming && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-4">
            {scratched ? "Claim your rewards below!" : "Scratch the card to reveal your special reward."}
          </p>

          {/* Interactive Card Body */}
          <div className="relative mb-6">
            <ScratchCardCanvas onScratchComplete={handleScratchComplete} width={280} height={320}>
              {/* Underlying Card Details */}
              <div className={`w-full h-full bg-gradient-to-br ${themeClass} rounded-2xl p-6 flex flex-col justify-between text-white border border-white/10 shadow-lg relative`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Traveloop Card</span>
                    <span className="text-lg font-black font-poppins">{card.cardType} Tier</span>
                  </div>
                  <Gift className="w-8 h-8 opacity-80" />
                </div>

                <div className="my-6">
                  {claimedData ? (
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-white/70">Congratulations!</span>
                      <h4 className="text-2xl font-black">{claimedData.value}</h4>
                      {claimedData.couponCode && (
                        <div className="mt-2.5 p-2 bg-slate-950/40 rounded-xl border border-white/10 font-mono text-sm font-bold tracking-wider select-text">
                          {claimedData.couponCode}
                        </div>
                      )}
                      <p className="text-[9px] text-white/70 mt-1">Expires in 30 Days</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-xs font-bold opacity-80">You Revealed:</span>
                      <h4 className="text-3xl font-black tracking-tight">{card.rewardValue}</h4>
                      <p className="text-[9px] opacity-75">Click claim to activate this coupon code</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-[9px] font-bold opacity-80 uppercase tracking-widest pt-2 border-t border-white/10">
                  <span>ID: {card.cardId}</span>
                  <span>Traveloop Rewards</span>
                </div>
              </div>
            </ScratchCardCanvas>
          </div>

          {/* Actions */}
          {scratched && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-2"
            >
              {claimedData ? (
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                >
                  <Check size={14} />
                  <span>Done</span>
                </button>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/15"
                >
                  {claiming ? (
                    <span>Activating...</span>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Claim Reward</span>
                    </>
                  )}
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScratchCardModal;
