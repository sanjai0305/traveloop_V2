import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Terms & Conditions</h1>
            <p className="text-slate-400 text-xs font-semibold">Last updated: June 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
          <p>
            Please read these Terms and Conditions carefully before using the <strong>Traveloop</strong> mobile application.
          </p>

          <h2 className="text-base font-bold text-slate-800 pt-2">1. Terms of Use</h2>
          <p>
            By creating an account, registering via email, or linking your Google login account, you agree to comply with these terms. If you disagree with any clause, please terminate usage of the app.
          </p>

          <h2 className="text-base font-bold text-slate-800 pt-2">2. Account Responsibility</h2>
          <p>
            You are responsible for keeping your JWT session token secure and ensuring your credentials are not shared. You agree to provide accurate registration info (name, email, city).
          </p>

          <h2 className="text-base font-bold text-slate-800 pt-2">3. Acceptable Conduct</h2>
          <p>
            Traveloop is a travel planning tool. You agree not to spam or compromise servers by making excessive API requests or reverse-engineering core endpoints. We deploy rate-limiting checks to prevent system disruptions.
          </p>

          <h2 className="text-base font-bold text-slate-800 pt-2">4. Disclaimers</h2>
          <p>
            Meteorological warnings and weather forecasts are retrieved from Open-Meteo public APIs. Place recommendations are supported by Google Places services. While we aim for maximum uptime and correctness, we do not guarantee coordinates or weather accuracy.
          </p>

          <h2 className="text-base font-bold text-slate-800 pt-2">5. Termination</h2>
          <p>
            We reserve the right to suspend or block accounts violating these terms, or to purge inactive profiles. You can close your account and wipe associated records using the profile settings.
          </p>

          <p className="text-xs text-slate-400 pt-4 text-center border-t border-slate-100">
            For inquiry regarding service conditions, contact support at legal@traveloop.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
