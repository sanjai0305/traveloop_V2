import React from "react";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";
type TextVariant = "body" | "body-sm" | "caption" | "label" | "overline";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  gradient?: boolean;
}

const headingClasses: Record<HeadingLevel, string> = {
  h1: "text-display-sm md:text-display-md lg:text-display-lg font-extrabold tracking-tight text-balance",
  h2: "text-heading-md md:text-heading-lg font-bold tracking-tight text-balance",
  h3: "text-heading-sm md:text-heading-md font-semibold text-balance",
  h4: "text-body-md font-semibold",
};

export const Heading: React.FC<HeadingProps> = ({
  as: Tag = "h2",
  gradient = false,
  className = "",
  children,
  ...props
}) => (
  <Tag
    className={`font-poppins ${headingClasses[Tag]} ${
      gradient
        ? "bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent"
        : "text-[var(--text-primary)]"
    } ${className}`}
    {...props}
  >
    {children}
  </Tag>
);

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant;
  as?: "p" | "span" | "div";
  muted?: boolean;
}

const textVariants: Record<TextVariant, string> = {
  body: "text-body-md leading-relaxed text-pretty",
  "body-sm": "text-body-sm leading-relaxed",
  caption: "text-caption",
  label: "text-body-sm font-semibold",
  overline: "text-tiny uppercase tracking-widest font-bold",
};

export const Text: React.FC<TextProps> = ({
  variant = "body",
  as: Tag = "p",
  muted = false,
  className = "",
  children,
  ...props
}) => (
  <Tag
    className={`${textVariants[variant]} ${
      muted ? "text-[var(--text-muted)]" : "text-[var(--text-secondary)]"
    } ${className}`}
    {...props}
  >
    {children}
  </Tag>
);

export default Heading;
