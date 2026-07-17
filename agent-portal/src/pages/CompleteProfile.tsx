// src/pages/CompleteProfile.tsx
// Profile Completion & Verification Wizard (6-step) - Agent Portal

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Sparkles, Building2, ShieldCheck, ArrowRight, ArrowLeft, Loader2, Mail, Phone, MapPin, User, CheckCircle, Shield, Info } from "lucide-react";
import { GlassCard, Button, Input } from "../components/ui";
import { ImageUploadBox } from "../components/ui";
import { OTPInput } from "../features/auth/components/OTPInput";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { auth } from "../../../traveloop/src/services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export const CompleteProfile: React.FC = () => {
  const [step, setStep] = useState(1);
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
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSentMobile, setOtpSentMobile] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState(""); // For debugging in non-prod

  const canSubmit = termsAccepted && privacyAccepted;

  // Initialize fields if agent data exists
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

      // Check URL query parameters for step first
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get("step");
      if (urlStep) {
        const parsedStep = parseInt(urlStep, 10);
        if (parsedStep >= 1 && parsedStep <= 6) {
          setStep(parsedStep);
          return;
        }
      }

      // Determine starting step based on onboarding status
      const hasGst = agent.gstNo || agent.gstNumber;
      const hasLogo = agent.companyLogo || agent.logo;
      const hasPhoto = agent.agentPhoto || agent.profileImage;
      const profileDone = !!(agent.displayName && agent.dob && agent.mobile && agent.state && agent.country && agent.companyName && hasGst && hasLogo && hasPhoto);

      if (!profileDone) {
        setStep(1);
      } else if (agent.kycStatus !== "EMAIL_VERIFIED" && agent.kycStatus !== "MOBILE_VERIFIED" && agent.kycStatus !== "KYC_COMPLETED" && agent.kycStatus !== "APPROVED" && !agent.emailVerified) {
        setStep(4);
      } else if (!agent.acceptedTerms || !agent.privacyAccepted) {
        setStep(5);
      } else if (!agent.mobileVerified) {
        setStep(6);
      } else {
        setStep(6); // Default fallback
      }
    }
  }, [agent]);

  if (!agent) return null;

  const handleNext = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (step === 1) {
      if (!name.trim()) return setErrorMsg("Full Name is required");
      if (!dob) return setErrorMsg("Date of Birth is required");
      if (!mobile.trim()) return setErrorMsg("Mobile Number is required");
      if (!/^[0-9]{10}$/.test(mobile)) return setErrorMsg("Mobile number must be exactly 10 digits");
      setStep(2);
    } else if (step === 2) {
      if (!state.trim()) return setErrorMsg("State is required");
      if (!country.trim()) return setErrorMsg("Country is required");
      setStep(3);
    } else if (step === 3) {
      if (!companyName.trim()) return setErrorMsg("Company Name is required");
      if (!gstNo.trim()) return setErrorMsg("GST Number is required");
      if (!companyLogo) return setErrorMsg("Company Logo is required");
      if (!agentPhoto) return setErrorMsg("Agent Photo is required");

      // Save step 1-3 details to backend before proceeding
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
          setStep(4);
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

  const handleBack = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  // ── Step 4: Email OTP Actions ──────────────────────────────────────────────
  const sendEmailOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const response = await api.post("/agent/send-email-otp");
      if (response.data?.success) {
        setOtpSent(true);
        setSuccessMsg("Verification OTP sent to your registered Gmail address");
        if (response.data.otp) {
          setEmailOtpCode(response.data.otp);
        }
      } else {
        setErrorMsg(response.data?.message || "Failed to send email OTP");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (emailOtp.length !== 6) return setErrorMsg("Please enter a valid 6-digit OTP");
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const response = await api.post("/agent/verify-email-otp", { otp: emailOtp });
      if (response.data?.success) {
        updateAgent(response.data.agent);
        setSuccessMsg("Email verified successfully!");
        setTimeout(() => {
          setSuccessMsg("");
          setStep(5);
        }, 1500);
      } else {
        setErrorMsg(response.data?.message || "Verification failed");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 5: Legal Consent Actions ──────────────────────────────────────────
  const handleAcceptTerms = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const response = await api.post("/legal/accept", {
        userId: agent?._id,
        acceptedTerms: true,
        acceptedAt: new Date().toISOString(),
        termsVersion: "2026-07",
      });

      if (response.data?.success) {
        const updatedAgent = response.data.agent;
        if (updatedAgent) {
          updateAgent(updatedAgent);
        }
        setSuccessMsg("Legal consent saved successfully.");
        setTimeout(() => {
          setSuccessMsg("");
          setStep(6);
        }, 1500);
      } else {
        setErrorMsg(response.data?.message || "Failed to save legal consent");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Error submitting legal consent");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 6: Mobile OTP Actions ─────────────────────────────────────────────
  const sendMobileOtp = async () => {
    if (!/^[6-9][0-9]{9}$/.test(mobile)) {
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
        callback: () => {
          console.log("reCAPTCHA solved");
        },
        "expired-callback": () => {
          console.log("reCAPTCHA expired");
        }
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
        updateAgent(response.data.agent);
        setSuccessMsg("Mobile verified successfully! KYC profile is now completed.");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setErrorMsg(response.data?.message || "Verification failed");
      }
    } catch (err: any) {
      console.error("Firebase SMS verify error:", err);
      setErrorMsg(err.message || "Invalid OTP code entered.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step header labels ─────────────────────────────────────────────────────
  const stepTitles = [
    "Personal Details",
    "Address Details",
    "Company Details",
    "Email OTP Verification",
    "Legal Consent",
    "Mobile OTP Verification"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 auth-bg bg-[#070a13]">
      <div className="w-full max-w-2xl animate-fade-in-up">
        
        {/* Title */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center text-white font-bold mb-3 shadow-brand animate-float">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            Complete Agent Profile Verification
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold max-w-sm mt-1">
            Fill required details and verify ownership to activate trip planning options.
          </p>
        </div>

        <GlassCard className="p-8">
          
          {/* Progress bar */}
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Step {step} of 6: {stepTitles[step - 1]}
            </h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step ? "w-8 bg-primary shadow-brand" : s < step ? "w-6 bg-primary/40" : "w-6 bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {successMsg}
            </div>
          )}

          {/* Step forms */}
          <div className="space-y-4">
            
            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-4 animate-page">
                <Input
                  label="Full Name *"
                  placeholder="Enter full legal name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth *"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                  <Input
                    label="Gmail Address *"
                    value={agent.email}
                    disabled
                    readOnly
                    helperText="Linked directly with sign-in credential"
                  />
                </div>

                <Input
                  label="Mobile Number *"
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                />
                <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 border border-primary/10 w-fit text-[11px] text-primary/80 font-semibold">
                  <span>📱 Demo Mobile Number: 8637628773</span>
                </div>

                <Button onClick={handleNext} className="w-full mt-4">
                  Next Step <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* STEP 2: Address Details */}
            {step === 2 && (
              <div className="space-y-4 animate-page">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="State *"
                    placeholder="e.g. Tamil Nadu"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                  <Input
                    label="Country *"
                    placeholder="e.g. India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>

                <div className="flex gap-4 mt-6">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Next Step <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Company details & photo uploads */}
            {step === 3 && (
              <div className="space-y-4 animate-page">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name *"
                    placeholder="Enter registered agency name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  <Input
                    label="GST Number *"
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <ImageUploadBox
                    label="Company Logo *"
                    folder="logos"
                    value={companyLogo}
                    onChange={(url) => setCompanyLogo(url)}
                  />
                  <ImageUploadBox
                    label="Agent Photo * (Admin view only)"
                    folder="profiles"
                    value={agentPhoto}
                    onChange={(url) => setAgentPhoto(url)}
                    circular
                  />
                </div>

                <div className="flex gap-4 mt-6">
                  <Button variant="outline" onClick={handleBack} className="flex-1" disabled={loading}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={handleNext} loading={loading} className="flex-1">
                    Proceed to Verification <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Email OTP Verification */}
            {step === 4 && (
              <div className="space-y-6 text-center animate-page">
                <div className="p-4 bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Mail className="w-10 h-10 text-primary mb-2" />
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350 max-w-sm">
                    Verify registered email: <strong className="text-slate-800 dark:text-slate-200">{agent.email}</strong>
                  </p>
                </div>

                {!otpSent ? (
                  <Button onClick={sendEmailOtp} loading={loading} className="w-full">
                    Send Gmail Verification OTP
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <OTPInput value={emailOtp} onChange={setEmailOtp} length={6} />
                    
                    {emailOtpCode && (
                      <p className="text-[11px] text-amber-500 font-bold bg-amber-500/10 p-2 rounded-xl">
                        Debug Gmail OTP: {emailOtpCode}
                      </p>
                    )}

                    <div className="flex gap-4 mt-6">
                      <Button variant="outline" onClick={() => setOtpSent(false)} className="flex-1" disabled={loading}>
                        Change Method
                      </Button>
                      <Button onClick={verifyEmailOtp} loading={loading} className="flex-[2]">
                        Verify Email OTP
                      </Button>
                    </div>

                    <button
                      onClick={sendEmailOtp}
                      disabled={loading}
                      className="text-xs font-bold text-primary hover:underline block mx-auto mt-2"
                    >
                      Resend OTP code
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Legal Consent */}
            {step === 5 && (
              <div className="space-y-6 animate-page text-center">
                <div className="p-4 bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Shield className="w-10 h-10 text-primary mb-2 animate-pulse" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Legal Documents & Agreement
                  </h3>
                  <p className="text-xs font-semibold text-slate-650 dark:text-slate-350 max-w-sm mt-1">
                    Before activating your Agent account, please review and accept the legal documents.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {/* Terms Card */}
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Terms & Conditions</h4>
                    <p className="text-[11px] text-slate-400 mb-3">Review the TravelLoop Agent usage and guidelines.</p>
                    <a
                      href="https://traveloop-v2-j88c.vercel.app/index.html?doc=terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      Read Terms & Conditions
                      <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    </a>
                  </div>

                  {/* Privacy Card */}
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Privacy Policy</h4>
                    <p className="text-[11px] text-slate-400 mb-3">Learn how we protect and process business data.</p>
                    <a
                      href="https://traveloop-v2-j88c.vercel.app/index.html?doc=privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      Read Privacy Policy
                      <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    </a>
                  </div>
                </div>

                {/* Acceptance Checkboxes */}
                <div className="space-y-3 text-left pt-2">
                  <label className="flex items-center gap-3.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs text-slate-650 dark:text-slate-350">
                      I have read and agree to the <strong className="text-slate-850 dark:text-slate-200">Terms & Conditions</strong>.
                    </span>
                  </label>

                  <label className="flex items-center gap-3.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs text-slate-650 dark:text-slate-350">
                      I have read and agree to the <strong className="text-slate-850 dark:text-slate-200">Privacy Policy</strong>.
                    </span>
                  </label>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleAcceptTerms}
                    disabled={!canSubmit || loading}
                    loading={loading}
                    className="flex-[2]"
                  >
                    Continue to Mobile Verification
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 6: Mobile OTP Verification */}
            {step === 6 && (
              <div className="space-y-6 text-center animate-page">
                <div className="p-4 bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Phone className="w-10 h-10 text-primary mb-2" />
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350 max-w-sm">
                    Verify mobile number: <strong className="text-slate-800 dark:text-slate-200">+91 {mobile}</strong>
                  </p>
                </div>

                {!otpSentMobile ? (
                  <Button onClick={sendMobileOtp} loading={loading} className="w-full">
                    Send Mobile Verification OTP
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <OTPInput value={mobileOtp} onChange={setMobileOtp} length={6} />

                    <div className="flex gap-4 mt-6">
                      <Button variant="outline" onClick={() => setOtpSentMobile(false)} className="flex-1" disabled={loading}>
                        Cancel
                      </Button>
                      <Button onClick={verifyMobileOtp} loading={loading} className="flex-[2]">
                        Verify Mobile OTP
                      </Button>
                    </div>

                    <button
                      onClick={sendMobileOtp}
                      disabled={loading}
                      className="text-xs font-bold text-primary hover:underline block mx-auto mt-2"
                    >
                      Resend OTP code
                    </button>
                  </div>
                )}
                <div id="recaptcha-container" className="mt-2 flex justify-center"></div>

                {/* Professional Demo Credentials Card */}
                <div className="relative mt-8 p-5 bg-slate-950/65 backdrop-blur-md border border-cyan-500/30 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.15)] text-left overflow-hidden">
                  {/* Top-Right "Demo Only" Pill Badge */}
                  <div className="absolute top-3.5 right-3.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                    Demo Only
                  </div>

                  {/* Header Title with Info Icon */}
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      🧪 Demo Credentials
                    </span>
                  </div>

                  {/* Body Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Demo Mobile Number */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        📱 Demo Mobile Number
                      </span>
                      <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/20 text-xs text-cyan-400 font-medium font-mono">
                        +91 8637628773
                      </span>
                    </div>

                    {/* Demo OTP */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        🔐 Demo OTP
                      </span>
                      <span className="inline-block px-4 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/20 text-xs text-cyan-400 font-medium font-mono tracking-widest">
                        123456
                      </span>
                    </div>
                  </div>

                  {/* Guide Text */}
                  <p className="text-[10px] text-slate-400 font-medium mt-4">
                    Use the above demo OTP for testing the UI.
                  </p>

                  {/* Helper Text at the Bottom */}
                  <div className="mt-4 pt-3 border-t border-slate-900">
                    <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">
                      This demo OTP is displayed only for UI demonstration purposes. Actual OTP verification continues to use the existing Firebase Authentication flow.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </GlassCard>
      </div>
    </div>
  );
};

export default CompleteProfile;
