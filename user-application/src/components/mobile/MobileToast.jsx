// src/components/mobile/MobileToast.jsx

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const TOAST_VARIANTS = {
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-500",
    light: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    iconColor: "text-emerald-500",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-500",
    light: "bg-red-50 border-red-200",
    text: "text-red-700",
    iconColor: "text-red-500",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-amber-500",
    light: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    iconColor: "text-amber-500",
  },
  info: {
    icon: Info,
    bg: "bg-blue-500",
    light: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    iconColor: "text-blue-500",
  },
};

// ─── PROVIDER ────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(
    (message, type = "info", duration = 3000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* TOAST CONTAINER */}
      <div
        className="
          fixed
          bottom-24
          left-0
          right-0
          z-[9999]

          flex
          flex-col
          items-center
          gap-2

          px-4

          pointer-events-none
        "
        style={{ bottom: "calc(72px + max(env(safe-area-inset-bottom), 8px) + 8px)" }}
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ─── TOAST ITEM ───────────────────────────────────────────────────────────────
const Toast = ({ toast, onRemove }) => {
  const variant = TOAST_VARIANTS[toast.type] || TOAST_VARIANTS.info;
  const Icon = variant.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`
        pointer-events-auto

        w-full
        max-w-sm

        flex
        items-center
        gap-3

        px-4
        py-3

        rounded-mobile-xl

        border

        shadow-card

        animate-toast

        ${variant.light}
      `}
    >
      <Icon size={20} className={`flex-shrink-0 ${variant.iconColor}`} />

      <p
        className={`
          flex-1
          text-sm
          font-medium
          ${variant.text}
        `}
      >
        {toast.message}
      </p>

      <button
        onClick={() => onRemove(toast.id)}
        className={`
          flex-shrink-0

          w-6
          h-6

          flex
          items-center
          justify-center

          rounded-full

          opacity-60
          hover:opacity-100

          transition-opacity
        `}
      >
        <X size={14} className={variant.text} />
      </button>
    </div>
  );
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { addToast, removeToast } = context;

  return {
    success: (msg, duration) => addToast(msg, "success", duration),
    error: (msg, duration) => addToast(msg, "error", duration),
    warning: (msg, duration) => addToast(msg, "warning", duration),
    info: (msg, duration) => addToast(msg, "info", duration),
    remove: removeToast,
  };
};

export default ToastProvider;
