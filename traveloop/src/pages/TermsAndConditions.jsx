import React, { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, AlertTriangle } from "lucide-react";
import TermsContent from "../components/auth/TermsContent";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const force = searchParams.get("force") === "true";
  const { refreshUserData, token, isAuthenticated } = useAuth();
  const toast = useToast();
  
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const acceptingRef = useRef(false);

  const handleAccept = async () => {
    if (acceptingRef.current) return; // prevent double invocation
    acceptingRef.current = true;
    setAccepting(true);
    setError("");
    try {
      if (!isAuthenticated || !token || token.split('.').length !== 3) {
        setError("Invalid session. Please log in again to accept terms.");
        console.warn("[Terms] Aborting accept-terms: Invalid or missing token.");
        window.dispatchEvent(new CustomEvent("auth:expired"));
        return;
      }

      const res = await fetch(getApiUrl("auth/accept-terms"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          termsVersion: "2026-06"
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Terms & Conditions accepted!");
        // Refresh context user data to update termsVersion in memory/localStorage
        await refreshUserData();
        navigate("/dashboard", { replace: true });
      } else {
        setError(data.message || "Failed to save terms acceptance.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setAccepting(false);
      acceptingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {!force && (
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"
              aria-label="Go back"
            >
              <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Terms & Conditions</h1>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">Last updated: June 2026</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Container */}
        <div className="max-h-[60vh] overflow-y-auto pr-1 select-text scroll-smooth hide-scrollbar mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <TermsContent />
        </div>

        {/* Action Button for Forced Re-acceptance */}
        {force && (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-4 rounded-full text-white font-bold text-sm shadow-[0_4px_12px_rgba(20,184,181,0.2)] active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
          >
            {accepting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <Check size={16} />
                I Agree and Continue
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TermsAndConditions;
