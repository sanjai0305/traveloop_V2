import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { Shield, KeyRound, AlertCircle, ArrowRight, Globe, Copy, Check } from "lucide-react";

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [is2fa, setIs2fa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugCode, setDebugCode] = useState<string | undefined>(undefined);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleCopy = (text: string, type: "email" | "password") => {
    navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    const requestEmail = email.trim().toLowerCase() === "sanjaim0940r@gmail.com" ? "admin@traveloop.com" : email;
    const requestPassword = (email.trim().toLowerCase() === "sanjaim0940r@gmail.com" && password === "Sanjai@2006") ? "adminpassword" : password;

    try {
      const res = await api.post("/admin/login", { email: requestEmail, password: requestPassword });
      
      if (res.data.success) {
        if (res.data.twoFactorRequired) {
          setIs2fa(true);
          // Set debug OTP returned in dev mode for easy copying
          if (res.data.debugOtp) {
            setDebugCode(res.data.debugOtp);
          }
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

    const requestEmail = email.trim().toLowerCase() === "sanjaim0940r@gmail.com" ? "admin@traveloop.com" : email;

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

  const handleGoogleLogin = () => {
    // Simulate admin credentials for easy verification
    setEmail("admin@traveloop.com");
    setPassword("adminpassword");
    setError(null);
    // Notify user to click Submit to complete login flow
    setError("Google Sign-In simulated. Please click 'Authenticate Admin' below.");
  };

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

            {debugCode && (
              <div className="p-3 bg-teal-950/30 border border-teal-500/20 rounded-xl text-center">
                <span className="text-[10px] text-teal-400 uppercase tracking-widest font-semibold block mb-1">
                  Local Dev OTP Fallback
                </span>
                <span className="text-lg font-mono font-bold text-teal-400 tracking-wider">
                  {debugCode}
                </span>
              </div>
            )}

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

            {/* Google Login Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="border-t border-slate-800 w-full absolute"></div>
              <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold z-10">
                Or Continue With
              </span>
            </div>

            {/* Simulated Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200"
            >
              <Globe className="w-4 h-4 text-teal-400" />
              <span>Simulate Google Sign-In</span>
            </button>

            {/* Testing Hint */}
            <div className="mt-6 p-3 bg-slate-950/40 rounded-xl text-center text-[10px] text-slate-500 border border-slate-800/40">
              <p className="tracking-widest select-none text-slate-700">━━━━━━━━━━━━━━━━━━━━</p>
              <p className="font-semibold text-slate-400 mt-1 mb-1">Demo Account</p>
              
              <div className="mt-2">
                <p className="text-slate-500">Email:</p>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="text-teal-500/80 font-mono select-all">sanjaim0940r@gmail.com</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("sanjaim0940r@gmail.com", "email")}
                    className="p-0.5 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-teal-400 focus:outline-none flex items-center justify-center"
                    title="Copy Email"
                  >
                    {copiedEmail ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-slate-500">Password:</p>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="text-teal-500/80 font-mono select-all">Sanjai@2006</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("Sanjai@2006", "password")}
                    className="p-0.5 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-teal-400 focus:outline-none flex items-center justify-center"
                    title="Copy Password"
                  >
                    {copiedPassword ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
              <p className="tracking-widest select-none text-slate-700 mt-2">━━━━━━━━━━━━━━━━━━━━</p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
