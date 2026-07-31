import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info" | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className = "",
  ...props
}) => {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    info: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
    neutral: "bg-slate-800/40 text-slate-400 border border-slate-700/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-poppins ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
