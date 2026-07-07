// src/pages/LegalConsent.tsx
// Premium Legal Consent Screen (Acceptance Only) - Agent Portal

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Shield, ArrowRight, Loader2, FileText, ChevronRight } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";

const LegalConsent: React.FC = () => {
  const navigate = useNavigate();
  const { agent, setAuth, isAuthenticated, isLoading } = useAuthStore();
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = termsAccepted && privacyAccepted;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleAccept = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const response = await api.post("/legal/accept", {
        userId: agent?._id,
        acceptedTerms: true,
        acceptedAt: new Date().toISOString(),
        termsVersion: "2026-07",
      });

      if (response.data.success) {
        const updatedAgent = response.data.agent;
        if (updatedAgent) {
          setAuth(localStorage.getItem("agentToken") || "", updatedAgent);
        }
        alert("Legal consent saved successfully.");
        navigate("/dashboard", { replace: true });
      } else {
        alert(response.data.message || "Failed to accept terms. Please try again.");
      }
    } catch (err: any) {
      console.error("[LegalConsent] Error accepting terms:", err);
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-12 right-12 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-10 z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 text-base">
          TL
        </div>
        <span className="text-xl font-extrabold tracking-tight text-white uppercase">
          Agent<span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Portal</span>
        </span>
      </div>

      <div className="w-full max-w-xl z-10">
        {/* Card Component */}
        <div className="bg-slate-950/45 backdrop-blur-xl border border-slate-900 rounded-[28px] p-8 md:p-10 shadow-2xl relative">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
                Before you continue
              </h2>
              <p className="text-slate-400 text-sm">
                Please review and accept our legal documents to set up your profile.
              </p>
            </div>

            <div className="space-y-4">
              {/* Terms & Conditions Card */}
              <div className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-1">Terms & Conditions</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Review the rules and guidelines governing the use of TravelLoop Agent Portal services.
                  </p>
                  <a
                    href="https://traveloop-v2-j88c.vercel.app/index.html?doc=terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Read Terms & Conditions
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Privacy Policy Card */}
              <div className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-950/50 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-1">Privacy Policy</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Learn how we securely collect, use, and process your personal travel details.
                  </p>
                  <a
                    href="https://traveloop-v2-j88c.vercel.app/index.html?doc=privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    Read Privacy Policy
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3.5 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-900 peer-checked:border-cyan-500 peer-checked:bg-cyan-500 flex items-center justify-center transition-all">
                    {termsAccepted && <Check className="w-3.5 h-3.5 text-slate-950 font-black" />}
                  </div>
                </div>
                <span className="text-xs text-slate-300 font-medium">
                  I have read and agree to the <span className="text-white font-bold">Terms & Conditions</span>.
                </span>
              </label>

              <label className="flex items-center gap-3.5 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-900 peer-checked:border-teal-500 peer-checked:bg-teal-500 flex items-center justify-center transition-all">
                    {privacyAccepted && <Check className="w-3.5 h-3.5 text-slate-950 font-black" />}
                  </div>
                </div>
                <span className="text-xs text-slate-300 font-medium">
                  I have read and agree to the <span className="text-white font-bold">Privacy Policy</span>.
                </span>
              </label>
            </div>

            {/* Action button */}
            <button
              onClick={handleAccept}
              disabled={!canSubmit || submitting}
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                canSubmit && !submitting
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-[0.98]"
                  : "bg-slate-900 border border-slate-800/80 text-slate-600 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving consent...
                </>
              ) : (
                <>
                  Accept & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center z-10">
        <p className="text-slate-600 text-xs font-semibold">
          Secure verification powered by Firebase Authentication
        </p>
      </div>
    </div>
  );
};

export default LegalConsent;
