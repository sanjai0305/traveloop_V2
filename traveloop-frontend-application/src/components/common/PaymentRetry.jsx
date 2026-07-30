import React from "react";
import { AlertTriangle, RefreshCw, X, HelpCircle } from "lucide-react";

export const PaymentRetry = ({ errorMessage, onRetry, onFallback, onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-md text-center max-w-sm mx-auto">
      <div className="bg-red-500/20 p-3 rounded-full mb-4 border border-red-500/30">
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>

      <h3 className="text-lg font-bold text-white mb-2">Payment Gateway Unavailable</h3>
      <p className="text-xs text-gray-300 mb-6 leading-relaxed">
        {errorMessage || "We are currently experiencing connection issues with the primary payment gateway. No amount has been deducted."}
      </p>

      <div className="flex flex-col space-y-2.5 w-full">
        <button
          onClick={onRetry}
          className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Payment Connection
        </button>

        <button
          onClick={onFallback}
          className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors"
        >
          Generate QR/UPI Payment
        </button>

        <button
          onClick={onClose}
          className="flex items-center justify-center bg-transparent border border-white/15 text-gray-400 hover:text-white font-semibold py-2.5 rounded-lg text-xs transition-colors"
        >
          <X className="w-4 h-4 mr-1.5" /> Close Checkout
        </button>
      </div>

      <div className="flex items-center justify-center mt-6 text-gray-500 text-[10px] space-x-1.5">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Need assistance? Contact support</span>
      </div>
    </div>
  );
};

export default PaymentRetry;
