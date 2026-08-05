import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { ShieldCheck, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2, Clock, Lock, Zap, Copy, Mail } from "lucide-react";

const DEV_EMAIL = "sanjaim0940r@gmail.com";
const MAX_ATTEMPTS = 5;
const OTP_DURATION = 299; // 4:59

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export interface VerifyOtpLocationState {
  email?: string;
  otp?: string;
  preToken?: string;
  development?: boolean;
}

export const VerifyOtp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const state = location.state as VerifyOtpLocationState | null;
  const email = state?.email || localStorage.getItem("admin_pending_email") || DEV_EMAIL;

  // Single state for current development OTP
  const [developmentOtp, setDevelopmentOtp] = useState<string>(
    state?.otp || localStorage.getItem("admin_dev_otp") || ""
  );

  const [copied, setCopied] = useState(false);

  // OTP Digits input state
  const [digits, setDigits] = useState<string[]>(
    developmentOtp.length === 6 ? developmentOtp.split("") : Array(6).fill("")
  );

  const [timer, setTimer] = useState<number>(OTP_DURATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [success, setSuccess] = useState(false);
  const [locked, setLocked] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    console.log("developmentOtp:", developmentOtp);
  }, [developmentOtp]);

  const startTimer = (from = OTP_DURATION) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(from);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (developmentOtp.length === 6) {
      setTimeout(() => inputRefs.current[5]?.focus(), 150);
    } else {
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[index] = val.slice(-1);
    setDigits(newDigits);
    setError(null);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const otpCode = digits.join("");

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (locked) return;
    if (otpCode.length !== 6) { setError("Please enter all 6 digits."); return; }

    setError(null);
    setLoading(true);

    try {
      const preToken = state?.preToken || localStorage.getItem("admin_pre_token") || localStorage.getItem("admin_token") || "";
      console.log(`[ADMIN OTP VERIFY] Validating OTP for ${email}... PreToken present: ${!!preToken}`);

      const res = await api.post("/admin/verify-2fa", {
        email: email.trim().toLowerCase(),
        otp: otpCode,
        preToken,
      });

      console.log("API Response:", res.data);

      if (res.data.success) {
        console.log(`[ADMIN OTP VERIFY] OTP validated successfully. Final JWT received.`);
        const { token, admin } = res.data;
        setAuth(token, admin);
        localStorage.removeItem("admin_pending_email");
        localStorage.removeItem("admin_pending_pass");
        localStorage.removeItem("admin_dev_otp");
        localStorage.removeItem("admin_pre_token");
        if (timerRef.current) clearInterval(timerRef.current);
        setSuccess(true);
        setTimeout(() => navigate("/dashboard", { replace: true }), 2200);
      } else {
        const na = attempts + 1;
        setAttempts(na);
        if (na >= MAX_ATTEMPTS) {
          setLocked(true);
          setError("Maximum attempts reached. Please go back and log in again.");
        } else {
          setError(`Invalid code. ${MAX_ATTEMPTS - na} attempt${MAX_ATTEMPTS - na === 1 ? "" : "s"} remaining.`);
        }
        setDigits(Array(6).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch (err: any) {
      console.error("[ADMIN OTP VERIFY ERROR]:", err);
      const na = attempts + 1;
      setAttempts(na);
      if (na >= MAX_ATTEMPTS) {
        setLocked(true);
        setError("Maximum attempts reached. Please go back and log in again.");
      } else {
        setError(err.response?.data?.message || "Verification failed. Please try again.");
      }
      setDigits(Array(6).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending || locked) return;
    setResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const res = await api.post("/admin/resend-otp", { email: email.trim().toLowerCase() });
      console.log("API Response:", res.data);
      console.log("OTP received from backend:", res.data.otp);
      
      const newOtp = res.data.otp || "";
      if (newOtp) {
        // Always setDevelopmentOtp after resend
        setDevelopmentOtp(newOtp);
        localStorage.setItem("admin_dev_otp", newOtp);
        setDigits(newOtp.split(""));
        setTimeout(() => inputRefs.current[5]?.focus(), 50);
      } else {
        setDigits(Array(6).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }

      setCopied(false);
      setAttempts(0);
      setResendSuccess(true);
      startTimer();
      setTimeout(() => setResendSuccess(false), 3500);
    } catch {
      setError("Failed to resend OTP. Please go back and log in again.");
    } finally {
      setResending(false);
    }
  };

  const copyOtp = () => {
    if (!developmentOtp) return;
    navigator.clipboard.writeText(developmentOtp).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const fillOtp = () => {
    if (!developmentOtp) return;
    setDigits(developmentOtp.split(""));
    setTimeout(() => inputRefs.current[5]?.focus(), 30);
  };

  const expired = timer === 0;

  // ─── Success screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #020817 0%, #0a0f1e 50%, #020817 100%)", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", animation: "ovFadeIn 0.4s ease both" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(16,185,129,0.4)", animation: "ovScaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <CheckCircle2 style={{ width: "40px", height: "40px", color: "#fff" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>Administrator Verified Successfully</h2>
            <p style={{ fontSize: "14px", color: "#64748b" }}>Redirecting to Admin Dashboard...</p>
          </div>
          <div style={{ width: "200px", height: "3px", borderRadius: "2px", background: "rgba(51,65,85,0.5)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #10b981, #06b6d4)", animation: "ovProgress 2.2s linear forwards" }} />
          </div>
        </div>
        <style>{`
          @keyframes ovFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes ovScaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes ovProgress { from { width: 0; } to { width: 100%; } }
        `}</style>
      </div>
    );
  }

  // ─── Main OTP screen ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #020817 0%, #0a0f1e 50%, #020817 100%)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Ambient glows */}
      <div style={{ position: "absolute", top: "10%", left: "12%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "12%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "460px", position: "relative", zIndex: 10, animation: "ovFadeIn 0.45s ease both" }}>

        {/* Glass card */}
        <div style={{ background: "rgba(15,23,42,0.78)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(51,65,85,0.55)", borderRadius: "20px", padding: "36px 36px 32px", boxShadow: "0 30px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)" }}>

          {/* Back button */}
          <button
            onClick={() => navigate("/login")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "13px", fontWeight: 500, padding: "0 0 20px 0", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#22d3ee")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <ArrowLeft style={{ width: "15px", height: "15px" }} />
            Back to Login
          </button>

          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px", textAlign: "center" }}>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(6,182,212,0.35)" }}>
                <ShieldCheck style={{ width: "36px", height: "36px", color: "#020817" }} />
              </div>
              <div style={{ position: "absolute", inset: "-6px", borderRadius: "50%", border: "2px solid rgba(6,182,212,0.25)", animation: "ovRingPulse 2s infinite" }} />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: "6px" }}>
              Administrator Verification
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, marginBottom: "8px" }}>
              A verification code has been sent to
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "9999px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", fontSize: "12px", color: "#22d3ee", fontWeight: 600 }}>
              <Lock style={{ width: "12px", height: "12px" }} />
              {email}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", borderRadius: "12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", marginBottom: "16px" }}>
              <AlertCircle style={{ width: "16px", height: "16px", color: "#f87171", flexShrink: 0, marginTop: "2px" }} />
              <span style={{ fontSize: "13px", color: "#fca5a5", lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          {/* Resend success notice */}
          {resendSuccess && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.22)", marginBottom: "16px" }}>
              <CheckCircle2 style={{ width: "15px", height: "15px", color: "#34d399" }} />
              <span style={{ fontSize: "13px", color: "#6ee7b7" }}>New verification code generated and emailed successfully.</span>
            </div>
          )}

          {/* ═══ ALWAYS RENDERED DEVELOPMENT OTP CARD — NEVER UNMOUNTS ═══ */}
          <div style={{
            borderRadius: "14px",
            border: expired
              ? "1px solid rgba(239,68,68,0.4)"
              : "1px solid rgba(52,211,153,0.5)",
            background: expired
              ? "rgba(239,68,68,0.05)"
              : "rgba(52,211,153,0.05)",
            padding: "16px",
            marginBottom: "20px",
            boxShadow: expired ? "none" : "0 0 24px rgba(52,211,153,0.12), inset 0 1px 0 rgba(52,211,153,0.15)",
            transition: "all 0.4s",
          }}>

            {/* Card Header: 📧 OTP Sent to Email */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Mail style={{ width: "14px", height: "14px", color: expired ? "#f87171" : "#34d399" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: expired ? "#f87171" : "#34d399", letterSpacing: "0.02em" }}>
                  📧 OTP Sent to Email
                </span>
              </div>
              <span style={{
                padding: "2px 8px",
                borderRadius: "9999px",
                fontSize: "9px", fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: expired ? "rgba(239,68,68,0.15)" : "rgba(52,211,153,0.2)",
                border: `1px solid ${expired ? "rgba(239,68,68,0.4)" : "rgba(52,211,153,0.5)"}`,
                color: expired ? "#f87171" : "#34d399",
              }}>
                {expired ? "EXPIRED" : "DEV MODE"}
              </span>
            </div>

            {expired ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(239,68,68,0.08)" }}>
                <AlertCircle style={{ width: "15px", height: "15px", color: "#f87171", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "#f87171", fontWeight: 600 }}>OTP Expired. Please click Resend OTP below.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {/* Subheading: Latest OTP Sent */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    LATEST OTP SENT
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                    Current OTP
                  </span>
                </div>

                {/* Highlighted Developer Box with 6-digit text & Copy OTP button */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  
                  {/* 6-digit text box or "Waiting for OTP..." fallback */}
                  <div style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    background: "rgba(2,8,23,0.7)",
                    border: "2px solid rgba(52,211,153,0.45)",
                    borderRadius: "12px",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5), 0 0 16px rgba(52,211,153,0.15)",
                    minHeight: "48px",
                  }}>
                    <h1 style={{
                      margin: 0,
                      fontSize: developmentOtp ? "26px" : "15px",
                      fontWeight: developmentOtp ? 900 : 600,
                      fontFamily: developmentOtp ? "monospace" : "inherit",
                      letterSpacing: developmentOtp ? "0.35em" : "normal",
                      color: developmentOtp ? "#34d399" : "#94a3b8",
                      paddingLeft: developmentOtp ? "0.35em" : "0",
                      textShadow: developmentOtp ? "0 0 12px rgba(52,211,153,0.5)" : "none",
                    }}>
                      {developmentOtp || "Waiting for OTP..."}
                    </h1>
                  </div>

                  {/* Copy OTP button */}
                  {developmentOtp && (
                    <button
                      type="button"
                      onClick={copyOtp}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: copied ? "rgba(52,211,153,0.2)" : "rgba(6,182,212,0.12)",
                        border: copied ? "1px solid rgba(52,211,153,0.6)" : "1px solid rgba(6,182,212,0.4)",
                        color: copied ? "#34d399" : "#22d3ee",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s",
                        boxShadow: "0 4px 12px rgba(6,182,212,0.15)",
                      }}
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 style={{ width: "15px", height: "15px", color: "#34d399" }} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy style={{ width: "15px", height: "15px" }} />
                          <span>Copy OTP</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* OTP Form */}
          <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* 6 digit input boxes */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Enter Verification Code</p>
                {developmentOtp && !expired && (
                  <button
                    type="button"
                    onClick={fillOtp}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#22d3ee", fontSize: "11px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px", padding: 0 }}
                  >
                    <Zap style={{ width: "11px", height: "11px" }} />
                    Auto-fill
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }} onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={locked}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      width: "52px",
                      height: "60px",
                      textAlign: "center",
                      fontSize: "24px",
                      fontWeight: 700,
                      fontFamily: "monospace",
                      borderRadius: "12px",
                      border: digit
                        ? "2px solid #06b6d4"
                        : error
                        ? "2px solid rgba(239,68,68,0.5)"
                        : "1px solid rgba(51,65,85,0.7)",
                      background: digit ? "rgba(6,182,212,0.08)" : "rgba(2,8,23,0.6)",
                      color: "#e2e8f0",
                      outline: "none",
                      transition: "all 0.15s",
                      boxShadow: digit ? "0 0 0 3px rgba(6,182,212,0.12)" : "none",
                      cursor: locked ? "not-allowed" : "text",
                    }}
                    onFocus={(e) => {
                      if (!locked) {
                        e.target.style.borderColor = "#06b6d4";
                        e.target.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.15)";
                      }
                    }}
                    onBlur={(e) => {
                      if (!digit) {
                        e.target.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(51,65,85,0.7)";
                        e.target.style.boxShadow = "none";
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Timer + Resend */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock style={{ width: "13px", height: "13px", color: expired ? "#f59e0b" : "#06b6d4" }} />
                {expired ? (
                  <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600 }}>OTP Expired</span>
                ) : (
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Expires in{" "}
                    <strong style={{ color: timer < 60 ? "#f59e0b" : "#22d3ee", fontFamily: "monospace", fontSize: "13px" }}>
                      {formatTimer(timer)}
                    </strong>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0 || resending || locked}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  background: "none", border: "none",
                  cursor: (timer > 0 || resending || locked) ? "not-allowed" : "pointer",
                  color: (timer > 0 || resending || locked) ? "#334155" : "#22d3ee",
                  fontSize: "12px", fontWeight: 600, padding: 0, transition: "color 0.2s",
                }}
              >
                <RefreshCw style={{ width: "12px", height: "12px", animation: resending ? "ovSpin 0.7s linear infinite" : "none" }} />
                {resending ? "Sending..." : "Resend OTP"}
              </button>
            </div>

            {/* Attempt counter */}
            {attempts > 0 && !locked && (
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "#475569" }}>
                  Failed attempts: <strong style={{ color: attempts >= 3 ? "#f59e0b" : "#64748b" }}>{attempts} / {MAX_ATTEMPTS}</strong>
                </span>
              </div>
            )}

            {/* Verify button */}
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6 || locked}
              style={{
                width: "100%", padding: "13px", borderRadius: "12px",
                background: (loading || otpCode.length !== 6 || locked) ? "rgba(6,182,212,0.2)" : "linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)",
                border: "none",
                cursor: (loading || otpCode.length !== 6 || locked) ? "not-allowed" : "pointer",
                color: "#020817", fontSize: "14px", fontWeight: 700, letterSpacing: "0.02em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                transition: "all 0.2s",
                boxShadow: (loading || otpCode.length !== 6 || locked) ? "none" : "0 4px 24px rgba(6,182,212,0.3)",
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: "16px", height: "16px", border: "2px solid rgba(2,8,23,0.2)", borderTopColor: "#020817", borderRadius: "50%", animation: "ovSpin 0.7s linear infinite", display: "inline-block" }} />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck style={{ width: "16px", height: "16px" }} />
                  Verify OTP
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "11px", color: "#1e293b", marginTop: "22px" }}>
            TravelLoop Command Center · Multi-Factor Security · v1.0
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "#1e293b", marginTop: "14px" }}>
          🔒 OTP is hashed, time-limited (5 min), and invalidated after use.
        </p>
      </div>

      <style>{`
        @keyframes ovSpin { to { transform: rotate(360deg); } }
        @keyframes ovFadeIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ovScaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes ovRingPulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.12); opacity: 0; } }
        @keyframes ovProgress { from { width: 0; } to { width: 100%; } }
      `}</style>
    </div>
  );
};

export default VerifyOtp;
