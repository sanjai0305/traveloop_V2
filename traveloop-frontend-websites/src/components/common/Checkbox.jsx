import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const Checkbox = ({ checked, onChange, error, label, id }) => {
  return (
    <div className="flex flex-col gap-1.5 my-3">
      <label className="flex items-start gap-3 cursor-pointer select-none group w-full text-left">
        <div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
          />
          {/* Custom Checkbox Design */}
          <motion.div
            initial={false}
            animate={{
              backgroundColor: checked ? "#14B8B5" : "rgba(255, 255, 255, 0.9)",
              borderColor: checked ? "#14B8B5" : error ? "#EF4444" : "#CBD5E1",
              boxShadow: checked
                ? "0 4px 12px rgba(20, 184, 181, 0.25)"
                : "0 1px 2px rgba(0, 0, 0, 0.05)",
              scale: checked ? [1, 1.15, 1] : 1,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`
              w-5 h-5 rounded-md border-2 flex items-center justify-center
              peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500 peer-focus-visible:ring-offset-2
              peer-focus:ring-2 peer-focus:ring-teal-500/30
              group-hover:border-teal-400
              transition-shadow duration-200
            `}
          >
            {checked && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
              </motion.div>
            )}
          </motion.div>
        </div>
        {/* Label text */}
        <span className="text-sm text-slate-650 dark:text-slate-400 leading-tight">
          {label}
        </span>
      </label>
      {error && (
        <p className="text-xs text-rose-500 font-semibold mt-0.5 pl-8 text-left">{error}</p>
      )}
    </div>
  );
};

export default Checkbox;
