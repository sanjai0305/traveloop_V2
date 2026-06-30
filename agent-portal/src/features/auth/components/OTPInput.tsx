import React, { useRef, useEffect } from "react";

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}

export const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, length = 6 }) => {
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Split string value into array
  const otpArray = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value;
    if (isNaN(Number(val))) return; // restrict to numbers

    const newOtp = [...otpArray];
    // Keep only last char if multiple entered
    newOtp[idx] = val.substring(val.length - 1);
    const combined = newOtp.join("");
    onChange(combined);

    // Auto-focus next box
    if (val && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      if (!otpArray[idx] && idx > 0) {
        // Focus previous input on backspace if current is empty
        inputRefs.current[idx - 1]?.focus();
        
        const newOtp = [...otpArray];
        newOtp[idx - 1] = "";
        onChange(newOtp.join(""));
      } else {
        const newOtp = [...otpArray];
        newOtp[idx] = "";
        onChange(newOtp.join(""));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (isNaN(Number(pastedData))) return;

    const pastedChars = pastedData.split("").slice(0, length);
    const newOtp = pastedChars.concat(Array(length).fill("")).slice(0, length);
    onChange(newOtp.join(""));

    // Focus last filled box
    const focusIdx = Math.min(pastedChars.length, length - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  // Auto-focus first input on load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="flex justify-between gap-2 max-w-sm mx-auto" onPaste={handlePaste}>
      {Array(length)
        .fill(0)
        .map((_, idx) => (
          <input
            key={idx}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otpArray[idx]}
            ref={(el) => {
              if (el) inputRefs.current[idx] = el;
            }}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className="w-12 h-14 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-center font-extrabold text-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
          />
        ))}
    </div>
  );
};

export default OTPInput;
