import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import {
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Copy,
  Check,
  Info,
  ChevronDown,
  Activity,
  Users,
  Globe,
  HelpCircle,
  MapPin,
  BarChart3,
} from "lucide-react";

const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === "true";
const DEV_EMAIL = "sanjaim0940r@gmail.com";
const DEV_PASS = "admin@123";

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState(DEV_MODE ? DEV_EMAIL : "");
  const [password, setPassword] = useState(DEV_MODE ? DEV_PASS : "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devShowPass, setDevShowPass] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [devExpanded, setDevExpanded] = useState(false);

  const handleCopy = (text: string, type: "email" | "pass") => {
    navigator.clipboard.writeText(text).catch(() => {});
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1800);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 1800);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    try {
      console.log(`[ADMIN LOGIN] Submitting login request for ${email.trim().toLowerCase()}...`);
      const res = await api.post("/admin/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data.success) {
        console.log(`[ADMIN LOGIN] Password verified for ${email.trim().toLowerCase()}`);
        console.log(`[ADMIN LOGIN] OTP generated and emailed successfully`);

        localStorage.setItem("admin_pending_email", email.trim().toLowerCase());
        localStorage.setItem("admin_pending_pass", password);

        if (res.data.twoFactorRequired || res.data.requiresOTP || res.data.twoFactorEnabled !== false) {
          console.log(`[ADMIN LOGIN] Redirecting to OTP verification page (/admin/verify-otp)`);
          const receivedOtp = res.data.otp || res.data.debugOtp || null;
          console.log(`[ADMIN LOGIN] OTP received from backend: ${receivedOtp || "NOT_RETURNED"}`);
          if (receivedOtp) {
            localStorage.setItem("admin_dev_otp", receivedOtp);
          } else {
            localStorage.removeItem("admin_dev_otp");
          }
          navigate("/admin/verify-otp", {
            state: {
              email: email.trim().toLowerCase(),
              otp: receivedOtp,
              development: !!res.data.development,
            },
          });
        } else {
          const { token, admin } = res.data;
          setAuth(token, admin);
          navigate("/dashboard");
        }
      } else {
        setError(res.data.message || "Invalid email or password.");
      }
    } catch (err: any) {
      console.error("[ADMIN LOGIN ERROR]:", err);
      const msg =
        err.response?.data?.message ||
        "Unable to connect to the server. Please ensure the backend is running.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !email || !password;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F0F4F8", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ── TOP NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #E5E7EB", height: "60px", display: "flex", alignItems: "center", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          {/* Logo mark */}
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
            <Globe style={{ width: "18px", height: "18px", color: "#fff" }} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Traveloop</span>
          <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: "11px", fontWeight: 600, color: "#2563EB", letterSpacing: "0.04em" }}>Admin Portal</span>
          <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#F9FAFB", border: "1px solid #E5E7EB", fontSize: "11px", color: "#6B7280" }}>v2.0</span>
        </div>
        <a href="mailto:support@traveloop.com" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6B7280", textDecoration: "none", padding: "6px 14px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "#fff", transition: "all 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#2563EB"; (e.currentTarget as HTMLAnchorElement).style.color = "#2563EB"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLAnchorElement).style.color = "#6B7280"; }}>
          <HelpCircle style={{ width: "14px", height: "14px" }} />
          Need Help?
        </a>
      </nav>

      {/* ── MAIN SPLIT ── */}
      <div style={{ flex: 1, display: "flex", paddingTop: "60px", minHeight: "100vh" }}>

        {/* ════ LEFT PANEL (60%) ════ */}
        <div style={{ flex: "0 0 60%", position: "relative", overflow: "hidden", background: "linear-gradient(145deg, #1E3A5F 0%, #1A2E4A 40%, #0F1E35 100%)", display: "flex", flexDirection: "column", padding: "64px 72px", animation: "slideInLeft 0.6s cubic-bezier(0.22,1,0.36,1) both" }}>

          {/* Travel map SVG illustration (very subtle) */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }} viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice">
            {/* World map dots grid */}
            {Array.from({ length: 18 }).map((_, row) =>
              Array.from({ length: 28 }).map((_, col) => (
                <circle key={`${row}-${col}`} cx={col * 34 + 10} cy={row * 40 + 10} r="1.5" fill="#fff" />
              ))
            )}
            {/* Route lines */}
            <path d="M 80 200 Q 280 120 480 180 Q 620 230 750 160" stroke="#60A5FA" strokeWidth="2" fill="none" strokeDasharray="8 5" />
            <path d="M 120 380 Q 300 300 500 350 Q 680 400 820 320" stroke="#34D399" strokeWidth="1.5" fill="none" strokeDasharray="6 6" />
            <path d="M 200 500 Q 400 450 550 480 Q 700 510 860 460" stroke="#A78BFA" strokeWidth="1.5" fill="none" strokeDasharray="6 4" />
            {/* Location pins */}
            <circle cx="480" cy="180" r="6" fill="#60A5FA" />
            <circle cx="480" cy="180" r="12" fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.5" />
            <circle cx="750" cy="160" r="5" fill="#34D399" />
            <circle cx="750" cy="160" r="10" fill="none" stroke="#34D399" strokeWidth="1.5" opacity="0.5" />
            <circle cx="280" cy="120" r="4" fill="#FBBF24" />
            <circle cx="500" cy="350" r="5" fill="#F472B6" />
            <circle cx="820" cy="320" r="4" fill="#60A5FA" />
            {/* Analytics chart shape */}
            <polyline points="620,560 660,510 700,530 740,480 780,495 820,440 860,460" stroke="#60A5FA" strokeWidth="2" fill="none" opacity="0.7" />
            <polygon points="620,560 660,510 700,530 740,480 780,495 820,440 860,460 860,580 620,580" fill="#3B82F6" opacity="0.08" />
          </svg>

          {/* Ambient glows */}
          <div style={{ position: "absolute", top: "20%", left: "15%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "560px" }}>

            {/* Status badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "9999px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", width: "fit-content", marginBottom: "32px", animation: "fadeUp 0.5s ease both 0.1s" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34D399", display: "inline-block", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#34D399", letterSpacing: "0.06em", textTransform: "uppercase" }}>Command Center Active</span>
            </div>

            {/* Main heading */}
            <h1 style={{ fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 800, color: "#F1F5F9", lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: "20px", animation: "fadeUp 0.55s ease both 0.15s" }}>
              Manage the Entire<br />
              <span style={{ background: "linear-gradient(90deg, #60A5FA 0%, #34D399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Traveloop Ecosystem
              </span>
            </h1>

            {/* Description */}
            <p style={{ fontSize: "16px", color: "#94A3B8", lineHeight: 1.7, marginBottom: "48px", animation: "fadeUp 0.6s ease both 0.2s" }}>
              Securely manage trips, travelers, agents, drivers, bookings and platform operations from one centralized command center.
            </p>

            {/* Feature cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", animation: "fadeUp 0.65s ease both 0.25s" }}>
              {[
                { icon: <Activity style={{ width: "18px", height: "18px" }} />, color: "#3B82F6", bg: "rgba(59,130,246,0.12)", label: "Real-time Trip Monitoring", desc: "Live dashboards, alerts and route tracking" },
                { icon: <Users style={{ width: "18px", height: "18px" }} />, color: "#34D399", bg: "rgba(52,211,153,0.12)", label: "User & Agent Management", desc: "Roles, permissions and account controls" },
                { icon: <Shield style={{ width: "18px", height: "18px" }} />, color: "#A78BFA", bg: "rgba(167,139,250,0.12)", label: "Secure Enterprise Administration", desc: "2FA, audit logs and encrypted sessions" },
              ].map((f, i) => (
                <div key={i}
                  style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(8px)", transition: "background 0.2s, border-color 0.2s, transform 0.2s", cursor: "default" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.13)"; (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)"; }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#E2E8F0", marginBottom: "2px" }}>{f.label}</p>
                    <p style={{ fontSize: "12px", color: "#64748B" }}>{f.desc}</p>
                  </div>
                  <Check style={{ width: "16px", height: "16px", color: f.color, marginLeft: "auto", flexShrink: 0 }} />
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "32px", marginTop: "48px", animation: "fadeUp 0.7s ease both 0.3s" }}>
              {[
                { value: "99.9%", label: "Uptime SLA" },
                { value: "256-bit", label: "Encryption" },
                { value: "2FA", label: "Auth Required" },
              ].map((s, i) => (
                <div key={i}>
                  <p style={{ fontSize: "22px", fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: "11px", color: "#64748B", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom left decoration */}
          <div style={{ position: "absolute", bottom: "24px", left: "72px", display: "flex", alignItems: "center", gap: "8px", zIndex: 2 }}>
            <MapPin style={{ width: "14px", height: "14px", color: "#475569" }} />
            <span style={{ fontSize: "12px", color: "#475569" }}>Traveloop Platform · Enterprise Edition</span>
          </div>
        </div>

        {/* ════ RIGHT PANEL (40%) ════ */}
        <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", background: "#F0F4F8", position: "relative", overflowY: "auto" }}>

          {/* Subtle background pattern */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(37,99,235,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />

          <div style={{ width: "100%", maxWidth: "420px", position: "relative", animation: "slideInRight 0.6s cubic-bezier(0.22,1,0.36,1) both 0.05s" }}>

            {/* Card header above card */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(37,99,235,0.28)" }}>
                <Shield style={{ width: "26px", height: "26px", color: "#fff" }} />
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", marginBottom: "6px" }}>Welcome back</h2>
              <p style={{ fontSize: "14px", color: "#6B7280" }}>Sign in to your admin account</p>
            </div>

            {/* Login Card */}
            <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 40px rgba(0,0,0,0.06)", padding: "32px 32px 28px" }}>

              {/* Error */}
              {error && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", borderRadius: "10px", background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: "20px" }}>
                  <AlertCircle style={{ width: "16px", height: "16px", color: "#DC2626", flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ fontSize: "13px", color: "#B91C1C", lineHeight: 1.5 }}>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLoginSubmit} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                {/* Email */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                    Email address
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9CA3AF", pointerEvents: "none" }} />
                    <input
                      type="email"
                      required
                      autoComplete="new-password"
                      placeholder="admin@traveloop.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: "100%", padding: "13px 14px 13px 44px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "10px", fontSize: "14px", color: "#111827", outline: "none", boxSizing: "border-box", transition: "border-color 0.18s, box-shadow 0.18s" }}
                      onFocus={(e) => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; e.target.style.background = "#fff"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; e.target.style.background = "#F9FAFB"; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9CA3AF", pointerEvents: "none" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: "100%", padding: "13px 44px 13px 44px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "10px", fontSize: "14px", color: "#111827", outline: "none", boxSizing: "border-box", transition: "border-color 0.18s, box-shadow 0.18s" }}
                      onFocus={(e) => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; e.target.style.background = "#fff"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; e.target.style.background = "#F9FAFB"; }}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center", padding: 0, transition: "color 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#2563EB"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}>
                      {showPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                    </button>
                  </div>
                </div>

                {/* DEV: Collapsible Local Development panel */}
                {DEV_MODE && (
                  <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden", transition: "border-color 0.2s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#BFDBFE"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB"; }}>

                    {/* Toggle header */}
                    <button type="button" onClick={() => setDevExpanded(v => !v)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "#F8FAFF", border: "none", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <BarChart3 style={{ width: "13px", height: "13px", color: "#2563EB" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Local Development</span>
                        <span style={{ padding: "1px 7px", borderRadius: "5px", background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: "9px", fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase" }}>LOCAL</span>
                      </div>
                      <ChevronDown style={{ width: "14px", height: "14px", color: "#9CA3AF", transition: "transform 0.22s", transform: devExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </button>

                    {/* Expanded content */}
                    <div style={{ maxHeight: devExpanded ? "320px" : "0px", overflow: "hidden", transition: "max-height 0.28s cubic-bezier(0.4,0,0.2,1)" }}>
                      <div style={{ padding: "14px", borderTop: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: "10px", background: "#fff" }}>

                        {/* Email row */}
                        <div>
                          <label style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>Email</label>
                          <div style={{ display: "flex", alignItems: "center", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "9px 12px", gap: "8px" }}>
                            <span style={{ flex: 1, fontSize: "12px", color: "#374151", fontFamily: "'SF Mono','Fira Code',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{DEV_EMAIL}</span>
                            <button type="button" onClick={() => handleCopy(DEV_EMAIL, "email")} title="Copy email"
                              style={{ background: "none", border: "none", cursor: "pointer", color: copiedEmail ? "#10B981" : "#9CA3AF", display: "flex", alignItems: "center", padding: "2px", transition: "color 0.18s, transform 0.15s", flexShrink: 0, transform: copiedEmail ? "scale(1.15)" : "scale(1)" }}>
                              {copiedEmail ? <Check style={{ width: "13px", height: "13px" }} /> : <Copy style={{ width: "13px", height: "13px" }} />}
                            </button>
                          </div>
                        </div>

                        {/* Password row */}
                        <div>
                          <label style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>Password</label>
                          <div style={{ display: "flex", alignItems: "center", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "9px 12px", gap: "8px" }}>
                            <span style={{ flex: 1, fontSize: "12px", color: "#374151", fontFamily: "'SF Mono','Fira Code',monospace", letterSpacing: devShowPass ? "0" : "0.1em" }}>
                              {devShowPass ? DEV_PASS : "••••••••••"}
                            </span>
                            <button type="button" onClick={() => setDevShowPass(v => !v)} title={devShowPass ? "Hide" : "Show"}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center", padding: "2px", transition: "color 0.18s", flexShrink: 0 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#2563EB"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}>
                              {devShowPass ? <EyeOff style={{ width: "13px", height: "13px" }} /> : <Eye style={{ width: "13px", height: "13px" }} />}
                            </button>
                            <div style={{ width: "1px", height: "14px", background: "#E5E7EB", flexShrink: 0 }} />
                            <button type="button" onClick={() => handleCopy(DEV_PASS, "pass")} title="Copy password"
                              style={{ background: "none", border: "none", cursor: "pointer", color: copiedPass ? "#10B981" : "#9CA3AF", display: "flex", alignItems: "center", padding: "2px", transition: "color 0.18s, transform 0.15s", flexShrink: 0, transform: copiedPass ? "scale(1.15)" : "scale(1)" }}>
                              {copiedPass ? <Check style={{ width: "13px", height: "13px" }} /> : <Copy style={{ width: "13px", height: "13px" }} />}
                            </button>
                          </div>
                        </div>

                        {/* Note */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "9px 11px", borderRadius: "8px", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                          <Info style={{ width: "12px", height: "12px", color: "#2563EB", flexShrink: 0, marginTop: "1px" }} />
                          <p style={{ fontSize: "11px", color: "#3B82F6", lineHeight: 1.5, margin: 0 }}>
                            This panel is only available in local development and is automatically hidden in production.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: "1px", background: "#F3F4F6" }} />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isDisabled}
                  style={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "12px",
                    background: isDisabled ? "#93C5FD" : "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                    border: "none",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                    boxShadow: isDisabled ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => { if (!isDisabled) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(37,99,235,0.45)"; } }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = isDisabled ? "none" : "0 4px 14px rgba(37,99,235,0.35)"; }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "adminSpin 0.7s linear infinite", display: "inline-block" }} />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign in to Admin Portal
                      <ArrowRight style={{ width: "16px", height: "16px" }} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Below card */}
            <p style={{ textAlign: "center", fontSize: "12px", color: "#9CA3AF", marginTop: "20px", lineHeight: 1.6 }}>
              🔒 All sessions are encrypted and monitored.<br />
              Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#fff", borderTop: "1px solid #E5E7EB", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ fontSize: "12px", color: "#9CA3AF" }}>© 2026 Traveloop. All rights reserved.</p>
        <div style={{ display: "flex", gap: "20px" }}>
          {["Privacy Policy", "Terms of Service", "Support"].map((link) => (
            <a key={link} href="#" style={{ fontSize: "12px", color: "#9CA3AF", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#2563EB"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#9CA3AF"; }}>
              {link}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes adminSpin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(52,211,153,0.4); } 50% { opacity:0.7; box-shadow: 0 0 0 5px rgba(52,211,153,0); } }
        input::placeholder { color: #9CA3AF; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default Auth;
