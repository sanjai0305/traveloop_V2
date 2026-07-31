import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
}) => {
  const styles = {
    text: "h-3 w-3/4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={`animate-pulse bg-slate-800/60 ${styles[variant]} ${className}`}
    />
  );
};

export default Skeleton;
