import React, { useState } from "react";
import { AlertCircle } from "lucide-react";

export const UPIPayment = ({ amount, onSubmit, onCancel }) => {
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateUPI = (val) => {
    const regex = /^[\w.-]+@[\w.-]+$/;
    return regex.test(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!upiId) {
      setError("Please enter your UPI ID.");
      return;
    }

    if (!validateUPI(upiId)) {
      setError("Invalid UPI ID format. Ex: name@okaxis");
      return;
    }

    setLoading(true);
    onSubmit(upiId);
  };

  return (
    <div className="flex flex-col p-4 bg-gray-900/60 rounded-xl border border-white/10 backdrop-blur-md">
      <h3 className="text-lg font-bold text-white mb-2 text-center">Pay using UPI ID</h3>
      <p className="text-xs text-gray-400 mb-6 text-center">Enter your UPI VPA to request money directly in your UPI app.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="upiId" className="block text-xs font-semibold text-gray-400 mb-1.5">UPI ID / VPA</label>
          <input
            id="upiId"
            type="text"
            placeholder="username@bankhandle"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            disabled={loading}
            className="w-full bg-white/5 border border-white/15 focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
          />
          {error && (
            <div className="flex items-center text-red-400 text-xs mt-1.5">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center"
        >
          {loading ? (
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Requesting ₹{amount}...</span>
            </div>
          ) : (
            `Pay ₹${amount}`
          )}
        </button>
      </form>
    </div>
  );
};

export default UPIPayment;
