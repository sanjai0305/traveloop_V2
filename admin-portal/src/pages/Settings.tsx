import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Settings as SettingsIcon, ShieldCheck, ShieldAlert, Percent, Radio, Save } from "lucide-react";

export const Settings: React.FC = () => {
  const { admin, updateAdminRole } = useAuthStore();
  const [defaultRate, setDefaultRate] = useState<number>(10);
  const [role, setRole] = useState<string>(admin?.role || "Super Admin");
  const [twoFactor, setTwoFactor] = useState<boolean>(admin?.twoFactorEnabled ?? true);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/admin/commission");
        if (res.data.success) {
          setDefaultRate(res.data.defaultCommissionRate);
        }
      } catch (err) {
        console.warn("Failed to fetch default settings", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    try {
      const res = await api.patch("/admin/commission", { rate: defaultRate });
      if (res.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert("Failed to save commission rate");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (selectedRole: any) => {
    setRole(selectedRole);
    updateAdminRole(selectedRole);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-page">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-poppins text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-teal-400" />
          <span>System Configurations</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Adjust default marketplace commission, simulate user roles, and adjust 2FA.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Marketplace settings form */}
        <form onSubmit={handleSaveCommission} className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white font-poppins flex items-center gap-2">
            <Percent className="w-4 h-4 text-teal-400" />
            <span>Marketplace Commission</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The commission is deducted from all bookings processed on Traveloop. Custom rates set on specific agents will override this base setting.
          </p>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Default Commission %
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                required
                value={defaultRate}
                onChange={(e) => setDefaultRate(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 text-xs font-bold font-mono">%</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving Settings..." : "Save Commission Policy"}</span>
          </button>

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center rounded-xl font-medium animate-fade-in">
              Commission policy saved successfully!
            </div>
          )}
        </form>

        {/* Role Simulation controls */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white font-poppins flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-400" />
            <span>Role Simulation (QA Test)</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Switch administrative roles on-the-fly to test menu access, routing privileges, and button constraints.
          </p>

          <div className="space-y-2 mt-2">
            {[
              { role: "Super Admin", desc: "Unrestricted master controls." },
              { role: "Finance Admin", desc: "General ledger auditing and payout triggers." },
              { role: "Support Admin", desc: "Read-only catalogs and agent directories." },
              { role: "Operations Admin", desc: "Trip verification and agent approvals." }
            ].map((item) => (
              <button
                key={item.role}
                onClick={() => handleRoleChange(item.role)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                  role === item.role
                    ? "bg-slate-950 border-teal-500/60 text-white shadow-lg shadow-teal-500/5"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div>
                  <div className="text-xs font-bold font-poppins">{item.role}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{item.desc}</div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  role === item.role ? "border-teal-500 bg-teal-500" : "border-slate-800"
                }`}>
                  {role === item.role && <div className="w-1.5 h-1.5 rounded-full bg-slate-950"></div>}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Security Policies Info */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white font-poppins flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Factor Authentication (2FA)</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            2FA is globally enforced for all Traveloop administrators. Sign in checks prompt for a 6-digit one-time validation code sent to the administrator's email.
          </p>
        </div>

        <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20">
          Enforced
        </span>
      </div>

    </div>
  );
};
