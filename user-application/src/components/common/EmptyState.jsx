import React from "react";
import { motion } from "framer-motion";

export default function EmptyState({
  icon = "📖",
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  className = ""
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs my-6 ${className}`}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center text-3xl sm:text-4xl mx-auto ring-8 ring-teal-500/10">
        {icon}
      </div>

      <div className="space-y-1.5 max-w-lg mx-auto">
        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
