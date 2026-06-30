import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import InputField from "../common/InputField";
import Button from "../common/Button";
import Checkbox from "../common/Checkbox";
import TermsModal from "./TermsModal";
import { useAuth } from "../../context/AuthContext";
import {
  sendOtpCode,
  verifyOtpCode,
  registerWithEmailPassword,
} from "../../services/authService";

// Helper: Format timer
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// Helper: Get password strength
const getPasswordStrength = (pwd, t) => {
  if (!pwd) return { score: 0, label: "", color: "", text: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: t ? t("auth.register.passwordWeak") : "Weak", color: "bg-red-500", text: "text-red-500" };
  if (score <= 3) return { score, label: t ? t("auth.register.passwordMedium") : "Medium", color: "bg-amber-500", text: "text-amber-500" };
  return { score, label: t ? t("auth.register.passwordStrong") : "Strong", color: "bg-teal-500", text: "text-teal-500" };
};

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRATION WIZARD - UNIFIED COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const RegistrationWizard = ({ initialStep = 1 }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // ─────────────────────────────────────────────────────────────────────────
  // PRIMARY STATE (React - Primary Source of Truth)
  // ─────────────────────────────────────────────────────────────────────────
  
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = sessionStorage.getItem("traveloop_wizard_step");
      return saved ? parseInt(saved, 10) : initialStep;
    } catch {
      return initialStep;
    }
  });

  const [formData, setFormData] = useState(() => {
    try {
      const cached = sessionStorage.getItem("traveloop_wizard_form");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignore parse errors
    }
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      otpToken: "",
      agreeTerms: false,
    };
  });

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [termsModal, setTermsModal] = useState({ open: false, section: "terms" });

  // OTP Resend Timer
  const [resendTimer, setResendTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [resendCount, setResendCount] = useState(1);

  // Refs for OTP inputs
  const otpInputRefs = useRef([]);

  // ─────────────────────────────────────────────────────────────────────────
  // AUTO-SAVE STATE TO SESSION STORAGE (Backup Only)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const { password, confirmPassword, ...rest } = formData;
      sessionStorage.setItem("traveloop_wizard_form", JSON.stringify(rest));
      sessionStorage.setItem("traveloop_wizard_step", currentStep.toString());
    } catch {
      // Ignore storage errors
    }
  }, [formData, currentStep]);

  // ─────────────────────────────────────────────────────────────────────────
  // OTP COUNTDOWN TIMER
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (currentStep !== 2) return;

    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [resendTimer, currentStep]);

  // ─────────────────────────────────────────────────────────────────────────
  // AUTO-FOCUS OTP INPUT ON STEP ENTER
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (currentStep === 2) {
      const timer = setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // ─────────────────────────────────────────────────────────────────────────
  // FORM FIELD CHANGE HANDLER
  // ─────────────────────────────────────────────────────────────────────────

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: VALIDATION
  // ─────────────────────────────────────────────────────────────────────────

  const validateStep1 = useCallback(() => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t("auth.register.validation.firstNameRequired");
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t("auth.register.validation.lastNameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("auth.validation.emailRequired");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(formData.email.trim().toLowerCase())) {
        newErrors.email = t("auth.validation.emailInvalid");
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("auth.register.validation.phoneRequired");
    } else {
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      const cleanedPhone = formData.phone.trim().replace(/[\s\-().]/g, "");
      if (!phoneRegex.test(cleanedPhone)) {
        newErrors.phone = t("auth.register.validation.phoneInvalid");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: CONTINUE TO OTP
  // ─────────────────────────────────────────────────────────────────────────

  const handleContinueToOtp = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateStep1()) return;

      setLoading(true);
      setErrors({});

      try {
        await sendOtpCode({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        });

        setOtp(new Array(6).fill(""));
        setResendTimer(30);
        setIsResendDisabled(true);
        setResendCount(1);
        setCurrentStep(2);
      } catch (err) {
        setErrors({ general: err.message || t("auth.register.validation.otpSendFailed") });
      } finally {
        setLoading(false);
      }
    },
    [formData, validateStep1, t]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: OTP INPUT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleOtpChange = useCallback((e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setErrors({});

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleOtpKeyDown = useCallback((e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        newOtp[index] = "";
        setOtp(newOtp);
      }
      setErrors({});
    }
  }, [otp]);

  const handleOtpPaste = useCallback((e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim();
    if (data.length === 6 && /^\d+$/.test(data)) {
      const pasteOtp = data.split("");
      setOtp(pasteOtp);
      otpInputRefs.current[5]?.focus();
      setErrors({});
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: RESEND OTP
  // ─────────────────────────────────────────────────────────────────────────

  const handleResendOtp = useCallback(async () => {
    if (isResendDisabled || loading || resendCount >= 5) return;

    setLoading(true);
    setErrors({});

    try {
      await sendOtpCode({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });

      setOtp(new Array(6).fill(""));
      setResendTimer(30);
      setIsResendDisabled(true);
      setResendCount((prev) => prev + 1);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setErrors({ general: err.message || t("auth.register.validation.otpResendFailed") });
    } finally {
      setLoading(false);
    }
  }, [formData, isResendDisabled, loading, resendCount, t]);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: VERIFY OTP
  // ─────────────────────────────────────────────────────────────────────────

  const handleVerifyOtp = useCallback(
    async (e) => {
      e.preventDefault();
      const otpCode = otp.join("");

      if (otpCode.length < 6) {
        setErrors({ general: t("auth.register.validation.otpDigits") });
        return;
      }

      setLoading(true);
      setErrors({});

      try {
        const verifyRes = await verifyOtpCode(formData.email, otpCode);
        const { otpToken } = verifyRes;

        setFormData((prev) => ({ ...prev, otpToken }));
        setCurrentStep(3);
      } catch (err) {
        setErrors({ general: err.message || t("auth.register.validation.otpInvalid") });
      } finally {
        setLoading(false);
      }
    },
    [otp, formData.email, t]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: PASSWORD VALIDATION
  // ─────────────────────────────────────────────────────────────────────────

  const validateStep3 = useCallback(() => {
    const newErrors = {};

    if (!formData.password.trim()) {
      newErrors.password = t("auth.validation.passwordRequired");
    } else {
      const pwdStrength = getPasswordStrength(formData.password, t);
      if (pwdStrength.score < 4) {
        newErrors.password = t("auth.register.validation.passwordInvalid");
      }
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t("auth.register.validation.confirmPasswordRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("auth.register.validation.passwordMatch");
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = t("auth.register.validation.agreeTerms");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.password, formData.confirmPassword, formData.agreeTerms, t]);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: CREATE ACCOUNT (FINAL)
  // ─────────────────────────────────────────────────────────────────────────

  const handleCreateAccount = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateStep3()) return;

      setLoading(true);
      setErrors({});

      try {
        const backendData = await registerWithEmailPassword(
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            acceptedTerms: formData.agreeTerms,
            termsVersion: "2026-06",
          },
          formData.otpToken
        );

        // Cleanup
        sessionStorage.removeItem("traveloop_wizard_form");
        sessionStorage.removeItem("traveloop_wizard_step");

        // Auto-login
        login(backendData.user, backendData.token);

        // Navigate to dashboard
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setErrors({ general: err.message || t("auth.register.validation.registerFailed") });
      } finally {
        setLoading(false);
      }
    },
    [formData, validateStep3, login, navigate, t]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PASSWORD STRENGTH (Memoized)
  // ─────────────────────────────────────────────────────────────────────────

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password, t),
    [formData.password, t]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MASKED EMAIL (Memoized)
  // ─────────────────────────────────────────────────────────────────────────

  const maskedEmail = useMemo(() => {
    if (!formData.email) return "";
    const [name, domain] = formData.email.split("@");
    if (!domain) return formData.email;
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.substring(0, 2)}${"*".repeat(Math.max(1, name.length - 3))}${name.slice(-1)}@${domain}`;
  }, [formData.email]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: STEP 1 - BASIC INFORMATION
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep1 = useMemo(
    () => (
      <form onSubmit={handleContinueToOtp} className="space-y-4">
        {errors.general && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-4 py-3 text-sm text-red-650 dark:text-red-400 font-semibold">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={t("auth.register.firstNameLabel")}
            type="text"
            name="firstName"
            placeholder={t("auth.register.firstNamePlaceholder")}
            icon={User}
            value={formData.firstName}
            onChange={handleFormChange}
            error={errors.firstName}
            disabled={loading}
            required
          />

          <InputField
            label={t("auth.register.lastNameLabel")}
            type="text"
            name="lastName"
            placeholder={t("auth.register.lastNamePlaceholder")}
            icon={User}
            value={formData.lastName}
            onChange={handleFormChange}
            error={errors.lastName}
            disabled={loading}
            required
          />
        </div>

        <InputField
          label={t("auth.emailLabel")}
          type="email"
          name="email"
          placeholder={t("auth.emailPlaceholder")}
          icon={Mail}
          value={formData.email}
          onChange={handleFormChange}
          error={errors.email}
          disabled={loading}
          required
        />

        <InputField
          label={t("auth.register.phoneLabel")}
          type="text"
          name="phone"
          placeholder={t("auth.register.phonePlaceholder")}
          icon={Phone}
          value={formData.phone}
          onChange={handleFormChange}
          error={errors.phone}
          disabled={loading}
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            text={t("auth.register.continueBtn")}
            loading={loading}
            icon={ArrowRight}
          />
        </div>
      </form>
    ),
    [formData, errors, loading, handleFormChange, handleContinueToOtp, t]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: STEP 2 - OTP VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep2 = useMemo(
    () => (
      <form onSubmit={handleVerifyOtp} className="w-full max-w-md mx-auto space-y-4">
        <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-[28px] p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-5">
          {errors.general && (
            <div className="flex items-center justify-center gap-2 text-rose-500 dark:text-rose-400 text-xs sm:text-sm font-bold py-2 px-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 rounded-xl animate-shake">
              <span>⚠️</span>
              <span>{errors.general}</span>
            </div>
          )}

          {/* OTP BOXES */}
          <div className="flex justify-center gap-2 sm:gap-3 direction-ltr py-1" onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e, idx)}
                onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                className="w-[42px] h-[50px] xs:w-[48px] xs:h-[56px] sm:w-[52px] sm:h-[60px] text-center text-xl sm:text-2xl font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:scale-[1.05] transition-all duration-200 shadow-sm"
                disabled={loading}
              />
            ))}
          </div>

          {/* TIMER & RESEND */}
          <div className="flex items-center justify-between text-xs sm:text-sm px-1 py-0.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {t("auth.register.remaining", { time: formatTime(resendTimer) })}
            </span>
            {isResendDisabled ? (
              <span className="text-slate-400 dark:text-slate-650 font-semibold select-none cursor-not-allowed">
                {t("auth.register.resendCode")}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendCount >= 5}
                className="text-teal-655 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("auth.register.resendCode")}
              </button>
            )}
          </div>

          {/* VERIFY BUTTON */}
          <Button
            type="submit"
            text={t("auth.register.verifyBtn")}
            loading={loading}
            icon={ShieldCheck}
            className="w-full shadow-md hover:shadow-lg transition-all"
          />

          {/* BACK BUTTON */}
          <div className="flex justify-between items-center px-1 pt-1 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              disabled={loading}
              className="text-slate-500 hover:text-teal-650 dark:text-slate-450 dark:hover:text-teal-350 font-bold transition-colors flex items-center gap-1.5 active:scale-95 duration-200 disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              {t("auth.register.changeDetails")}
            </button>

            {resendCount >= 5 && (
              <span className="text-rose-500 dark:text-rose-400 font-bold text-xs">
                {t("auth.register.limitExceeded")}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-4">
          {t("auth.register.checkSpam")}
        </p>
      </form>
    ),
    [
      otp,
      errors,
      loading,
      resendTimer,
      isResendDisabled,
      resendCount,
      handleOtpChange,
      handleOtpKeyDown,
      handleOtpPaste,
      handleResendOtp,
      handleVerifyOtp,
      t,
    ]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: STEP 3 - PASSWORD CREATION
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep3 = useMemo(
    () => (
      <form onSubmit={handleCreateAccount} className="space-y-4">
        {errors.general && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-4 py-3 text-sm text-red-650 dark:text-red-400 font-semibold">
            {errors.general}
          </div>
        )}

        <div className="relative">
          <InputField
            label={t("auth.passwordLabel")}
            type="password"
            name="password"
            placeholder={t("auth.register.createPasswordPlaceholder")}
            icon={Lock}
            value={formData.password}
            onChange={handleFormChange}
            error={errors.password}
            disabled={loading}
            required
          />

          {formData.password && (
            <div className="mt-1.5 space-y-1 animate-fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-medium">{t("auth.register.passwordStrengthLabel")}</span>
                <span className={`font-bold transition-colors duration-300 ${passwordStrength.text}`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4].map((stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`h-full flex-1 transition-all duration-500 ${
                      stepIdx <= passwordStrength.score
                        ? passwordStrength.color
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
              {passwordStrength.score < 4 && (
                <ul className="text-[11px] text-slate-400 dark:text-slate-500 space-y-0.5 mt-0.5 list-disc pl-4">
                  <li className={formData.password.length >= 8 ? "text-teal-600 dark:text-teal-400 font-semibold" : ""}>
                    {t("auth.register.passwordHintLength")}
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? "text-teal-600 dark:text-teal-400 font-semibold" : ""}>
                    {t("auth.register.passwordHintUppercase")}
                  </li>
                  <li className={/[a-z]/.test(formData.password) ? "text-teal-600 dark:text-teal-400 font-semibold" : ""}>
                    {t("auth.register.passwordHintLowercase")}
                  </li>
                  <li className={/[0-9]/.test(formData.password) ? "text-teal-600 dark:text-teal-400 font-semibold" : ""}>
                    {t("auth.register.passwordHintNumber")}
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>

        <InputField
          label={t("auth.register.confirmPasswordLabel")}
          type="password"
          name="confirmPassword"
          placeholder={t("auth.register.confirmPasswordPlaceholder")}
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleFormChange}
          error={errors.confirmPassword}
          disabled={loading}
          required
        />

        {/* TERMS CHECKBOX */}
        <div className="flex flex-col gap-1.5">
          <Checkbox
            id="agree-checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, agreeTerms: e.target.checked }));
              setErrors((prev) => ({ ...prev, agreeTerms: "" }));
            }}
            error={errors.agreeTerms}
            label={
              <span className="text-slate-655 dark:text-slate-400 select-none">
                {t("auth.register.agreeTo")}{" "}
                <button
                  type="button"
                  onClick={() => setTermsModal({ open: true, section: "terms" })}
                  className="inline text-teal-600 hover:text-teal-700 dark:text-teal-450 dark:hover:text-teal-350 font-bold hover:underline transition active:opacity-70"
                >
                  {t("profile.termsConditions")}
                </button>{" "}
                {t("auth.register.and")}{" "}
                <button
                  type="button"
                  onClick={() => setTermsModal({ open: true, section: "privacy" })}
                  className="inline text-teal-600 hover:text-teal-700 dark:text-teal-450 dark:hover:text-teal-350 font-bold hover:underline transition active:opacity-70"
                >
                  {t("auth.register.privacyPolicy")}
                </button>
              </span>
            }
          />
        </div>

        {/* CREATE ACCOUNT BUTTON */}
        <div className="relative">
          <Button
            type="submit"
            text={t("auth.register.createAccountBtn")}
            loading={loading}
            disabled={!formData.agreeTerms}
            icon={ShieldCheck}
            className={`transition-all duration-300 ${
              !formData.agreeTerms
                ? "opacity-50 cursor-not-allowed shadow-none scale-100 hover:scale-100"
                : "opacity-100 shadow-[0_4px_20px_rgba(20,184,181,0.25)] hover:shadow-[0_6px_24px_rgba(20,184,181,0.35)]"
            }`}
          />
        </div>

        {/* BACK TO PASSWORD HINT */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-400 transition-colors flex items-center gap-1.5 active:scale-95"
          >
            <ArrowLeft size={14} />
            {t("auth.register.goBackToVerification")}
          </button>
        </div>

        {/* TERMS MODAL - NOT AFFECTING PARENT STATE */}
        <TermsModal
          isOpen={termsModal.open}
          onClose={() => setTermsModal({ ...termsModal, open: false })}
          onAccept={() => {
            setFormData((prev) => ({ ...prev, agreeTerms: true }));
            setErrors((prev) => ({ ...prev, agreeTerms: "" }));
          }}
          section={termsModal.section}
        />
      </form>
    ),
    [
      formData,
      errors,
      loading,
      passwordStrength,
      termsModal,
      handleFormChange,
      handleCreateAccount,
      t,
    ]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER - ANIMATED STEP TRANSITIONS
  // ─────────────────────────────────────────────────────────────────────────

  const stepTitles = {
    1: t("auth.register.step1Title"),
    2: t("auth.register.step2Title"),
    3: t("auth.register.step3Title"),
  };

  const stepSubtitles = {
    1: t("auth.register.step1Subtitle"),
    2: t("auth.register.step2Subtitle", { email: maskedEmail }),
    3: t("auth.register.step3Subtitle"),
  };

  return (
    <div className="w-full space-y-6">
      {/* STEP INDICATOR */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                step <= currentStep
                  ? "bg-teal-500 dark:bg-teal-600 text-white shadow-md"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`w-8 h-1 mx-1 transition-all duration-300 ${
                  step < currentStep
                    ? "bg-teal-500 dark:bg-teal-600"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* STEP TITLES & SUBTITLE */}
      <div className="text-center space-y-2 min-h-[80px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
              {stepTitles[currentStep]}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {stepSubtitles[currentStep]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FORM CONTENT WITH SMOOTH TRANSITIONS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: currentStep > 1 ? 100 : -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: currentStep > 1 ? -100 : 100 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {currentStep === 1 && renderStep1}
          {currentStep === 2 && renderStep2}
          {currentStep === 3 && renderStep3}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RegistrationWizard;
