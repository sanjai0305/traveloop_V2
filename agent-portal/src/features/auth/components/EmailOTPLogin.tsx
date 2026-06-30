import React, { useState, useEffect } from "react";
import { Mail, Clock, RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Input, Button } from "../../../components/ui";
import { OTPInput } from "./OTPInput";

interface EmailOTPLoginProps {
  onSuccess: (agent: any) => void;
  onError: (error: string) => void;
}

export const EmailOTPLogin: React.FC<EmailOTPLoginProps> = ({ onSuccess, onError }) => {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  const { sendOtp, verifyOtpAndLogin, isLoading } = useAuth();

  // Resend Timer Countdown
  useEffect(() => {
    if (!otpSent) return;
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer, otpSent]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      onError("Please enter a valid email address.");
      return;
    }

    try {
      await sendOtp(email);
      setOtpSent(true);
      setResendTimer(60);
      setIsResendDisabled(true);
    } catch (e: any) {
      onError(e.message || "Failed to send OTP.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      onError("Please enter a valid 6-digit code.");
      return;
    }

    try {
      const agentProfile = await verifyOtpAndLogin(email, otpCode);
      onSuccess(agentProfile);
    } catch (e: any) {
      onError(e.message || "Verification code is incorrect or expired.");
    }
  };

  const handleResendOtp = async () => {
    if (isResendDisabled) return;
    try {
      await sendOtp(email);
      setResendTimer(60);
      setIsResendDisabled(true);
    } catch (e: any) {
      onError(e.message || "Resend failed.");
    }
  };

  return (
    <div className="w-full mt-2">
      {!otpSent ? (
        /* Stage 1: Request Email */
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="relative">
            <Input
              label="Agent Email Address"
              type="email"
              placeholder="name@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11"
            />
            <Mail className="absolute left-4 bottom-3.5 w-5 h-5 text-slate-400" />
          </div>
          <Button type="submit" loading={isLoading} className="w-full py-3.5">
            Continue with Email OTP
          </Button>
        </form>
      ) : (
        /* Stage 2: OTP Verification */
        <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Enter Verification Code</h3>
            <p className="text-xs text-slate-400 dark:text-slate-550 mt-1">
              We sent a 6-digit verification code to <span className="font-semibold text-primary">{email}</span>.
            </p>
          </div>

          <OTPInput value={otpCode} onChange={setOtpCode} length={6} />

          <Button type="submit" loading={isLoading} className="w-full py-3.5">
            Verify Code & Sign In
          </Button>

          {/* Resend Controls */}
          <div className="flex items-center justify-between text-xs mt-4">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResendDisabled}
              className={`flex items-center gap-1.5 font-bold transition-all ${
                isResendDisabled
                  ? "text-slate-350 dark:text-slate-650 cursor-not-allowed"
                  : "text-primary hover:underline"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resend Code
            </button>

            {isResendDisabled && (
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Resend in {resendTimer}s
              </span>
            )}
          </div>

          {/* Go Back button */}
          <button
            type="button"
            onClick={() => setOtpSent(false)}
            className="w-full text-center text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-all hover:underline"
          >
            Change email address
          </button>
        </form>
      )}
    </div>
  );
};
export default EmailOTPLogin;
