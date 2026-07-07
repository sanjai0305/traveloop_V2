import React from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  className = "",
  maxWidth = "2xl",
  padding = true,
}) => {
  const maxWidths = {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1440px",
    full: "100%",
  };

  return (
    <div
      className={`mx-auto ${padding ? "px-content-mobile md:px-content-tablet lg:px-content-desktop" : ""} ${className}`}
      style={{ maxWidth: maxWidths[maxWidth] }}
    >
      {children}
    </div>
  );
};

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = "",
  size = "lg",
}) => {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
  };

  return (
    <div className={`mx-auto px-4 ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
};

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg";
}

export const Section: React.FC<SectionProps> = ({
  children,
  className = "",
  spacing = "md",
}) => {
  const spacingMap = {
    sm: "gap-4",
    md: "gap-8",
    lg: "gap-12",
  };

  return (
    <section className={`py-section-mobile md:py-section-desktop ${spacingMap[spacing]} ${className}`}>
      {children}
    </section>
  );
};

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  children,
  className = "",
}) => {
  const breakpoint = useBreakpoint();

  return (
    <div className={`w-full ${className}`}>
      {children}
    </div>
  );
};

interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  bottomNav?: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  header,
  sidebar,
  bottomNav,
  className = "",
}) => {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {header}
      <div className="flex">
        {sidebar}
        <main className="flex-1 pb-bottom-nav lg:pb-0">
          {children}
        </main>
      </div>
      {bottomNav}
    </div>
  );
};

export default Layout;
