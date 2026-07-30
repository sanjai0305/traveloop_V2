import React, { useState, useEffect, useRef } from "react";
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
import { useNavigate } from "react-router-dom";
import InputField from "../common/InputField";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import {
  sendOtpCode,
  verifyOtpCode,
  registerWithEmailPassword,
} from "../../services/authService";
import TermsModal from "./TermsModal";
import Checkbox from "../common/Checkbox";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const RegisterForm = ({ step, onStepChange }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Load initial form data from sessionStorage
  const [formData, setFormData] = useState(() => {
    try {
      const cached = sessionStorage.getItem("traveloop_register_form");
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          password: "",
          confirmPassword: "",
          otpToken: parsed.otpToken || "",
        };
      }
    } catch (e) {
      console.warn("Failed to parse cached register form data:", e);
    }
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      otpToken: "",
    };
  });

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [termsModal, setTermsModal] = useState({ open: false, section: "terms" });

  // Timer for Resend OTP (30 seconds cooldown)
  const [resendTimer, setResendTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [resendCount, setResendCount] = useState(1);

  const otpInputRefs = useRef([]);

  // Auto-save form progress (excluding password/confirmPassword for security)
  useEffect(() => {
    const { password, confirmPassword, ...rest } = formData;
    sessionStorage.setItem("traveloop_register_form", JSON.stringify(rest));
  }, [formData]);

  // Sync email to parent card title
  useEffect(() => {
    if (formData.email && onStepChange) {
      onStepChange(step, formData.email);
    }
  }, [step]);

  // Auto-focus first OTP box on entering Step 2
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Countdown timer logic for OTP step
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [resendTimer, step]);

  // HANDLE FORM CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  };

  // PASSWORD STRENGTH CHECKER
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "", text: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;

    if (score <= 1) return { score, label: "Weak", color: "bg-red-500", text: "text-red-500" };
    if (score <= 3) return { score, label: "Medium", color: "bg-amber-500", text: "text-amber-500" };
    return { score, label: "Strong", color: "bg-teal-500", text: "text-teal-500" };
  };

  const strength = getPasswordStrength(formData.password);

  // STEP 1 VALIDATION (BASIC INFORMATION)
  const validateStep1 = () => {
    let newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(formData.email.trim().toLowerCase())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      const cleanedPhone = formData.phone.trim().replace(/[\s\-().]/g, "");
      if (!phoneRegex.test(cleanedPhone)) {
        newErrors.phone = "Please enter a valid phone number (7-15 digits, numeric)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // STEP 3 VALIDATION (CREATE PASSWORD)
  const validateStep3 = () => {
    let newErrors = {};

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else {
      const pwdStrength = getPasswordStrength(formData.password);
      if (pwdStrength.score < 4) {
        newErrors.password = "Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number";
      }
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agree) {
      newErrors.agree = "Please accept the Terms & Conditions to continue.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // TRIGGER CONTINUE (STEP 1 -> STEP 2)
  const handleContinueToOtp = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setLoading(true);
    setErrors({});
    try {
      // Validate email uniqueness and trigger OTP send
      await sendOtpCode({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });

      // Clear code box state, reset resend timer and count
      setOtp(new Array(6).fill(""));
      setResendTimer(30);
      setIsResendDisabled(true);

      // Move to Step 2
      onStepChange(2, formData.email);
    } catch (err) {
      console.error("[RegisterForm] send-otp failed:", err);
      setErrors({ general: err.message || "Failed to send verification code. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // OTP DIGIT CHANGE HANDLER (STEP 2)
  const handleOtpDigitChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setErrors({});

    // Auto-focus next input box
    if (value && index < 5) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  // OTP DIGIT BACKSPACE/KEYDOWN (STEP 2)
  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpInputRefs.current[index - 1].focus();
      } else {
        newOtp[index] = "";
        setOtp(newOtp);
      }
      setErrors({});
    }
  };

  // OTP DIGIT PASTE HANDLER (STEP 2)
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim();
    if (data.length === 6 && /^\d+$/.test(data)) {
      const pasteOtp = data.split("");
      setOtp(pasteOtp);
      otpInputRefs.current[5].focus();
      setErrors({});
    }
  };

  // OTP CODE RESEND HANDLER (STEP 2)
  const handleResendOtp = async () => {
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

      if (otpInputRefs.current[0]) {
        otpInputRefs.current[0].focus();
      }
    } catch (err) {
      setErrors({ general: err.message || "Failed to resend verification code." });
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP (STEP 2 -> STEP 3)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length < 6) {
      setErrors({ general: "Please enter all 6 digits of the verification code." });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const verifyRes = await verifyOtpCode(formData.email, otpCode);
      const { otpToken } = verifyRes;

      // Save token in memory/sessionState
      setFormData((prev) => ({ ...prev, otpToken }));
      
      // Clear errors and transition to Step 3
      onStepChange(3);
    } catch (err) {
      console.error("[RegisterForm] verify-otp failed:", err);
      setErrors({ general: err.message || "Invalid verification code. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // FINAL USER CREATION & LOGIN (STEP 3)
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setErrors({});
    try {
      // Complete Firebase registration, Backend synchronization, and Firestore profile creation
      const backendData = await registerWithEmailPassword(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          acceptedTerms: agree,
          termsVersion: "2026-06",
        },
        formData.otpToken
      );

      // Clean up onboarding cache from session storage
      sessionStorage.removeItem("traveloop_register_form");
      sessionStorage.removeItem("traveloop_register_step");

      // Auto login in the app session state
      login(backendData.user, backendData.token);

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("[RegisterForm] registration failed:", err);
      setErrors({ general: err.message || "Failed to create account. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // RENDER STEP 1: BASIC INFORMATION
  if (step === 1) {
    return (
      <form onSubmit={handleContinueToOtp} className="space-y-4 animate-slide-up">
        {errors.general && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-650 font-semibold">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            type="text"
            name="firstName"
            placeholder="Enter your first name"
            icon={User}
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
            disabled={loading}
            required
          />

          <InputField
            label="Last Name"
            type="text"
            name="lastName"
            placeholder="Enter your last name"
            icon={User}
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
            disabled={loading}
            required
          />
        </div>

        <InputField
          label="Email Address"
          type="email"
          name="email"
          placeholder="Enter your email address"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          disabled={loading}
          required
        />

        <InputField
          label="Phone Number"
          type="text"
          name="phone"
          placeholder="Enter your phone number"
          icon={Phone}
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          disabled={loading}
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            text="Continue"
            loading={loading}
            icon={ArrowRight}
          />
        </div>
      </form>
    );
  }

  // RENDER STEP 2: EMAIL OTP VERIFICATION
  if (step === 2) {
    return (
      <form onSubmit={handleVerifyOtp} className="animate-slide-up w-full max-w-md mx-auto space-y-4">
        {/* PREMIUM CARD CONTAINER */}
        <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-[28px] p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-5">
          {/* COMPACT INLINE ALERT FOR ERRORS */}
          {errors.general && (
            <div className="flex items-center justify-center gap-2 text-rose-500 dark:text-rose-400 text-xs sm:text-sm font-bold py-2 px-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 rounded-xl animate-shake">
              <span>⚠️</span>
              <span>{errors.general}</span>
            </div>
          )}

          {/* 6 OTP BOXES */}
          <div className="flex justify-center gap-2 sm:gap-3 direction-ltr py-1" onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpDigitChange(e, idx)}
                onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                className="w-[42px] h-[50px] xs:w-[48px] xs:h-[56px] sm:w-[52px] sm:h-[60px] text-center text-xl sm:text-2xl font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:scale-[1.05] transition-all duration-200 shadow-sm"
                disabled={loading}
              />
            ))}
          </div>

          {/* INLINE TIMER & RESEND LINK */}
          <div className="flex items-center justify-between text-xs sm:text-sm px-1 py-0.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {formatTime(resendTimer)} remaining
            </span>
            {isResendDisabled ? (
              <span className="text-slate-400 dark:text-slate-650 font-semibold select-none cursor-not-allowed">
                Resend Code
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendCount >= 5}
                className="text-teal-655 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold transition-colors hover:underline"
              >
                Resend Code
              </button>
            )}
          </div>

          {/* VERIFY BUTTON */}
          <Button
            type="submit"
            text="Verify OTP"
            loading={loading}
            icon={ShieldCheck}
            className="w-full shadow-md hover:shadow-lg transition-all"
          />

          {/* TEXT ACTIONS AT BOTTOM */}
          <div className="flex justify-between items-center px-1 pt-1 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => onStepChange(1)}
              disabled={loading}
              className="text-slate-500 hover:text-teal-650 dark:text-slate-450 dark:hover:text-teal-350 font-bold transition-colors flex items-center gap-1.5 active:scale-95 duration-200"
            >
              <ArrowLeft size={16} />
              Change Details
            </button>

            {resendCount >= 5 && (
              <span className="text-rose-500 dark:text-rose-400 font-bold text-xs">
                Limit Exceeded
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-4">
          Please check your spam or promotions folder if you do not see the code in your inbox.
        </p>
      </form>
    );
  }

  // RENDER STEP 3: CREATE PASSWORD
  if (step === 3) {
    return (
      <form onSubmit={handleCreateAccount} className="space-y-4 animate-slide-up">
        {errors.general && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-650 font-semibold">
            {errors.general}
          </div>
        )}

        <div className="relative">
          <InputField
            label="Password"
            type="password"
            name="password"
            placeholder="Create a strong password"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={loading}
            required
          />

          {/* PASSWORD STRENGTH VISUAL FEEDBACK */}
          {formData.password && (
            <div className="mt-1.5 space-y-1 animate-fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Password Strength:</span>
                <span className={`font-bold transition-colors duration-300 ${strength.text}`}>
                  {strength.label}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4].map((stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`h-full flex-1 transition-all duration-500 ${
                      stepIdx <= strength.score ? strength.color : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
              {strength.score < 4 && (
                <ul className="text-[11px] text-slate-400 space-y-0.5 mt-0.5 list-disc pl-4">
                  <li className={formData.password.length >= 8 ? "text-teal-600 font-semibold" : ""}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? "text-teal-600 font-semibold" : ""}>
                    At least one uppercase letter
                  </li>
                  <li className={/[a-z]/.test(formData.password) ? "text-teal-600 font-semibold" : ""}>
                    At least one lowercase letter
                  </li>
                  <li className={/[0-9]/.test(formData.password) ? "text-teal-600 font-semibold" : ""}>
                    At least one number
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>

        <InputField
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password"
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          disabled={loading}
          required
        />

        {/* CONSENT COMPONENT */}
        <div className="flex flex-col gap-1.5">
          <Checkbox
            id="agree-checkbox"
            checked={agree}
            onChange={(e) => {
              setAgree(e.target.checked);
              setErrors((prev) => ({ ...prev, agree: "" }));
            }}
            error={errors.agree}
            label={
              <span className="text-slate-650 dark:text-slate-400 select-none">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setTermsModal({ open: true, section: "terms" })}
                  className="inline text-teal-600 hover:text-teal-700 dark:text-teal-450 dark:hover:text-teal-350 font-bold hover:underline transition active:opacity-70"
                >
                  Terms & Conditions
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setTermsModal({ open: true, section: "privacy" })}
                  className="inline text-teal-600 hover:text-teal-700 dark:text-teal-450 dark:hover:text-teal-350 font-bold hover:underline transition active:opacity-70"
                >
                  Privacy Policy
                </button>
              </span>
            }
          />
        </div>

        {/* SUBMIT BUTTON WITH ACCEPTANCE STATE */}
        <div className="relative">
          <Button
            type="submit"
            text="Create Account"
            loading={loading}
            disabled={!agree}
            icon={ShieldCheck}
            className={`transition-all duration-300 ${
              !agree
                ? "opacity-50 cursor-not-allowed shadow-none scale-100 hover:scale-100"
                : "opacity-100 shadow-[0_4px_20px_rgba(20,184,181,0.25)] hover:shadow-[0_6px_24px_rgba(20,184,181,0.35)]"
            }`}
          />
        </div>

        {/* TERMS MODAL */}
        <TermsModal
          isOpen={termsModal.open}
          onClose={() => setTermsModal({ ...termsModal, open: false })}
          onAccept={() => {
            setAgree(true);
            setErrors((prev) => ({ ...prev, agree: "" }));
          }}
          section={termsModal.section}
        />
      </form>
    );
  }

  return null;
};

export default RegisterForm;