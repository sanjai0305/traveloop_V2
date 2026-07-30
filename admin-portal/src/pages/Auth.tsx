import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { Shield, AlertCircle } from "lucide-react";
import { DemoCredentialsCard } from "../components/auth/DemoCredentialsCard";
import { AdminOtpModal } from "../components/auth/AdminOtpModal";
import {
  IS_DEMO,
  generateDemoOtp,
  generateDemoToken,
  makeDemoAdmin,
} from "../lib/demoMode";

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generated OTP — refreshed each time the modal opens or "Resend" is clicked
  const [currentDemoOtp, setCurrentDemoOtp] = useState<string>("");

  // ── Login submit ─────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    // ── DEMO MODE: completely bypass backend ────────────────────────────────
    if (IS_DEMO) {
      const otp = generateDemoOtp();
      setCurrentDemoOtp(otp);
      console.info(
        `%c[DemoMode] Generated OTP: ${otp}`,
        "color: #22d3ee; font-weight: bold; font-size: 14px"
      );
      setLoading(false);
      setIsOtpModalOpen(true);
      return;
    }

    // ── PRODUCTION: real backend call ─────────────────────────────────────────
    try {
      const res = await api.post("/admin/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data?.success) {
        if (res.data.twoFactorRequired) {
          const otp = generateDemoOtp();
          setCurrentDemoOtp(otp);
          setIsOtpModalOpen(true);
        } else {
          setAuth(res.data.token, res.data.admin);
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Invalid administrative credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── OTP verification ─────────────────────────────────────────────────────────
  const handleVerifyOtpCode = useCallback(
    async (submittedOtp: string): Promise<boolean> => {
      const adminEmail =
        email.trim().toLowerCase() || "demo@traveloop.com";

      // ── DEMO MODE: local comparison only ────────────────────────────────────
      if (IS_DEMO) {
        if (submittedOtp === currentDemoOtp) {
          const token = generateDemoToken(adminEmail);
          const admin = makeDemoAdmin(adminEmail) as Parameters<typeof setAuth>[1];
          setAuth(token, admin);
          console.info(`%c[DemoMode] Verified! Session created for ${adminEmail}`, "color: #22d3ee; font-weight: bold");
          setTimeout(() => navigate("/dashboard"), 900);
          return true;
        }
        return false;
      }

      // ── PRODUCTION: call real backend ─────────────────────────────────────────
      try {
        const res = await api.post("/admin/verify-2fa", {
          email: adminEmail,
          otp: submittedOtp,
        });
        if (res.data?.success) {
          setAuth(res.data.token, res.data.admin);
          setTimeout(() => navigate("/dashboard"), 900);
          return true;
        }
      } catch {
        /* fall through */
      }

      return false;
    },
    [email, currentDemoOtp, setAuth, navigate]
  );

  // ── Resend: regenerate OTP in demo mode ──────────────────────────────────────
  const handleResendOtp = useCallback(() => {
    if (IS_DEMO) {
      const otp = generateDemoOtp();
      setCurrentDemoOtp(otp);
      console.info(`%c[DemoMode] New OTP: ${otp}`, "color: #22d3ee; font-weight: bold");
    }
  }, []);

  // ── Credential card auto-fill ────────────────────────────────────────────────
  const handleAutoFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/35">
            <Shield className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-white font-poppins text-center tracking-tight">
            Traveloop Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">Authorized Administrative Access Only</p>

          {IS_DEMO && (
            <span className="mt-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
              🧪 Development Mode — No backend required
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-5" autoComplete="off">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="new-password"
              placeholder={IS_DEMO ? "Any email (e.g. demo@gmail.com)" : "Enter your admin email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-sm font-medium transition-all"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder={IS_DEMO ? "Any password" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-sm font-medium transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all duration-200 mt-6 active:scale-[0.98]"
          >
            {loading ? "Generating OTP..." : "Authenticate Admin"}
          </button>
        </form>

        {/* Demo Credentials helper (dev only) */}
        {IS_DEMO && <DemoCredentialsCard onFillCredentials={handleAutoFill} />}
      </div>

      {/* OTP Modal */}
      <AdminOtpModal
        isOpen={isOtpModalOpen}
        email={email || "demo@traveloop.com"}
        onClose={() => setIsOtpModalOpen(false)}
        onVerify={handleVerifyOtpCode}
        onResend={handleResendOtp}
        generatedOtp={IS_DEMO ? currentDemoOtp : undefined}
      />
    </div>
  );
};
