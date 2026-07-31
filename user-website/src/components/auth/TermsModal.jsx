import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import TermsContent from "./TermsContent";

const PrivacyContent = () => (
  <div className="space-y-6 text-slate-600 dark:text-slate-350 text-sm md:text-base leading-relaxed">
    <p className="font-medium text-slate-800 dark:text-slate-200">
      <strong>Last Updated:</strong> June 2026
    </p>
    <p>
      Welcome to <strong>Traveloop</strong>. Your privacy is of paramount importance to us. This Privacy Policy documents how we collect, use, and process your profile credentials and travel details.
    </p>
    <section className="space-y-2">
      <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">1. Information We Collect</h2>
      <p>
        We collect profile information when you register, such as your email, first name, last name, and preferences. If you connect via Google Authentication, we retrieve your Google email, profile ID, and avatar image. We also save your created trip details, checklists, budgets, notes, and saved destinations.
      </p>
    </section>
    <section className="space-y-2">
      <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">2. How We Use Information</h2>
      <p>
        Your information is used solely to provide core service features: organizing itineraries, calculating trip budget allocations, saving preferences, sync’ing weather warnings, and displaying profile details.
      </p>
    </section>
    <section className="space-y-2">
      <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">3. Data Retention and Deletion</h2>
      <p>
        We store data for as long as your account is active. In accordance with Play Store policy, you can trigger a permanent account deletion from your Profile settings at any time, which completely wipes all personal profile details and associated trips from our databases.
      </p>
    </section>
    <section className="space-y-2">
      <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">4. Third Party Integrations</h2>
      <p>
        We connect to Google Maps APIs for autocomplete predictions and coordinate lookups, and Open-Meteo for live weather alerts. These integrations do not receive your personal account details.
      </p>
    </section>
    <section className="space-y-2">
      <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">5. Security</h2>
      <p>
        We encrypt passwords using bcrypt and issue secure JWT credentials for protected route sessions.
      </p>
    </section>
    <p className="text-xs text-slate-400 pt-6 text-center border-t border-slate-100 dark:border-slate-800">
      For questions regarding privacy, contact support at <a href="mailto:privacy@traveloop.com" className="text-teal-600 font-semibold hover:underline">privacy@traveloop.com</a>
    </p>
  </div>
);

const TermsModal = ({ isOpen, onClose, onAccept, section = "terms" }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-950/65 backdrop-blur-md">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-2xl max-h-[85vh] md:max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_24px_70px_rgba(15,23,42,0.22)] overflow-hidden border border-slate-100 dark:border-slate-800/80"
          >
            {/* Header (Sticky) */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 md:px-8 md:py-6 border-b border-slate-100 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {section === "terms" ? "Terms & Conditions" : "Privacy Policy"}
                </h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1">
                  Last updated: June 2026
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {section === "terms" ? <TermsContent /> : <PrivacyContent />}
            </div>

            {/* Footer (Sticky) */}
            <div className="sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-end gap-3 px-6 py-5 md:px-8 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md w-full">
              <button
                onClick={onClose}
                className="w-full sm:w-auto order-2 sm:order-1 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 font-bold text-sm rounded-xl active:scale-[0.97] transition-all"
              >
                Close
              </button>
              
              {onAccept && (
                <button
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="w-full sm:w-auto order-1 sm:order-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-95 text-white font-bold text-sm rounded-xl active:scale-[0.97] transition-all shadow-[0_4px_12px_rgba(20,184,181,0.2)]"
                >
                  Accept & Continue
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TermsModal;
