import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { Shield, KeyRound, AlertCircle, ArrowRight } from "lucide-react";

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [is2fa, setIs2fa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    const requestEmail = email.trim().toLowerCase();
    const requestPassword = password;

    try {
      const res = await api.post("/admin/login", { email: requestEmail, password: requestPassword });
      
      if (res.data.success) {
        if (res.data.twoFactorRequired) {
          setIs2fa(true);
        } else {
          // Direct login (if 2FA disabled)
          setAuth(res.data.token, res.data.admin);
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setError(null);
    setLoading(true);

    const requestEmail = email.trim().toLowerCase();

    try {
      const res = await api.post("/admin/verify-2fa", { email: requestEmail, otp });
      if (res.data.success) {
        setAuth(res.data.token, res.data.admin);
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In is not required for admin production login, handled via credentials.

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Portal Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/35">
            <Shield className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-white font-poppins">Traveloop Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">Authorized Administrative Access Only</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── 2FA VERIFICATION CODE SCREEN ── */}
        {is2fa ? (
          <form onSubmit={handleVerify2FA} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Two-Factor Verification
              </label>
              <p className="text-xs text-slate-400">
                Enter the 6-digit one-time verification code.
              </p>
              
              <div className="relative mt-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 h-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="000 000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white font-mono text-center tracking-widest text-lg"
                />
              </div>
            </div>

            {/* 2FA code input */}

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-400/30 transition-all duration-200"
            >
              <span>{loading ? "Verifying..." : "Verify & Establish Session"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* ── STANDARD LOGIN CREDENTIALS SCREEN ── */
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="sanjaim0940r@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-400/30 transition-all duration-200 mt-6"
            >
              {loading ? "Authenticating..." : "Authenticate Admin"}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
