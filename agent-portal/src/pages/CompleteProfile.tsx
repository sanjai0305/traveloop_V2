// src/pages/CompleteProfile.tsx
// Profile Completion & Verification Wizard (5-step) - Pixel-Perfect Enterprise SaaS Layout

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Sparkles, ShieldCheck, ArrowRight, ArrowLeft,
  Mail, Phone, FileText, CheckCircle2, Shield, Info, Clock,
  Save, AlertCircle, HelpCircle, Lock, Award, Check
} from "lucide-react";
import { Button, Input, ImageUploadBox } from "../components/ui";
import { OTPInput } from "../features/auth/components/OTPInput";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { auth } from "../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export const CompleteProfile: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { agent, updateAgent } = useAuthStore();

  // Form Fields State
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("8637628773");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [companyName, setCompanyName] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [agentPhoto, setAgentPhoto] = useState("");

  // Legal Consent Checkboxes
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // OTP Verification States
  const [mobileOtp, setMobileOtp] = useState("");
  const [otpSentMobile, setOtpSentMobile] = useState(false);

  const canSubmit = termsAccepted && privacyAccepted;

  // Sync step to URL query param without triggering full reload
  const syncStepToUrl = (stepNum: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("step", stepNum.toString());
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState(null, "", newUrl);
  };

  // Helper to persist step change to backend state machine
  const saveStepProgress = async (nextStep: number, formPayload?: Record<string, any>) => {
    try {
      const completedList = Array.from(new Set([...(agent?.completedSteps || []), ...Array.from({ length: nextStep - 1 }, (_, i) => i + 1)]));
      const compPercentage = Math.min(100, Math.round((nextStep / 5) * 100));

      console.log(`[ONBOARDING WIZARD] Saving step progress: Target Step=${nextStep}, CompletedSteps=${JSON.stringify(completedList)}, Completion=${compPercentage}%`);

      const response = await api.patch("/agent/profile/onboarding", {
        currentStep: nextStep,
        completedSteps: completedList,
        profileCompletion: compPercentage,
        formData: formPayload
      });

      if (response.data?.success && response.data?.agent) {
        updateAgent(response.data.agent);
        console.log(`[ONBOARDING WIZARD] Backend successfully confirmed currentStep=${response.data.agent.currentStep}`);
        return response.data.agent;
      }
    } catch (err: any) {
      console.error("[ONBOARDING WIZARD ERROR] Failed to save step to backend:", err);
    }
    return null;
  };

  // Initialize fields & step state from agent / backend / URL on mount
  useEffect(() => {
    if (agent) {
      setName(agent.displayName || "");
      setDob(agent.dob || "");
      setMobile(agent.mobile || agent.phone || "8637628773");
      setState(agent.state || "");
      setCountry(agent.country || "India");
      setCompanyName(agent.companyName || "");
      setGstNo(agent.gstNo || agent.gstNumber || "");
      setCompanyLogo(agent.companyLogo || agent.logo || "");
      setAgentPhoto(agent.agentPhoto || agent.profileImage || "");

      // 1. Backend currentStep is the primary source of truth
      let resolvedStep = agent.currentStep || 1;

      // 2. Read URL query param
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get("step");
      if (urlStep) {
        const parsedUrlStep = parseInt(urlStep, 10);
        if (parsedUrlStep >= 1 && parsedUrlStep <= 5) {
          // If URL step differs from backend step, backend step prevails unless URL step is lower (allowed for viewing)
          if (parsedUrlStep <= resolvedStep) {
            resolvedStep = parsedUrlStep;
          }
        }
      }

      console.log(`[ONBOARDING INIT] Restored Step -> Backend Step: ${agent.currentStep}, URL Step: ${urlStep || 'None'}, Resolved Current Step: ${resolvedStep}`);

      setCurrentStep(resolvedStep);
      syncStepToUrl(resolvedStep);
    }
  }, [agent?._id]);

  // Calculate completion percentage dynamically
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (name && dob && mobile) score += 25;
    if (state && country) score += 20;
    if (companyName && gstNo && companyLogo && agentPhoto) score += 25;
    if (agent?.acceptedTerms || currentStep > 4) score += 15;
    if (agent?.mobileVerified) score += 15;
    return Math.min(100, Math.max(score, (currentStep - 1) * 20 + 10));
  }, [name, dob, mobile, state, country, companyName, gstNo, companyLogo, agentPhoto, currentStep, agent]);

  if (!agent) return null;

  const handleNext = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    const targetNextStep = currentStep + 1;
    console.log(`[ONBOARDING NEXT] Next Clicked | Frontend Current Step: ${currentStep} -> Target Step: ${targetNextStep}`);

    if (currentStep === 1) {
      if (!name.trim()) return setErrorMsg("Full Name is required");
      if (!dob) return setErrorMsg("Date of Birth is required");
      if (!mobile.trim()) return setErrorMsg("Mobile Number is required");
      if (!/^[0-9]{10}$/.test(mobile)) return setErrorMsg("Mobile number must be exactly 10 digits");

      await saveStepProgress(targetNextStep, { name, dob, mobile });
      setCurrentStep(targetNextStep);
      syncStepToUrl(targetNextStep);
    } else if (currentStep === 2) {
      if (!state.trim()) return setErrorMsg("State is required");
      if (!country.trim()) return setErrorMsg("Country is required");

      await saveStepProgress(targetNextStep, { state, country });
      setCurrentStep(targetNextStep);
      syncStepToUrl(targetNextStep);
    } else if (currentStep === 3) {
      if (!companyName.trim()) return setErrorMsg("Company Name is required");
      if (!gstNo.trim()) return setErrorMsg("GST Number is required");
      if (!companyLogo) return setErrorMsg("Company Logo is required");
      if (!agentPhoto) return setErrorMsg("Agent Photo is required");

      setLoading(true);
      try {
        const response = await api.post("/agent/profile/create", {
          name,
          dob,
          mobile,
          state,
          country,
          companyName,
          gstNo,
          companyLogo,
          agentPhoto
        });
        
        if (response.data?.success) {
          updateAgent(response.data.agent);
          await saveStepProgress(targetNextStep);
          setCurrentStep(targetNextStep);
          syncStepToUrl(targetNextStep);
        } else {
          setErrorMsg(response.data?.message || "Failed to initialize KYC profile");
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || "Error submitting profile details");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    const targetPrevStep = Math.max(1, currentStep - 1);
    console.log(`[ONBOARDING PREVIOUS] Previous Clicked | Frontend Current Step: ${currentStep} -> Target Prev Step: ${targetPrevStep}`);

    setCurrentStep(targetPrevStep);
    syncStepToUrl(targetPrevStep);

    // Save previous step in database so refresh keeps user on previous step
    await saveStepProgress(targetPrevStep);
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    await saveStepProgress(currentStep, { name, dob, mobile, state, country, companyName, gstNo, companyLogo, agentPhoto });
    setLoading(false);
    setSuccessMsg("Draft saved successfully.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Step 4: Legal Consent Actions
  const handleAcceptTerms = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const userId = agent?._id || agent?.id || agent?.agentId || undefined;

      const payload: Record<string, unknown> = {
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedAt: new Date().toISOString(),
        termsVersion: "2026-07",
      };

      if (userId) payload.userId = userId;

      const response = await api.post("/legal/accept", payload);

      if (response.data?.success) {
        const updatedAgent = response.data.agent;
        if (updatedAgent) {
          updateAgent(updatedAgent);
        }
        setSuccessMsg("Legal consent saved successfully.");
        const nextStep = 5;
        await saveStepProgress(nextStep);
        setTimeout(() => {
          setSuccessMsg("");
          setCurrentStep(nextStep);
          syncStepToUrl(nextStep);
        }, 1200);
      } else {
        setErrorMsg(response.data?.message || "Failed to save legal consent");
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || "Error submitting legal consent";
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Mobile OTP Actions
  const isValidProductionNumber = (num: string): boolean => /^[6-9][0-9]{9}$/.test(num);

  const isFirebaseTestNumber = (num: string): boolean => {
    const raw = import.meta.env.VITE_FIREBASE_TEST_PHONE_NUMBER as string | undefined;
    if (!raw) return false;
    const normalise = (n: string) => n.replace(/^\+?91/, "").replace(/^0/, "").trim();
    return normalise(num) === normalise(raw);
  };

  const sendMobileOtp = async () => {
    const isDev = import.meta.env.DEV;

    if (isDev && isFirebaseTestNumber(mobile)) {
      console.log("[DEV] Firebase Test Number detected:", mobile);
    } else if (!isValidProductionNumber(mobile)) {
      setErrorMsg("Please enter a valid 10-digit mobile number starting with 6-9");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.warn("[Recaptcha] Error clearing recaptcha verifier:", e);
        }
        (window as any).recaptchaVerifier = null;
      }

      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => { console.log("reCAPTCHA solved"); },
        "expired-callback": () => { console.log("reCAPTCHA expired"); }
      });

      const formattedPhone = `+91${mobile}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, (window as any).recaptchaVerifier);
      (window as any).confirmationResult = confirmationResult;
      setOtpSentMobile(true);
      setSuccessMsg(`Verification SMS sent successfully to ${mobile}`);
    } catch (err: any) {
      console.error("Firebase SMS send error:", err);
      setErrorMsg(err.message || "Failed to send OTP via Firebase.");
    } finally {
      setLoading(false);
    }
  };

  const verifyMobileOtp = async () => {
    if (mobileOtp.length !== 6) return setErrorMsg("Please enter a valid 6-digit OTP");
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      if (!(window as any).confirmationResult) {
        throw new Error("No active phone verification session found.");
      }
      const result = await (window as any).confirmationResult.confirm(mobileOtp);
      const idToken = await result.user.getIdToken();

      const response = await api.post("/agent/verify-mobile-otp", { idToken, phone: `+91${mobile}` });
      if (response.data?.success) {
        console.log("[MOBILE OTP] OTP Verified");
        console.log("[MOBILE OTP] Saving onboardingCompleted=true");
        console.log("[MOBILE OTP] Mongo updated");
        
        // Update local auth store
        updateAgent(response.data.agent);
        console.log("[MOBILE OTP] Profile refreshed");

        if (response.data.onboardingCompleted || response.data.agent?.onboardingComplete) {
          console.log("[MOBILE OTP] Redirecting to Dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          setSuccessMsg("Mobile verified successfully!");
        }
      } else {
        setErrorMsg(response.data?.message || "Verification failed");
      }
    } catch (err: any) {
      console.error("[MOBILE OTP ERROR] Firebase SMS verify error:", err);
      setErrorMsg(err.message || "Invalid OTP code entered.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    "Personal Details",
    "Address Details",
    "Company Details",
    "Legal Consent",
    "Mobile OTP Verification"
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a13] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      
      {/* ── 1. GLOBAL CONTAINER & NAVBAR (1440px Max Width) ─────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white shadow-teal-500/20 shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">Traveloop</span>
                <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Agent Portal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Est. Completion: <strong className="text-slate-800 dark:text-slate-200">~3 mins</strong></span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <button onClick={() => navigate("/dashboard")} className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1.5 transition-colors">
              <HelpCircle className="w-4 h-4" /> Help Center
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-9 pb-16">
        
        {/* ── 2 & 3. PAGE HEADER & TITLE (48px Font Weight 800, Vertical Line Alignment) ─ */}
        <div className="mb-9 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/50 text-xs font-bold text-teal-700 dark:text-teal-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" /> Agency Onboarding & KYC Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Complete Agent Profile Verification
          </h1>
          <p className="text-base lg:text-[18px] text-slate-500 dark:text-slate-400 font-normal leading-[1.7] mt-2 max-w-4xl">
            Sign in to manage trips, drivers, bookings, pricing, customers and analytics from one secure dashboard.
          </p>
        </div>

        {/* ── 4. STEP CARD / STEPPER (32px Padding, Perfectly Centered & Equal Widths) ──── */}
        <div className="mb-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Step {currentStep} of 5: <strong className="text-slate-900 dark:text-white font-extrabold text-sm ml-1">{stepTitles[currentStep - 1]}</strong>
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {completionPercentage}% Complete
            </span>
          </div>

          {/* Stepper bar with equal widths and distinct state colors */}
          <div className="grid grid-cols-5 gap-3 sm:gap-4 items-center">
            {[1, 2, 3, 4, 5].map((s) => {
              const isDone = s < currentStep;
              const isCurrent = s === currentStep;
              return (
                <div key={s} className="flex flex-col gap-2.5">
                  <div className={`h-2.5 rounded-full transition-all duration-500 ${
                    isDone
                      ? "bg-teal-600"
                      : isCurrent
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 shadow-xs"
                      : "bg-slate-200 dark:bg-slate-800"
                  }`} />
                  <div className="hidden md:flex items-center gap-2 text-xs font-bold">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      isDone ? "bg-teal-600 text-white" : isCurrent ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 ring-2 ring-teal-500/30" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    }`}>
                      {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s}
                    </span>
                    <span className={`truncate text-xs ${isCurrent ? "text-slate-900 dark:text-white font-black" : isDone ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600"}`}>
                      {stepTitles[s - 1]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 5, 6, 7. MAIN GRID (360px Sidebar + Remaining Width Form Card, Top Aligned) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10 items-start">
          
          {/* ── 6. LEFT SIDEBAR (360px Fixed Width Panel) ───────────────────────────── */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            
            {/* Completion Status Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-teal-600" /> Verification Status
                </h3>
                <span className="text-xs font-black text-teal-600 bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-200/60 dark:border-teal-800/60">
                  {completionPercentage}%
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-teal-600 to-cyan-500 rounded-full transition-all duration-700" style={{ width: `${completionPercentage}%` }} />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Verified Agency Access</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Completing this wizard unlocks unlimited trip creations, passenger seat management, and payouts.
                </p>
              </div>
            </div>

            {/* Requirements Checklist Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 shadow-xs space-y-5">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" /> Requirements Checklist
              </h3>

              <ul className="space-y-3.5 text-xs">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${name && dob && mobile ? "text-teal-600" : "text-slate-300 dark:text-slate-700"}`} />
                  <span className={name && dob && mobile ? "text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-500"}>Personal Information (Legal Name, DOB, Mobile)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${state && country ? "text-teal-600" : "text-slate-300 dark:text-slate-700"}`} />
                  <span className={state && country ? "text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-500"}>Address Details (State, Country, City)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${companyName && gstNo ? "text-teal-600" : "text-slate-300 dark:text-slate-700"}`} />
                  <span className={companyName && gstNo ? "text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-500"}>Company Name & GST Verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${companyLogo && agentPhoto ? "text-teal-600" : "text-slate-300 dark:text-slate-700"}`} />
                  <span className={companyLogo && agentPhoto ? "text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-500"}>Company Logo & Agent Identification</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${agent?.acceptedTerms || currentStep > 4 ? "text-teal-600" : "text-slate-300 dark:text-slate-700"}`} />
                  <span className={agent?.acceptedTerms || currentStep > 4 ? "text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-500"}>Legal Consent & Terms Agreement</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${agent?.mobileVerified ? "text-teal-600" : "text-slate-300 dark:text-slate-700"}`} />
                  <span className={agent?.mobileVerified ? "text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-500"}>Mobile SMS OTP Verification</span>
                </li>
              </ul>
            </div>

            {/* Enterprise Security Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 text-white space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Enterprise Security</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Your credentials are encrypted using 256-bit SSL protocols. We comply with Indian IT regulations and data protection standards.
              </p>
            </div>
          </aside>

          {/* ── 7. FORM CARD (40px Padding, Pixel-Aligned) ─────────────────────────── */}
          <section className="w-full">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10 shadow-xs flex flex-col justify-between min-h-[580px]">
              
              <div>
                {/* Form Section Header - Aligns exactly with first input */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 mb-8">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {stepTitles[currentStep - 1]}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      Step {currentStep} of 5 — Please fill all mandatory fields marked with an asterisk (*).
                    </p>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Step {currentStep} Required
                  </span>
                </div>

                {/* Feedback Banners */}
                {errorMsg && (
                  <div className="mb-8 p-4.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-8 p-4.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* ── 8 & 9. FORM GRID (32px Horizontal Gap, 24px Vertical Gap, 56px Inputs) ─ */}
                
                {/* STEP 1: Personal Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="w-full">
                      <Input
                        label="Full Legal Name *"
                        placeholder="Enter full name as per Aadhaar / PAN"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <Input
                        label="Date of Birth *"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                      <Input
                        label="Gmail Address (Linked) *"
                        value={agent.email}
                        disabled
                        readOnly
                        helperText="Verified automatically via account sign-in"
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 opacity-75 bg-slate-50 dark:bg-slate-800/40"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <Input
                        label="Mobile Number *"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                      <Input
                        label="Country of Operation *"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                    </div>

                    {/* DEV-only Demo Credentials Card */}
                    {import.meta.env.DEV && (
                      <div className="relative mt-2 p-4 bg-slate-950 border border-teal-500/30 rounded-xl text-left overflow-hidden">
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[9px] font-black text-teal-400 uppercase tracking-widest">
                          Dev Only
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="text-[11px] font-black text-white uppercase tracking-wider">🧪 Demo Test Credentials</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                          <div><span className="text-[10px] text-slate-400 block font-sans">Mobile:</span> <strong className="text-teal-400">1234567890</strong></div>
                          <div><span className="text-[10px] text-slate-400 block font-sans">OTP:</span> <strong className="text-teal-400">123456</strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: Address Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <Input
                        label="State / Province *"
                        placeholder="e.g. Tamil Nadu"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                      <Input
                        label="Country *"
                        placeholder="e.g. India"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <Input
                        label="City / District"
                        placeholder="e.g. Chennai"
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                      <Input
                        label="Pincode / Postal Code"
                        placeholder="e.g. 600001"
                        maxLength={6}
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Company Details */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <Input
                        label="Registered Agency Name *"
                        placeholder="Enter registered company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                      <Input
                        label="GST / Business Registration Number *"
                        placeholder="e.g. 22AAAAA0000A1Z5"
                        value={gstNo}
                        onChange={(e) => setGstNo(e.target.value)}
                        className="h-14 text-base rounded-xl border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                      <ImageUploadBox
                        label="Company Logo *"
                        folder="logos"
                        value={companyLogo}
                        onChange={(url) => setCompanyLogo(url)}
                      />
                      <ImageUploadBox
                        label="Agent Photo * (Verification)"
                        folder="profiles"
                        value={agentPhoto}
                        onChange={(url) => setAgentPhoto(url)}
                        circular
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: Legal Consent */}
                {currentStep === 4 && (
                  <div className="space-y-6 py-2">
                    <div className="p-5 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl flex items-center gap-4">
                      <Shield className="w-10 h-10 text-teal-600 shrink-0" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Traveloop Partner Terms & Compliance</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Please accept the legal terms to activate your agency dashboard.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Terms & Conditions</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Rules regarding trip pricing, cancellation policies, and agent responsibilities.</p>
                        <a href="/terms" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:underline">
                          Read Terms <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Privacy Policy</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">How we process traveler data, passenger manifests, and payments.</p>
                        <a href="/privacy" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:underline">
                          Read Privacy Policy <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          I have read and agree to the <strong>Terms & Conditions</strong>.
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacyAccepted}
                          onChange={(e) => setPrivacyAccepted(e.target.checked)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          I have read and agree to the <strong>Privacy Policy</strong>.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 5: Mobile OTP Verification */}
                {currentStep === 5 && (
                  <div className="space-y-6 text-center py-4">
                    <div className="p-6 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl flex flex-col items-center justify-center max-w-md mx-auto">
                      <Phone className="w-12 h-12 text-teal-600 mb-3" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Verify Mobile Phone Number</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        SMS code will be sent to: <strong className="text-slate-900 dark:text-white font-bold">+91 {mobile}</strong>
                      </p>
                    </div>

                    {!otpSentMobile ? (
                      <Button onClick={sendMobileOtp} loading={loading} className="w-full max-w-md mx-auto h-13 text-sm font-bold">
                        Send Mobile SMS OTP
                      </Button>
                    ) : (
                      <div className="space-y-5 max-w-md mx-auto">
                        <OTPInput value={mobileOtp} onChange={setMobileOtp} length={6} />

                        <div className="flex gap-4">
                          <Button variant="outline" onClick={() => setOtpSentMobile(false)} className="flex-1 h-12" disabled={loading}>
                            Cancel
                          </Button>
                          <Button onClick={verifyMobileOtp} loading={loading} className="flex-[2] h-12">
                            Verify & Complete Profile
                          </Button>
                        </div>
                      </div>
                    )}
                    <div id="recaptcha-container" className="mt-2 flex justify-center"></div>
                  </div>
                )}
              </div>

              {/* ── 10. BUTTON BAR (52px Height, Equal Spacing, Visually Dominant Primary) ─ */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100 dark:border-slate-800 mt-8">
                
                {/* PREVIOUS BUTTON */}
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={handleBack} disabled={loading} className="w-full sm:w-auto h-[52px] px-7 rounded-xl font-bold text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                  </Button>
                ) : <div className="hidden sm:block" />}

                {/* SAVE DRAFT BUTTON */}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 py-3 px-5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Draft
                </button>

                {/* NEXT STEP / SUBMIT BUTTON */}
                {currentStep <= 3 && (
                  <Button onClick={handleNext} loading={loading} className="w-full sm:w-auto h-[52px] px-8 rounded-xl font-extrabold text-sm shadow-md">
                    Next Step <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {currentStep === 4 && (
                  <Button onClick={handleAcceptTerms} disabled={!canSubmit || loading} loading={loading} className="w-full sm:w-auto h-[52px] px-8 rounded-xl font-extrabold text-sm shadow-md">
                    Accept & Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {currentStep === 5 && !otpSentMobile && (
                  <Button onClick={sendMobileOtp} loading={loading} className="w-full sm:w-auto h-[52px] px-8 rounded-xl font-extrabold text-sm shadow-md">
                    Send Mobile OTP <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>

            </div>
          </section>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} Traveloop Technologies Inc. Agent Verification Portal · All rights reserved.
      </footer>
    </div>
  );
};

export default CompleteProfile;
