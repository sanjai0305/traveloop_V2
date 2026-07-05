import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadImage, validateImageFile } from "../services/firebase";
import { uploadCompanyLogo, uploadAgentPhoto } from "../services/cloudinaryUpload";

// ── GlassCard Component ──
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  teal?: boolean;
}
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  strong = false,
  teal = false,
  ...props
}) => {
  const glassClass = teal
    ? "glass-teal"
    : strong
    ? "glass-strong"
    : "glass";
  return (
    <div
      className={`rounded-2xl border p-6 transition-all duration-300 ${glassClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ── Button Component ──
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}
export const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  loading = false,
  size = "md",
  disabled,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  const variantStyles = {
    primary: "gradient-brand text-white shadow-brand hover:brightness-105",
    secondary: "gradient-dark text-white hover:brightness-110",
    outline: "bg-transparent border border-slate-200 text-slate-700 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-sm",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

// ── Input Component ──
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        {label && (() => {
          const hasAsterisk = label.endsWith(" *");
          const cleanLabel = hasAsterisk ? label.slice(0, -2) : label;
          return (
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {cleanLabel}
              {hasAsterisk && (
                <span className="text-rose-500 font-extrabold ml-1.5 text-[14px] leading-none" title="Mandatory Field">*</span>
              )}
            </label>
          );
        })()}
        <input
          ref={ref}
          className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 ${
            error ? "border-rose-450 focus:border-rose-450 focus:ring-rose-500/10" : ""
          } ${className}`}
          {...props}
        />
        {helperText && !error && (
          <span className="block text-[10px] text-slate-400 dark:text-slate-550 mt-1 font-medium">
            {helperText}
          </span>
        )}
        {error && (
          <span className="block text-xs text-rose-500 mt-1 font-bold">
            {error}
          </span>
        )}
      </div>
    );
  }
);

// ── Select Component ──
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        {label && (
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 ${
            error ? "border-rose-400" : ""
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="block text-xs text-rose-500 mt-1 font-medium">
            {error}
          </span>
        )}
      </div>
    );
  }
);

// ── ImageUploadBox Component ──
interface ImageUploadBoxProps {
  label: string;
  folder: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
  circular?: boolean;
}
export const ImageUploadBox: React.FC<ImageUploadBoxProps> = ({
  label,
  folder,
  value,
  onChange,
  error,
  circular = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setValidationError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid file selection.");
      return;
    }

    // Immediately create local preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let url = "";
      if (folder === "logos") {
        const result = await uploadCompanyLogo(file, (percent) => {
          setUploadProgress(percent);
        });
        url = result.url;
      } else if (folder === "profiles" || folder === "profileImage" || folder === "agentPhoto") {
        const result = await uploadAgentPhoto(file, (percent) => {
          setUploadProgress(percent);
        });
        url = result.url;
      } else {
        url = await uploadImage(file, folder, (percent) => {
          setUploadProgress(percent);
        });
      }
      onChange(url);
    } catch (e: any) {
      console.error(e);
      setValidationError(e.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Revoke object URL after upload completes or fails
      URL.revokeObjectURL(objectUrl);
      setLocalPreviewUrl(null);
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const displayImage = localPreviewUrl || value;

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleBoxClick}
        className={`relative cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary bg-slate-50/20 dark:bg-slate-900/10 transition-all duration-300 p-4 min-h-[140px] text-center ${
          circular ? "rounded-full w-36 h-36 mx-auto min-h-0 overflow-hidden" : "rounded-2xl"
        } ${dragActive ? "border-primary bg-primary/5" : ""} ${(error || validationError) ? "border-rose-400" : ""}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {isUploading ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[120px]">
            {/* Show Instant Blur Preview */}
            {displayImage && (
              <img
                src={displayImage}
                alt="Preview"
                className={`absolute inset-0 object-cover opacity-30 blur-xs ${circular ? "w-36 h-36 rounded-full" : "w-full h-full rounded-xl"}`}
                onError={(e: any) => { e.target.src = "/placeholder.jpg"; }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Uploading... {uploadProgress}%
              </span>
              {/* Progress Bar */}
              <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : value ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={value}
              alt="Preview"
              className={`object-cover ${circular ? "w-36 h-36 rounded-full" : "max-h-[160px] rounded-xl w-full"}`}
              onError={(e: any) => { e.target.src = "/placeholder.jpg"; }}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 p-1 bg-slate-900/60 text-white rounded-full hover:bg-slate-900/80 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-850 text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all duration-300 mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-350">
              Drag & Drop image
            </span>
            <span className="text-[10px] text-slate-400 mt-1">
              or click to browse
            </span>
          </div>
        )}
      </div>
      {(error || validationError) && (
        <span className="block text-xs text-rose-500 mt-1.5 font-bold">
          {error || validationError}
        </span>
      )}
    </div>
  );
};

// ── Modal Component ──
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
