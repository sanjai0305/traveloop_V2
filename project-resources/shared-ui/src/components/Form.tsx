import React from "react";
import Input from "./Input";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required,
  children,
  className = "",
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-body-sm font-semibold text-[var(--text-primary)]">
      {label}
      {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
    </label>
    {children}
    {hint && !error && (
      <p className="text-caption text-[var(--text-muted)]" id={`${label}-hint`}>
        {hint}
      </p>
    )}
    {error && (
      <p className="text-caption text-rose-500" role="alert">
        {error}
      </p>
    )}
  </div>
);

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export const Form: React.FC<FormProps> = ({ children, className = "", ...props }) => (
  <form className={`space-y-5 ${className}`} noValidate {...props}>
    {children}
  </form>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  className = "",
  id,
  ...props
}) => {
  const fieldId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="block text-body-sm font-semibold text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        className={`w-full min-h-[120px] px-4 py-3 rounded-card border bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y ${
          error ? "border-rose-500" : "border-[var(--border)]"
        } ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p className="text-caption text-rose-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export { Input as FormInput };
export default Form;
