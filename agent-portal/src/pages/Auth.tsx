import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass, ShieldCheck, AlertTriangle, X,
  Sun, Moon, HelpCircle, Headphones, Globe,
  CheckCircle2, Package, Bus, CreditCard,
  Calendar, TrendingUp, Star, Lock,
} from "lucide-react";
import { getRedirectResult } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { EmailOTPLogin } from "../features/auth/components/EmailOTPLogin";
import { GoogleLoginButton } from "../features/auth/components/GoogleLoginButton";

/* ─────────────────────────────────────────────────────────────
   PORTAL FEATURES
───────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Package,    label: "Publish Tour Packages" },
  { icon: Bus,        label: "Manage Drivers" },
  { icon: CreditCard, label: "Booking Management" },
  { icon: Calendar,   label: "Trip Calendar" },
  { icon: TrendingUp, label: "Revenue Dashboard" },
  { icon: Star,       label: "Customer Reviews" },
  { icon: Lock,       label: "Secure Authentication" },
];

/* ─────────────────────────────────────────────────────────────
   ERROR ALERT — never exposes backend details
───────────────────────────────────────────────────────────── */
const ErrorAlert: React.FC<{ message: string | null; onDismiss: () => void }> = ({
  message, onDismiss,
}) => {
  if (!message) return null;
  const isTechnical = /mongodb|mongoose|e11000|collection|index|stack|traceback/i.test(message);
  const displayMsg = isTechnical ? "Please try again later." : message;

  return (
    <div className="ap-error" role="alert">
      <AlertTriangle size={15} className="ap-error__icon" aria-hidden />
      <div className="ap-error__body">
        <span className="ap-error__title">Unable to sign in</span>
        <span className="ap-error__text">{displayMsg}</span>
      </div>
      <button onClick={onDismiss} className="ap-error__close" aria-label="Dismiss error">
        <X size={13} />
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────── */
const Navbar: React.FC = () => {
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={`ap-nav${scrolled ? " ap-nav--raised" : ""}`}>
      <div className="ap-nav__inner">
        {/* Brand */}
        <div className="ap-nav__brand">
          <div className="ap-nav__logo-wrap">
            <Compass size={17} strokeWidth={2.5} />
          </div>
          <div className="ap-nav__brand-copy">
            <span className="ap-nav__brand-name">Traveloop</span>
            <span className="ap-nav__brand-tag">Agent Portal</span>
          </div>
        </div>

        {/* Right utility */}
        <nav className="ap-nav__utils" aria-label="Portal utilities">
          <a href="#" className="ap-nav__util-link">
            <HelpCircle size={14} aria-hidden />
            Help Center
          </a>
          <a href="#" className="ap-nav__util-link">
            <Headphones size={14} aria-hidden />
            Support
          </a>
          <button className="ap-nav__util-link ap-nav__util-link--btn" aria-label="Select language">
            <Globe size={14} aria-hidden />
            EN
          </button>
          <div className="ap-nav__divider" aria-hidden />
          <button
            className="ap-nav__theme-btn"
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </nav>
      </div>
    </header>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export const Auth: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  // Redirect if already signed in
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleAuthSuccess = () => navigate("/dashboard", { replace: true });
  const handleAuthError = (err: string) => setErrorMsg(err || "Unable to sign in");

  // Handle Google redirect result (once on mount)
  useEffect(() => {
    if (isAuthenticated) { setIsCheckingRedirect(false); return; }
    (async () => {
      try {
        if (!auth) throw new Error("Firebase not initialised");
        const result = await getRedirectResult(auth);
        if (result) {
          const idToken = await result.user.getIdToken(true);
          const { data } = await api.post("/agent/login", {
            idToken,
            email: result.user.email,
            uid: result.user.uid,
          });
          setAuth(data.token, data.agent);
          handleAuthSuccess();
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unable to sign in";
        setErrorMsg(msg);
      } finally {
        setIsCheckingRedirect(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isAuthenticated) return null;

  return (
    <div className="ap-page">
      {/* Background layers */}
      <div className="ap-bg" aria-hidden>
        <div className="ap-bg__radial ap-bg__radial--tl" />
        <div className="ap-bg__radial ap-bg__radial--br" />
        <div className="ap-bg__grid" />
      </div>

      <Navbar />

      <main className="ap-layout">
        {/* ── LEFT PANEL ── */}
        <section className="ap-left" aria-label="Portal information">
          {/* Verification badge */}
          <div className="ap-left__badge">
            <ShieldCheck size={13} strokeWidth={2.5} />
            Authorized Travel Agencies Only
          </div>

          {/* Heading */}
          <h1 className="ap-left__heading">
            Travel Agency<br />
            <span className="ap-left__heading-accent">Management Portal</span>
          </h1>

          {/* Subtitle */}
          <p className="ap-left__sub">
            Sign in to manage trips, drivers, bookings, pricing, customers and
            analytics from one secure dashboard.
          </p>

          {/* Feature list */}
          <ul className="ap-features" role="list">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="ap-feature">
                <span className="ap-feature__check" aria-hidden>
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                </span>
                <span className="ap-feature__icon" aria-hidden>
                  <Icon size={14} strokeWidth={2} />
                </span>
                <span className="ap-feature__label">{label}</span>
              </li>
            ))}
          </ul>

          {/* Trust row */}
          <div className="ap-left__trust">
            <span className="ap-left__trust-dot" />
            <span>256-bit SSL encryption</span>
            <span className="ap-left__trust-sep" aria-hidden>·</span>
            <span className="ap-left__trust-dot" />
            <span>Firebase Authentication</span>
            <span className="ap-left__trust-sep" aria-hidden>·</span>
            <span className="ap-left__trust-dot" />
            <span>GDPR Compliant</span>
          </div>
        </section>

        {/* ── RIGHT PANEL ── */}
        <section className="ap-right" aria-label="Sign in" id="login">
          <div className="ap-card">
            {/* Card header */}
            <div className="ap-card__header">
              <div className="ap-card__logo">
                <Compass size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="ap-card__title">Welcome Back</h2>
                <p className="ap-card__sub">Sign in to access your agency workspace.</p>
              </div>
            </div>

            {/* Secure badge */}
            <div className="ap-card__secure">
              <ShieldCheck size={13} />
              Secured with enterprise-grade encryption
            </div>

            {/* Error */}
            <ErrorAlert message={errorMsg} onDismiss={() => setErrorMsg(null)} />

            {/* Auth UI */}
            {isCheckingRedirect ? (
              <div className="ap-card__loading">
                <div className="ap-spinner" />
                <span>Checking session…</span>
              </div>
            ) : (
              <div className="ap-card__methods">
                <GoogleLoginButton onSuccess={handleAuthSuccess} onError={handleAuthError} />

                <div className="ap-divider">
                  <div className="ap-divider__line" />
                  <span className="ap-divider__text">or continue with</span>
                  <div className="ap-divider__line" />
                </div>

                <EmailOTPLogin onSuccess={handleAuthSuccess} onError={handleAuthError} />
              </div>
            )}

            {/* Legal note */}
            <p className="ap-card__legal">
              By signing in, you confirm you represent a registered travel agency.
              Non-registered accounts undergo review and verification.
            </p>
          </div>

          {/* Footer links */}
          <div className="ap-card__footer-links">
            <a href="#">Privacy Policy</a>
            <span aria-hidden>·</span>
            <a href="#">Terms of Service</a>
            <span aria-hidden>·</span>
            <a href="#">Contact Support</a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Auth;
