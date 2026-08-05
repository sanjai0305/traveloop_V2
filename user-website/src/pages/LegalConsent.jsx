// src/pages/LegalConsent.jsx
// Premium Enterprise SaaS Legal Consent Onboarding Screen - TravelLoop

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Shield,
  ArrowRight,
  Loader2,
  Lock,
  UserCheck,
  ShieldCheck,
  FileText,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";
import VerifyPhone from "./VerifyPhone";

export const LegalConsent = () => {
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated, loading, userRefreshed } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState("consent"); // "consent" | "phone"
  
  // Persisted checkbox states
  const [termsAccepted, setTermsAccepted] = useState(() => {
    return sessionStorage.getItem("tl_terms_accepted") === "true";
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(() => {
    return sessionStorage.getItem("tl_privacy_accepted") === "true";
  });

  // Track if documents have been reviewed
  const [termsReviewed, setTermsReviewed] = useState(() => {
    return sessionStorage.getItem("tl_terms_reviewed") === "true";
  });
  const [privacyReviewed, setPrivacyReviewed] = useState(() => {
    return sessionStorage.getItem("tl_privacy_reviewed") === "true";
  });

  const [submitting, setSubmitting] = useState(false);

  const canSubmit = termsAccepted && privacyAccepted;

  // Sync checkbox changes to sessionStorage
  const handleTermsToggle = (checked) => {
    setTermsAccepted(checked);
    sessionStorage.setItem("tl_terms_accepted", checked ? "true" : "false");
  };

  const handlePrivacyToggle = (checked) => {
    setPrivacyAccepted(checked);
    sessionStorage.setItem("tl_privacy_accepted", checked ? "true" : "false");
  };

  // Direct link handlers (open legal site in new browser tab, keep current page open)
  const handleOpenTerms = () => {
    setTermsReviewed(true);
    sessionStorage.setItem("tl_terms_reviewed", "true");
    window.open(
      "https://traveloop-v2-j88c.vercel.app/",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleOpenPrivacy = () => {
    setPrivacyReviewed(true);
    sessionStorage.setItem("tl_privacy_reviewed", "true");
    window.open(
      "https://traveloop-v2-j88c.vercel.app/",
      "_blank",
      "noopener,noreferrer"
    );
  };

  useEffect(() => {
    if (!loading && userRefreshed && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, loading, userRefreshed, navigate]);

  const handleAccept = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("legal/accept"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?._id || user?.id,
          acceptedTerms: true,
          acceptedPrivacy: true,
          acceptedAt: new Date().toISOString(),
          termsVersion: "2026-07",
        }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedProfile = {
          ...(data.user || user),
          acceptedTerms: true,
          privacyAccepted: true,
          phoneVerified: true,
        };
        updateUser(updatedProfile);
        toast.success("Legal consent saved successfully.");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error(data.message || "Failed to accept terms. Please try again.");
      }
    } catch (err) {
      console.error("[LegalConsent] Error accepting terms:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col font-sans relative overflow-x-hidden select-none"
      style={{
        background: "linear-gradient(180deg, #020617 0%, #0B1220 100%)",
      }}
    >
      {/* ── SOFT AMBIENT RADIAL LIGHTING (No Bright Cyan/Neon) ── */}
      {/* Top-Right Blue Radial Glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[550px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none" />
      {/* Bottom-Left Purple Radial Glow */}
      <div className="absolute bottom-0 left-0 w-[750px] h-[500px] bg-purple-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Subtle Grid Texture (3% Opacity) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── MAIN CONTAINER (MAX WIDTH 1400px) ── */}
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-10 flex-1 flex flex-col justify-center z-10">
        
        <AnimatePresence mode="wait">
          {step === "consent" ? (
            <motion.div
              key="consent-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch"
            >
              {/* ── LEFT PANEL (35% WIDTH -> lg:col-span-5) ── */}
              <div
                className="lg:col-span-5 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden shadow-xl"
                style={{
                  background: "#0F172A",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "24px",
                  padding: "40px",
                }}
              >
                <div className="space-y-10 relative z-10">
                  {/* Category Pill */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#60A5FA] text-xs font-bold uppercase tracking-widest">
                    <Lock className="w-3.5 h-3.5" /> ACCOUNT ONBOARDING
                  </div>

                  {/* Heading & Subtitle */}
                  <div className="space-y-4">
                    <h1 className="text-[40px] lg:text-[48px] font-bold text-white tracking-tight leading-[1.15]">
                      Welcome to <span className="text-white">Travel</span><span className="text-[#3B82F6]">Loop</span>
                    </h1>
                    <p className="text-[18px] text-[#CBD5E1] font-normal leading-relaxed">
                      Before creating your account, please review and accept our legal documents.
                    </p>
                  </div>

                  {/* 3 FEATURE CARDS */}
                  <div className="space-y-4">
                    {/* Feature 1 */}
                    <div className="p-4 rounded-[16px] bg-[#1E293B]/70 border border-white/[0.06] flex items-start gap-4 hover:border-[#3B82F6]/30 transition-all">
                      <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">Secure Account</h3>
                        <p className="text-[14px] text-[#94A3B8] leading-relaxed">Enterprise encryption protects your profile & credentials.</p>
                      </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="p-4 rounded-[16px] bg-[#1E293B]/70 border border-white/[0.06] flex items-start gap-4 hover:border-[#3B82F6]/30 transition-all">
                      <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">Verified Traveler</h3>
                        <p className="text-[14px] text-[#94A3B8] leading-relaxed">Instant passenger confirmation across all travel itineraries.</p>
                      </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="p-4 rounded-[16px] bg-[#1E293B]/70 border border-white/[0.06] flex items-start gap-4 hover:border-[#3B82F6]/30 transition-all">
                      <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">Privacy Protected</h3>
                        <p className="text-[14px] text-[#94A3B8] leading-relaxed">Your data is strictly encrypted and never sold to third parties.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Enterprise Standard Graphic */}
                <div className="mt-10 pt-6 border-t border-white/[0.06] flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      Enterprise Compliance <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    </h4>
                    <p className="text-[12px] text-[#94A3B8] leading-snug">
                      ISO/IEC 27001 data encryption standards applied.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── RIGHT PANEL (65% WIDTH -> lg:col-span-7) ── */}
              <div
                className="lg:col-span-7 backdrop-blur-xl shadow-2xl flex flex-col justify-between space-y-10"
                style={{
                  background: "#111827",
                  borderRadius: "24px",
                  padding: "40px",
                }}
              >
                <div className="space-y-10">
                  {/* Top Logo Area & Stepper */}
                  <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
                    {/* TravelLoop Branding */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/20">
                        TL
                      </div>
                      <span className="text-2xl font-bold tracking-tight uppercase">
                        <span className="text-white">Travel</span>
                        <span className="text-[#3B82F6]">Loop</span>
                      </span>
                    </div>

                    {/* Progress Stepper */}
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div className="flex items-center gap-2 text-[#60A5FA]">
                        <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-[#3B82F6] flex items-center justify-center text-white font-bold text-[11px]">
                          1
                        </span>
                        <span>Legal Documents</span>
                      </div>
                      <span className="text-slate-600">→</span>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-bold text-[11px]">
                          2
                        </span>
                        <span>Phone Verification</span>
                      </div>
                    </div>
                  </div>

                  {/* Heading & Subtitle */}
                  <div className="space-y-3">
                    <h2 className="text-[32px] font-bold text-white tracking-tight">
                      Review & Accept Legal Documents
                    </h2>
                    <p className="text-[16px] text-[#94A3B8] font-normal">
                      Please read the following documents before continuing.
                    </p>
                  </div>

                  {/* DOCUMENT CARDS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CARD 1: Terms & Conditions */}
                    <div
                      onClick={handleOpenTerms}
                      className="p-7 rounded-[20px] bg-[#1E293B] border border-white/[0.08] hover:border-[#3B82F6] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] group cursor-pointer"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                            <FileText className="w-6 h-6 text-white" />
                          </div>

                          {/* Reviewed Badge */}
                          {termsReviewed ? (
                            <span
                              className="px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border"
                              style={{
                                background: "rgba(34, 197, 94, 0.12)",
                                borderColor: "rgba(34, 197, 94, 0.30)",
                                color: "#22C55E",
                              }}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Reviewed
                            </span>
                          ) : (
                            <span className="px-3.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-semibold">
                              Unreviewed
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#60A5FA] transition-colors">
                            Terms & Conditions
                          </h3>
                          <p className="text-[14px] text-[#94A3B8] leading-relaxed">
                            Review the rules, responsibilities, and usage policies of TravelLoop.
                          </p>
                        </div>
                      </div>

                      {/* Read Document Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTerms();
                        }}
                        className="w-full px-[22px] py-[14px] rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-white/[0.08] hover:border-[#475569] text-[#E2E8F0] font-semibold text-[15px] tracking-[0.2px] flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all duration-250 ease-out shadow-sm"
                      >
                        Read Document <ChevronRight className="w-4 h-4 text-[#60A5FA]" />
                      </button>
                    </div>

                    {/* CARD 2: Privacy Policy */}
                    <div
                      onClick={handleOpenPrivacy}
                      className="p-7 rounded-[20px] bg-[#1E293B] border border-white/[0.08] hover:border-[#3B82F6] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] group cursor-pointer"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                            <Shield className="w-6 h-6 text-white" />
                          </div>

                          {/* Reviewed Badge */}
                          {privacyReviewed ? (
                            <span
                              className="px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border"
                              style={{
                                background: "rgba(34, 197, 94, 0.12)",
                                borderColor: "rgba(34, 197, 94, 0.30)",
                                color: "#22C55E",
                              }}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Reviewed
                            </span>
                          ) : (
                            <span className="px-3.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-semibold">
                              Unreviewed
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#60A5FA] transition-colors">
                            Privacy Policy
                          </h3>
                          <p className="text-[14px] text-[#94A3B8] leading-relaxed">
                            Understand how we collect, store, and protect your personal information.
                          </p>
                        </div>
                      </div>

                      {/* Read Document Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPrivacy();
                        }}
                        className="w-full px-[22px] py-[14px] rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-white/[0.08] hover:border-[#475569] text-[#E2E8F0] font-semibold text-[15px] tracking-[0.2px] flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all duration-250 ease-out shadow-sm"
                      >
                        Read Document <ChevronRight className="w-4 h-4 text-[#60A5FA]" />
                      </button>
                    </div>
                  </div>

                  {/* AGREEMENT CHECKBOX SECTION */}
                  <div className="space-y-4 pt-6 border-t border-white/[0.08]">
                    <label className="flex items-center gap-4 cursor-pointer group select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => handleTermsToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-6 h-6 rounded-lg border-2 border-slate-700 bg-slate-900 peer-checked:border-[#2563EB] peer-checked:bg-[#2563EB] flex items-center justify-center transition-all peer-checked:scale-105">
                          {termsAccepted && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </div>
                      </div>
                      <span className="text-base text-[#CBD5E1] font-medium group-hover:text-white transition-colors">
                        I agree to the <span className="text-white font-bold">Terms & Conditions</span>
                      </span>
                    </label>

                    <label className="flex items-center gap-4 cursor-pointer group select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={privacyAccepted}
                          onChange={(e) => handlePrivacyToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-6 h-6 rounded-lg border-2 border-slate-700 bg-slate-900 peer-checked:border-[#2563EB] peer-checked:bg-[#2563EB] flex items-center justify-center transition-all peer-checked:scale-105">
                          {privacyAccepted && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </div>
                      </div>
                      <span className="text-base text-[#CBD5E1] font-medium group-hover:text-white transition-colors">
                        I agree to the <span className="text-white font-bold">Privacy Policy</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* BOTTOM CTA BUTTON AREA */}
                <div className="space-y-3 pt-6">
                  {canSubmit && (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#22C55E] animate-fade-in">
                      <Check className="w-4 h-4 stroke-[3]" /> Ready to Continue
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={!canSubmit || submitting}
                    className={`w-full h-[60px] rounded-[16px] border border-white/10 font-bold text-[20px] tracking-wide transition-all duration-300 flex items-center justify-between px-8 select-none ${
                      canSubmit && !submitting
                        ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white hover:scale-[1.01] hover:-translate-y-0.5 shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.65)] cursor-pointer"
                        : "bg-[#1E293B] text-[#64748B] opacity-75 cursor-not-allowed"
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-3 mx-auto">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                        Processing Consent...
                      </span>
                    ) : (
                      <>
                        <span>Accept & Continue</span>
                        <ArrowRight className="w-6 h-6 text-white ml-auto" />
                      </>
                    )}
                  </button>
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div
              key="phone-step-view"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
            >
              <VerifyPhone isModal={true} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* FOOTER */}
      <footer className="w-full max-w-[1400px] mx-auto px-6 py-6 text-center text-xs text-[#94A3B8] border-t border-white/[0.04] z-10">
        © {new Date().getFullYear()} TravelLoop Inc. All rights reserved. · Enterprise Legal Security & Compliance
      </footer>
    </div>
  );
};

export default LegalConsent;
