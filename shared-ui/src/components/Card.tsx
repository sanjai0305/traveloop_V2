import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = false,
  hoverable = true,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 transition-all duration-300 ${
        hoverable ? "hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/20" : ""
      } ${
        glow ? "shadow-[0_0_20px_-5px_rgba(20,184,166,0.15)] hover:shadow-[0_0_25px_-5px_rgba(20,184,166,0.25)] border-teal-500/20 hover:border-teal-500/40" : ""
      } ${className}`}
      {...props}
    >
      {/* Decorative background glow for glow cards */}
      {glow && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
      )}
      {children}
    </div>
  );
};

export default Card;
