import React from "react";

interface SafeAreaProps {
  children: React.ReactNode;
  edges?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
  className?: string;
}

export const SafeArea: React.FC<SafeAreaProps> = ({
  children,
  edges = { top: true, bottom: true, left: true, right: true },
  className = "",
}) => {
  const paddingStyle: React.CSSProperties = {
    paddingTop: edges.top ? "env(safe-area-inset-top, 0px)" : 0,
    paddingBottom: edges.bottom ? "env(safe-area-inset-bottom, 0px)" : 0,
    paddingLeft: edges.left ? "env(safe-area-inset-left, 0px)" : 0,
    paddingRight: edges.right ? "env(safe-area-inset-right, 0px)" : 0,
  };

  return (
    <div
      className={className}
      style={paddingStyle}
    >
      {children}
    </div>
  );
};

export const SafeAreaTop: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={className}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {children}
    </div>
  );
};

export const SafeAreaBottom: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={className}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {children}
    </div>
  );
};

export const SafeAreaInsets: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <SafeArea edges={{ top: true, bottom: true, left: true, right: true }} className={className}>
      {children}
    </SafeArea>
  );
};

export default SafeArea;
