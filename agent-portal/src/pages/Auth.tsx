import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Compass, Sparkles, ShieldCheck } from "lucide-react";
import { getRedirectResult } from "firebase/auth";
import { auth } from "../../../traveloop/src/services/firebase";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { GlassCard } from "../components/ui";
import { EmailOTPLogin } from "../features/auth/components/EmailOTPLogin";
import { GoogleLoginButton } from "../features/auth/components/GoogleLoginButton";

export const Auth: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  // ── If already authenticated, go straight to dashboard ─────────────────
  useEffect(() => {
    if (isAuthenticated) {
      console.log("[Auth Page] Already authenticated. Redirecting to dashboard...");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleAuthSuccess = () => {
    console.log("[Auth Page] Auth successful. Redirecting to dashboard...");
    navigate("/dashboard", { replace: true });
  };

  const handleAuthError = (err: string) => {
    setErrorMsg(err);
  };

  // ── Check for Google Redirect Result (runs exactly once on mount) ───────
  useEffect(() => {
    // Only check for redirect if not already authenticated
    if (isAuthenticated) {
      setIsCheckingRedirect(false);
      return;
    }

    const handleRedirectResult = async () => {
      try {
        console.log("[Google Auth] Checking for redirect sign-in result (once on mount)...");
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("[Google Auth] Redirect result found. Exchanging token with backend...");
          const firebaseUser = result.user;
          const idToken = await firebaseUser.getIdToken(true);

          const response = await api.post("/agent/login", {
            idToken,
            email: firebaseUser.email,
            uid: firebaseUser.uid,
          });

          if (!response || !response.data) {
            throw new Error("Backend returned null response");
          }
          const resData = response.data;
          setAuth(resData.token, resData.agent);
          handleAuthSuccess();
        } else {
          console.log("[Google Auth] No pending redirect result.");
        }
      } catch (err: any) {
        console.error("[Google Auth] Error processing redirect result:", err);
        setErrorMsg(err.message || "Failed to process Google redirect sign-in");
      } finally {
        setIsCheckingRedirect(false);
      }
    };

    handleRedirectResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps — run exactly ONCE on mount, never on re-renders or route changes

  // Don't render auth UI if already authenticated (prevents flash)
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 auth-bg">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-white font-black text-2xl shadow-brand-lg mb-3 animate-float">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            Agent Portal
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Reconnecting Group Journeys
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        <GlassCard>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                Agent Sign In
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Authorized Traveloop agencies access only.
              </p>
            </div>

            {isCheckingRedirect ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-semibold text-slate-500">Processing sign-in...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Google Login */}
                <GoogleLoginButton onSuccess={handleAuthSuccess} onError={handleAuthError} />

                {/* Divider */}
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    or
                  </span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                {/* Email OTP Login */}
                <EmailOTPLogin onSuccess={handleAuthSuccess} onError={handleAuthError} />
              </div>
            )}

            <div className="p-4 rounded-xl bg-teal-50/30 dark:bg-teal-950/10 border border-primary/20 flex gap-3 items-start mt-6">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed font-semibold">
                By logging in, you represent that you are a registered travel agency. Non-registered accounts will undergo review and verification.
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Auth;
