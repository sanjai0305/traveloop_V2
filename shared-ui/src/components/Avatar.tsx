import React, { useState } from "react";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = "md",
  className = "",
  ...props
}) => {
  const [error, setError] = useState(false);

  const getInitials = (n: string) => {
    const parts = n.split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const sizes = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-sm",
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center font-bold bg-slate-800 border border-slate-700 text-slate-300 shrink-0 ${sizes[size]} ${className}`}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={name}
          onError={() => setError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-poppins select-none">{getInitials(name)}</span>
      )}
    </div>
  );
};

export default Avatar;
