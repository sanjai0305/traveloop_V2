import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export const ErrorWidget = ({
  title = "Something went wrong",
  message = "The application encountered an unexpected error. Your trip plans are safely backed up.",
  error = null,
  onReload = () => window.location.reload(),
}) => {
  return (
    <div className="min-h-[280px] w-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-slate-200 my-4 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4 text-rose-500 shadow-xs">
        <AlertTriangle size={28} />
      </div>

      <h2 className="text-lg font-black text-slate-800 mb-1.5 font-poppins">
        {title}
      </h2>

      <p className="text-slate-500 text-xs font-semibold max-w-xs mb-5 leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onReload}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
        >
          <RotateCcw size={14} />
          Reload
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
        >
          <Home size={14} />
          Home
        </button>
      </div>

      {process.env.NODE_ENV !== "production" && error && (
        <div className="mt-5 p-3 rounded-xl bg-slate-100 border border-slate-200 text-left w-full max-w-xs overflow-auto max-h-32 shadow-xs">
          <p className="text-[10px] font-mono text-rose-600 whitespace-pre-wrap leading-relaxed">
            {error.toString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ErrorWidget;
