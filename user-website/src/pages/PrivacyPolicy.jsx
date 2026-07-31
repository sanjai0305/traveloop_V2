import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
            <h1 className="text-xl font-extrabold text-slate-800">Privacy Policy</h1>
            <p className="text-slate-400 text-xs font-semibold">Last updated: June 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
          <p>
            Welcome to <strong>Traveloop</strong>. Your privacy is of paramount importance to us. This Privacy Policy documents how we collect, use, and process your profile credentials and travel details.
          </p>

          <h2 className="text-base font-bold text-slate-800 pt-2">1. Information We Collect</h2>
          <p>
            We collect profile information when you register, such as your email, first name, last name, and preferences. If you connect via Google Authentication, we retrieve your Google email, profile ID, and avatar image. We also save your created trip details, checklists, budgets, notes, and saved destinations.
          </p>

          <h2 className="text-base font-bold text-slate-800 pt-2">2. How We Use Information</h2>
          <p>
            Your information is used solely to provide core service features: organizing itineraries, calculating trip budget allocations, saving preferences, sync’ing weather warnings, and displaying profile details.
          </p>

          <h2 className="text-base font-bold text-slate-800 pt-2">3. Data Retention and Deletion</h2>
          <p>
            We store data for as long as your account is active. In accordance with Play Store policy, you can trigger a permanent account deletion from your Profile settings at any time, which completely wipes all personal profile details and associated trips from our databases.
          </p>

          <h2 className="text-base font-bold text-slate-800 pt-2">4. Third Party Integrations</h2>
          <p>
            We connect to Google Maps APIs for autocomplete predictions and coordinate lookups, and Open-Meteo for live weather alerts. These integrations do not receive your personal account details.
          </p>

          <h2 className="text-base font-bold text-slate-800 pt-2">5. Security</h2>
          <p>
            We encrypt passwords using bcrypt and issue secure JWT credentials for protected route sessions.
          </p>

          <p className="text-xs text-slate-400 pt-4 text-center border-t border-slate-100">
            For questions regarding privacy, contact support at privacy@traveloop.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
