import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  startIcon,
  endIcon,
  className = "",
  id,
  type = "text",
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-poppins block"
        >
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {startIcon && (
          <div className="absolute left-3.5 text-slate-500 pointer-events-none">
            {startIcon}
          </div>
        )}
        
        <input
          id={id}
          type={type}
          className={`w-full bg-slate-950 border rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all ${
            startIcon ? "pl-10" : "pl-4"
          } ${endIcon ? "pr-10" : "pr-4"} ${
            error
              ? "border-rose-500 focus:border-rose-500"
              : "border-slate-800 focus:border-teal-500"
          } py-2.5 ${className}`}
          {...props}
        />
        
        {endIcon && (
          <div className="absolute right-3.5 text-slate-500 pointer-events-none">
            {endIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-[10px] text-rose-400 font-medium font-poppins animate-fade-in pl-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
