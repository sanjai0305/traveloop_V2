import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export const ErrorWidget = ({
  title = "Something went wrong",
  message = "The application encountered an unexpected error. Your data is safely stored on our servers.",
  error = null,
  onReload = () => window.location.reload(),
}) => {
  return (
    <div className="min-h-[300px] w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-slate-200 dark:border-slate-800 my-4 shadow-sm transition-colors">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4 text-rose-500 shadow-xs">
        <AlertTriangle size={32} />
      </div>

      <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 font-poppins">
        {title}
      </h2>

      <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={onReload}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-xs shadow-md hover:scale-102 active:scale-98 transition-all"
          style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
        >
          <RotateCcw size={15} />
          Reload Application
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Home size={15} />
          Go Home
        </button>
      </div>

      {process.env.NODE_ENV !== "production" && error && (
        <div className="mt-6 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left w-full max-w-lg overflow-auto max-h-36 shadow-xs">
          <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 whitespace-pre-wrap leading-relaxed">
            {error.toString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ErrorWidget;
