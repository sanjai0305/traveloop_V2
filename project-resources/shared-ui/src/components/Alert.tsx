import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  message,
  className = "",
}) => {
  const styles = {
    info: {
      bg: "bg-teal-500/10 border border-teal-500/20 text-teal-400",
      icon: <Info className="w-4 h-4 shrink-0" />,
    },
    success: {
      bg: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
      icon: <CheckCircle className="w-4 h-4 shrink-0" />,
    },
    warning: {
      bg: "bg-amber-500/10 border border-amber-500/20 text-amber-400",
      icon: <AlertCircle className="w-4 h-4 shrink-0" />,
    },
    error: {
      bg: "bg-rose-500/10 border border-rose-500/20 text-rose-400",
      icon: <XCircle className="w-4 h-4 shrink-0" />,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed ${styles[type].bg} ${className}`}
    >
      {styles[type].icon}
      <div className="font-poppins">{message}</div>
    </motion.div>
  );
};

export default Alert;
