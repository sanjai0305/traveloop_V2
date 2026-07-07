import React from "react";

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className = "",
  as = "p",
}) => {
  const Tag = as;

  const responsiveClasses = {
    h1: "text-display-sm md:text-display-md lg:text-display-lg",
    h2: "text-heading-sm md:text-heading-md lg:text-heading-lg",
    h3: "text-body-lg md:text-heading-sm lg:text-heading-md",
    h4: "text-body-md md:text-body-lg lg:text-heading-sm",
    p: "text-body-sm md:text-body-md lg:text-body-lg",
    span: "text-caption md:text-body-sm lg:text-body-md",
  };

  return (
    <Tag className={`${responsiveClasses[as]} ${className}`}>
      {children}
    </Tag>
  );
};

interface ResponsiveHeadingProps {
  children: React.ReactNode;
  level: 1 | 2 | 3 | 4;
  className?: string;
}

export const ResponsiveHeading: React.FC<ResponsiveHeadingProps> = ({
  children,
  level,
  className = "",
}) => {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";

  const levelClasses = {
    1: "text-display-sm md:text-display-md lg:text-display-lg font-extrabold",
    2: "text-heading-sm md:text-heading-md lg:text-heading-lg font-bold",
    3: "text-body-lg md:text-heading-sm lg:text-heading-md font-semibold",
    4: "text-body-md md:text-body-lg lg:text-heading-sm font-medium",
  };

  return (
    <Tag className={`${levelClasses[level]} ${className}`}>
      {children}
    </Tag>
  );
};

export default ResponsiveText;
