import React, { useState, useEffect } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

export const QRPayment = ({ qrData, onConfirm, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      onCancel();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onCancel]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrData.upiLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-900/60 rounded-xl border border-white/10 backdrop-blur-md">
      <h3 className="text-lg font-bold text-white mb-2">Scan & Pay using UPI QR</h3>
      <p className="text-xs text-gray-400 mb-4 text-center">Open GPay, PhonePe, Paytm or any UPI App to scan the QR code.</p>

      {/* QR Code Container */}
      <div className="bg-white p-3 rounded-lg shadow-xl mb-4 border border-white/20">
        <img src={qrData.qrImage} alt="UPI Payment QR Code" className="w-56 h-56" />
      </div>

      {/* Countdown Timer */}
      <div className="flex items-center space-x-2 mb-4 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs font-semibold text-red-400">QR expires in {formatTime(timeLeft)}</span>
      </div>

      {/* UPI Details */}
      <div className="w-full bg-white/5 border border-white/10 rounded-lg p-3 mb-4 flex items-center justify-between">
        <div className="overflow-hidden mr-2">
          <p className="text-xs text-gray-400">Merchant UPI ID</p>
          <p className="text-sm font-semibold text-white truncate">{qrData.upiId}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1.5 rounded-md transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 mr-1 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
          {copied ? "Copied" : "Copy Link"}
        </button>
      </div>

      {/* Deep Link Buttons for Mobile */}
      <div className="grid grid-cols-2 gap-2 w-full mb-6">
        <a
          href={qrData.upiLink}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
        >
          Open UPI App <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
        </a>
        <button
          onClick={onConfirm}
          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
        >
          I have Paid
        </button>
      </div>
    </div>
  );
};

export default QRPayment;
