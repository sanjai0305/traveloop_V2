import React from "react";

interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: number;
  className?: string;
}

export const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  size = 44,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        ...props.style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: number;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  size = 44,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        ...props.style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default TouchTarget;
