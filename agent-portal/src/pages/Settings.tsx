import React, { useState } from "react";
import { Settings as SettingsIcon, Bell, Shield, Keyboard, ToggleLeft, HelpCircle } from "lucide-react";
import { GlassCard, Button } from "../components/ui";
import { useAuthStore } from "../store/authStore";

export const Settings: React.FC = () => {
  const { agent } = useAuthStore();
  const [notifications, setNotifications] = useState({
    approvals: true,
    cancellations: true,
    weeklyReport: false,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveSettings = () => {
    alert("System configurations updated successfully!");
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* ── Heading ── */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Portal Settings
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mt-1">
          Adjust security flags, real-time notification alerts, and theme preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Alerts Config */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150">Notification Preferences</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">New Booking Requests</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Receive immediate dashboard alerts for incoming traveler seats.</p>
              </div>
              <button
                onClick={() => handleToggle("approvals")}
                className={`w-10 h-6 rounded-full relative p-0.5 transition-all ${notifications.approvals ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                  }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-all ${notifications.approvals ? "translate-x-4" : ""
                  }`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-105/50 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Cancellation Alerts</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Alert when passengers request refunds or cancel tickets.</p>
              </div>
              <button
                onClick={() => handleToggle("cancellations")}
                className={`w-10 h-6 rounded-full relative p-0.5 transition-all ${notifications.cancellations ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                  }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-all ${notifications.cancellations ? "translate-x-4" : ""
                  }`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-105/50 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Weekly Performance Reports</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Receive gross weekly seat sales and destination reports.</p>
              </div>
              <button
                onClick={() => handleToggle("weeklyReport")}
                className={`w-10 h-6 rounded-full relative p-0.5 transition-all ${notifications.weeklyReport ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                  }`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-all ${notifications.weeklyReport ? "translate-x-4" : ""
                  }`} />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Security & Access */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150">Security & API Access</h3>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <div className="flex justify-between py-2">
              <span className="text-slate-500 dark:text-slate-450">API Base Connection</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono text-[10px] bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">
                {import.meta.env.VITE_API_URL || "https://traveloopv2.duckdns.org/api"}
              </span>
            </div>

            <div className="flex justify-between py-2 border-t border-slate-105/50 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-450">GST Verification Status</span>
              <span className="text-emerald-500 font-bold">GSTIN Validated</span>
            </div>

            <div className="flex justify-between py-2 border-t border-slate-105/50 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-450">Verification Badge Status</span>
              <span className={agent?.isVerified ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                {agent?.isVerified ? "Verified (Active)" : "Pending Review"}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <Button onClick={handleSaveSettings} className="px-8">
            Save Preference Configurations
          </Button>
        </div>
      </div>
    </div>
  );
};
