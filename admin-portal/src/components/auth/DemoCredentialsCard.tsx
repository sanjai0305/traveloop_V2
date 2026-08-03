import React, { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, Sparkles, Key, Mail, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DemoCredentialsCardProps {
  onFillCredentials?: (email: string, pass: string) => void;
}

export const DemoCredentialsCard: React.FC<DemoCredentialsCardProps> = ({ onFillCredentials }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const demoData = [
    { label: "Admin Email", value: "admin@traveloop.ai", key: "email", icon: Mail },
    { label: "Password", value: "Admin@123", key: "password", icon: Key },
    { label: "Demo OTP", value: "123456", key: "otp", icon: ShieldAlert },
  ];

  const handleCopy = (value: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAutoFill = () => {
    if (onFillCredentials) {
      onFillCredentials("admin@traveloop.ai", "Admin@123");
    }
  };

  return (
    <div className="mt-6 border border-cyan-500/30 bg-slate-900/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all">
      {/* Header / Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Demo Login Credentials
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-bold text-cyan-400 tracking-widest">
                DEMO MODE
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">Click to view test credentials & auto-fill</p>
          </div>
        </div>
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-800/80 px-5 py-4 space-y-3 bg-slate-950/40"
          >
            <div className="space-y-2.5">
              {demoData.map((item) => {
                const Icon = item.icon;
                const isCopied = copiedKey === item.key;

                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      <span className="text-xs text-slate-400 font-medium">{item.label} :</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                        {item.value}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(item.value, item.key, e)}
                        title={`Copy ${item.label}`}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-all active:scale-95"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Fill Button */}
            {onFillCredentials && (
              <button
                type="button"
                onClick={handleAutoFill}
                className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                ⚡ Auto-Fill Demo Credentials
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
