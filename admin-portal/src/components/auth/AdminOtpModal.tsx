import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles,
  CheckCircle2,
  FlaskConical,
  Copy,
  Check,
} from "lucide-react";

interface AdminOtpModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onVerify: (otpCode: string) => Promise<boolean>;
  /** Called when the user clicks "Resend OTP" – parent should regenerate OTP in dev mode */
  onResend?: () => void;
  /**
   * If provided (dev mode), this OTP is displayed prominently inside the modal.
   * In production, leave undefined — the banner is hidden.
   */
  generatedOtp?: string;
}

export const AdminOtpModal: React.FC<AdminOtpModalProps> = ({
  isOpen,
  email,
  onClose,
  onVerify,
  onResend,
  generatedOtp,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState<number>(60);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("Verifying Administrator...");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState<boolean>(false);
  const [otpCopied, setOtpCopied] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isDev = Boolean(generatedOtp);

  // ── Reset state whenever modal opens ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    setDigits(Array(6).fill(""));
    setTimer(60);
    setError(null);
    setIsSuccess(false);
    setIsVerifying(false);
    setOtpCopied(false);

    setTimeout(() => inputRefs.current[0]?.focus(), 150);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // ── Reset timer when OTP is regenerated (resend) ─────────────────────────────
  useEffect(() => {
    if (!isOpen || !generatedOtp) return;
    setTimer(60);
    setDigits(Array(6).fill(""));
    setError(null);
    setOtpCopied(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [generatedOtp]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Input handlers ───────────────────────────────────────────────────────────
  const handleInputChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }
    const char = cleanVal.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedText) return;
    const newDigits = Array(6).fill("");
    for (let i = 0; i < pastedText.length; i++) newDigits[i] = pastedText[i];
    setDigits(newDigits);
    inputRefs.current[Math.min(pastedText.length, 5)]?.focus();
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = digits.join("");
    if (fullOtp.length < 6 || isVerifying) return;

    setError(null);
    setIsVerifying(true);

    const steps = [
      "Verifying Administrator...",
      "Creating Secure Session...",
      "Loading Dashboard...",
    ];
    setLoadingStep(steps[0]);
    const t1 = setTimeout(() => setLoadingStep(steps[1]), 450);
    const t2 = setTimeout(() => setLoadingStep(steps[2]), 900);

    try {
      const success = await onVerify(fullOtp);
      clearTimeout(t1);
      clearTimeout(t2);
      if (success) {
        setIsSuccess(true);
      } else {
        setError("Invalid OTP. Please check the displayed code and try again.");
        setIsVerifying(false);
      }
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setError(err?.message || "Invalid OTP. Please try again.");
      setIsVerifying(false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError(null);

    try {
      if (onResend) onResend(); // let parent regenerate OTP
      // Timer reset is handled by the generatedOtp effect above
    } finally {
      setResending(false);
    }
  };

  // ── Copy OTP helper ───────────────────────────────────────────────────────────
  const handleCopyOtp = () => {
    if (!generatedOtp) return;
    navigator.clipboard.writeText(generatedOtp);
    setOtpCopied(true);
    setTimeout(() => setOtpCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative z-10 text-center"
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg transition-all duration-300 ${
                isSuccess
                  ? "bg-emerald-500 shadow-emerald-500/30"
                  : "bg-gradient-to-br from-cyan-500 to-teal-500 shadow-cyan-500/30"
              }`}
            >
              {isSuccess ? (
                <ShieldCheck className="w-8 h-8 text-slate-950 animate-bounce" />
              ) : (
                <Shield className="w-8 h-8 text-slate-950" />
              )}
            </div>
            <h2 className="text-xl font-bold text-white font-poppins">
              Admin Identity Verification
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs">
              {isDev
                ? "Enter the OTP shown below to proceed in development mode."
                : "A 6-digit verification code has been sent to your registered administrator device."}
            </p>
            {email && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-cyan-300">
                {email}
              </span>
            )}
          </div>

          {/* Success View */}
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 space-y-4"
            >
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-emerald-400 uppercase tracking-wider">
                ✓ Administrator Verified
              </h3>
              <div className="space-y-2 text-xs text-slate-400">
                {["Verifying Administrator...", "Creating Secure Session...", "Loading Dashboard..."].map((s) => (
                  <div key={s} className="flex items-center justify-center gap-2 text-emerald-400/80">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Redirecting to Admin Dashboard...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── DEV MODE: Generated OTP Banner ─────────────────────────── */}
              {isDev && generatedOtp && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-cyan-500/40 bg-slate-950/70 overflow-hidden"
                >
                  {/* Banner header */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/20">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                      Development Mode
                    </span>
                  </div>

                  {/* OTP display */}
                  <div className="px-4 py-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
                      Generated Demo OTP
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {/* Segmented OTP display */}
                      <div className="flex gap-1.5">
                        {generatedOtp.split("").map((d, i) => (
                          <span
                            key={i}
                            className="w-9 h-11 flex items-center justify-center rounded-lg bg-slate-900 border border-cyan-500/30 text-xl font-black font-mono text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.20)] select-none"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                      {/* Copy button */}
                      <button
                        type="button"
                        onClick={handleCopyOtp}
                        title="Copy OTP"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/40 transition-all active:scale-95"
                      >
                        {otpCopied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="px-4 pb-3 flex items-start gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-500/60 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Enter this OTP in the boxes below. No email is sent in development mode.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* 6-Box OTP Input */}
              <div className="flex justify-center items-center gap-2 sm:gap-2.5">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    disabled={isVerifying}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono bg-slate-950/80 border border-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 rounded-xl text-cyan-300 outline-none transition-all disabled:opacity-50"
                  />
                ))}
              </div>

              {/* Timer & Resend */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400 font-medium">
                  {timer > 0 ? (
                    <>Code expires in <span className="text-cyan-400 font-bold font-mono">{timer}s</span></>
                  ) : (
                    <span className="text-rose-400">Code expired</span>
                  )}
                </span>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timer > 0 || resending || isVerifying}
                  className="text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                  <span>Resend OTP</span>
                </button>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isVerifying || digits.join("").length < 6}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{loadingStep}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Verify & Access Command Center</span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
