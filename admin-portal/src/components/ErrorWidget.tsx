import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export interface ErrorWidgetProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onReload?: () => void;
}

export const ErrorWidget: React.FC<ErrorWidgetProps> = ({
  title = "Something went wrong",
  message = "An unexpected error occurred in the Admin Portal.",
  error = null,
  onReload = () => window.location.reload(),
}) => {
  return (
    <div className="min-h-[280px] w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-slate-200 dark:border-slate-800 my-4 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4 text-rose-500 shadow-xs">
        <AlertTriangle size={28} />
      </div>

      <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1.5 font-poppins">
        {title}
      </h2>

      <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold max-w-sm mb-5 leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onReload}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:scale-102 active:scale-98 transition-all bg-teal-500 hover:bg-teal-600"
        >
          <RotateCcw size={14} />
          Reload Page
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Home size={14} />
          Dashboard
        </button>
      </div>

      {Boolean((import.meta as any).env?.DEV) && error && (
        <div className="mt-5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left w-full max-w-sm overflow-auto max-h-32 shadow-xs">
          <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400 whitespace-pre-wrap leading-relaxed">
            {error.toString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ErrorWidget;
