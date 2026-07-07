import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
  className = "",
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const colors = {
    primary: "text-primary",
    secondary: "text-secondary",
    white: "text-white",
  };

  return (
    <Loader2
      className={`animate-spin ${sizes[size]} ${colors[color]} ${className}`}
    />
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <LoadingSpinner size="lg" />
          {message && (
            <p className="mt-4 text-body-md text-text-secondary">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface LoadingPageProps {
  message?: string;
  className?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  message = "Loading...",
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen bg-background ${className}`}
    >
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-body-md text-text-secondary">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
