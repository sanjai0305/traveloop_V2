import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Settings as SettingsIcon, ShieldCheck, Percent, Radio, Save, Gift, Mail, CreditCard, Key, Shield } from "lucide-react";

export const Settings: React.FC = () => {
  const { admin, updateAdminRole } = useAuthStore();
  const [defaultRate, setDefaultRate] = useState<number>(10);
  const [role, setRole] = useState<string>(admin?.role || "Super Admin");
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Referral states
  const [referralEnabled, setReferralEnabled] = useState<boolean>(false);
  const [referralDiscount, setReferralDiscount] = useState<number>(5);
  const [referralCoinReward, setReferralCoinReward] = useState<number>(100);

  const [scratchEnabled, setScratchEnabled] = useState<boolean>(true);
  const [travelCoinsEnabled, setTravelCoinsEnabled] = useState<boolean>(true);
  const [couponExpiryEnabled, setCouponExpiryEnabled] = useState<boolean>(true);
  const [minReward, setMinReward] = useState<number>(5);
  const [maxReward, setMaxReward] = useState<number>(30);
  const [probBronze, setProbBronze] = useState<number>(50);
  const [probSilver, setProbSilver] = useState<number>(25);
  const [probGold, setProbGold] = useState<number>(15);
  const [probDiamond, setProbDiamond] = useState<number>(10);

  const [savingReferral, setSavingReferral] = useState(false);
  const [referralSaveSuccess, setReferralSaveSuccess] = useState(false);

  // SaaS Extra Settings (persisted to localStorage for browser QA persistence)
  const [qrUnlockHours, setQrUnlockHours] = useState<number>(() => {
    return Number(localStorage.getItem("settings_qr_unlock") || 24);
  });
  const [supportEmail, setSupportEmail] = useState<string>(() => {
    return localStorage.getItem("settings_support_email") || "support@traveloop.com";
  });
  const [upiId, setUpiId] = useState<string>(() => {
    return localStorage.getItem("settings_upi_id") || "traveloop@okaxis";
  });
  const [razorpayKey, setRazorpayKey] = useState<string>(() => {
    return localStorage.getItem("settings_rzp_key") || "rzp_test_AbCd12345";
  });
  const [razorpaySecret, setRazorpaySecret] = useState<string>(() => {
    return localStorage.getItem("settings_rzp_secret") || "••••••••••••••••";
  });
  const [twoFactor, setTwoFactor] = useState<boolean>(() => {
    return localStorage.getItem("settings_2fa_enabled") !== "false";
  });
  const [savingExtra, setSavingExtra] = useState(false);
  const [extraSaveSuccess, setExtraSaveSuccess] = useState(false);

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

      try {
        const res = await api.get("/admin/referral/settings");
        if (res.data.success) {
          setReferralEnabled(res.data.enabled);
          setReferralDiscount(res.data.discountPercentage);
          setReferralCoinReward(res.data.coinReward);

          setScratchEnabled(res.data.referral_scratch_rewards_enabled ?? true);
          setTravelCoinsEnabled(res.data.referral_travel_coins_enabled ?? true);
          setCouponExpiryEnabled(res.data.referral_coupon_expiry_enabled ?? true);
          setMinReward(res.data.referral_min_reward ?? 5);
          setMaxReward(res.data.referral_max_reward ?? 30);
          setProbBronze(res.data.referral_prob_bronze ?? 50);
          setProbSilver(res.data.referral_prob_silver ?? 25);
          setProbGold(res.data.referral_prob_gold ?? 15);
          setProbDiamond(res.data.referral_prob_diamond ?? 10);
        }
      } catch (err) {
        console.warn("Failed to fetch referral settings", err);
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

  const handleSaveReferralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReferral(true);
    setReferralSaveSuccess(false);

    try {
      const res = await api.patch("/admin/referral/settings", {
        enabled: referralEnabled,
        discountPercentage: referralDiscount,
        coinReward: referralCoinReward,
        referral_scratch_rewards_enabled: scratchEnabled,
        referral_travel_coins_enabled: travelCoinsEnabled,
        referral_coupon_expiry_enabled: couponExpiryEnabled,
        referral_min_reward: minReward,
        referral_max_reward: maxReward,
        referral_prob_bronze: probBronze,
        referral_prob_silver: probSilver,
        referral_prob_gold: probGold,
        referral_prob_diamond: probDiamond,
      });
      if (res.data.success) {
        setReferralSaveSuccess(true);
        setTimeout(() => setReferralSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert("Failed to save referral settings");
    } finally {
      setSavingReferral(false);
    }
  };

  const handleSaveExtraSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExtra(true);
    setExtraSaveSuccess(false);

    try {
      localStorage.setItem("settings_qr_unlock", String(qrUnlockHours));
      localStorage.setItem("settings_support_email", supportEmail);
      localStorage.setItem("settings_upi_id", upiId);
      localStorage.setItem("settings_rzp_key", razorpayKey);
      localStorage.setItem("settings_rzp_secret", razorpaySecret);
      localStorage.setItem("settings_2fa_enabled", String(twoFactor));
      
      setExtraSaveSuccess(true);
      setTimeout(() => setExtraSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save credentials");
    } finally {
      setSavingExtra(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-page">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-poppins text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#14B8A6]" />
          <span>Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure platform settlements, payment gateway keys, support, and referral scratch rules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Marketplace Commission settings form */}
        <form onSubmit={handleSaveCommission} className="glass-panel p-6 rounded-[20px] bg-white border border-slate-200 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 font-poppins flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#14B8A6]" />
            <span>Marketplace Commission</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The commission is deducted from all bookings processed on Traveloop. Custom rates set on specific agents will override this base setting.
          </p>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
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
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#14B8A6] font-bold"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs font-bold font-mono">%</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#14B8A6] hover:bg-teal-650 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving Settings..." : "Save Commission Policy"}</span>
          </button>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs text-center rounded-xl font-bold animate-fade-in">
              Commission policy saved successfully!
            </div>
          )}
        </form>

        {/* Role Simulation controls */}
        <div className="glass-panel p-6 rounded-[20px] bg-white border border-slate-200 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 font-poppins flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#14B8A6]" />
            <span>Role Simulation (QA Test)</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Switch administrative roles on-the-fly to test menu access, routing privileges, and button constraints.
          </p>

          <div className="space-y-1.5 mt-2">
            {[
              { role: "Super Admin", desc: "Unrestricted master controls." },
              { role: "Finance Admin", desc: "General ledger auditing and payout triggers." },
              { role: "Support Admin", desc: "Read-only catalogs and agent directories." },
              { role: "Operations Admin", desc: "Trip verification and agent approvals." }
            ].map((item) => (
              <button
                key={item.role}
                onClick={() => handleRoleChange(item.role)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                  role === item.role
                    ? "bg-slate-50 border-[#14B8A6] text-[#14B8A6] shadow-xs"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="text-xs font-bold font-poppins">{item.role}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">{item.desc}</div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  role === item.role ? "border-[#14B8A6] bg-[#14B8A6]" : "border-slate-300"
                }`}>
                  {role === item.role && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gateway credentials, QR and Support configs */}
      <form onSubmit={handleSaveExtraSettings} className="glass-panel p-6 rounded-[20px] bg-white border border-slate-200 space-y-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 font-poppins flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#14B8A6]" />
          <span>Gateway & Support Configurations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* UPI ID */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">UPI Settlement ID</label>
            <input
              type="text"
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          {/* Support Email */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Support Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#14B8A6]"
              />
              <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* QR Unlock Hours */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">QR Unlock Buffer</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                required
                value={qrUnlockHours}
                onChange={(e) => setQrUnlockHours(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#14B8A6] font-bold"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs font-bold font-mono">Hours</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-4">
          {/* Razorpay Key */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Key className="w-3 h-3 text-slate-400" />
              <span>Razorpay Key ID</span>
            </label>
            <input
              type="text"
              required
              value={razorpayKey}
              onChange={(e) => setRazorpayKey(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#14B8A6] font-mono"
            />
          </div>

          {/* Razorpay Secret */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Key className="w-3 h-3 text-slate-400" />
              <span>Razorpay Secret Key</span>
            </label>
            <input
              type="password"
              required
              value={razorpaySecret}
              onChange={(e) => setRazorpaySecret(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#14B8A6] font-mono"
            />
          </div>
        </div>

        {/* 2FA Toggle switch */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#14B8A6]" />
              <span>Multi-Factor Authentication (2FA)</span>
            </h4>
            <p className="text-[10px] text-slate-405 font-semibold">Enforce email OTP validation checks on all administrative nodes.</p>
          </div>
          
          <button
            type="button"
            onClick={() => setTwoFactor(!twoFactor)}
            className={`w-12 h-6 rounded-full p-1 transition-all duration-200 focus:outline-none ${
              twoFactor ? "bg-[#14B8A6]" : "bg-slate-200"
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
              twoFactor ? "translate-x-6" : "translate-x-0"
            }`}></div>
          </button>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={savingExtra}
            className="py-2.5 px-6 bg-[#14B8A6] hover:bg-teal-650 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{savingExtra ? "Saving..." : "Save Gateways & Keys"}</span>
          </button>

          {extraSaveSuccess && (
            <span className="text-emerald-600 text-xs font-bold animate-fade-in">
              Credentials and gateways saved successfully!
            </span>
          )}
        </div>
      </form>

      {/* Referral & Rewards Configuration Form */}
      <form onSubmit={handleSaveReferralSettings} className="glass-panel p-6 rounded-[20px] bg-white border border-slate-200 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 font-poppins flex items-center gap-2">
          <Gift className="w-4 h-4 text-[#14B8A6]" />
          <span>Referral & Rewards Policy</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Configure the traveler invite program. Turn referral linking on/off, set traveler discount percentages, and configure the reward coins paid to inviters.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Enabled Toggle */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Referral Program Status
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReferralEnabled(true)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  referralEnabled
                    ? "bg-[#14B8A6] text-white border-[#14B8A6]"
                    : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                }`}
              >
                Enabled
              </button>
              <button
                type="button"
                onClick={() => setReferralEnabled(false)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  !referralEnabled
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                }`}
              >
                Disabled
              </button>
            </div>
          </div>

          {/* Discount Percentage */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Discount for Invitee (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={30}
                required
                value={referralDiscount}
                onChange={(e) => setReferralDiscount(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:border-[#14B8A6] font-bold"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs font-bold font-mono">%</div>
            </div>
          </div>

          {/* Coin Reward */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Coins Reward for Inviter
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                required
                value={referralCoinReward}
                onChange={(e) => setReferralCoinReward(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:border-[#14B8A6] font-bold"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs font-bold font-mono">Coins</div>
            </div>
          </div>
        </div>

        {/* Scratch Cards & Gamification Config */}
        <div className="border-t border-slate-100 pt-4 space-y-4">
          <h4 className="text-[10px] font-bold text-[#14B8A6] font-poppins uppercase tracking-wider">Scratch Cards & Rewards Config</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Scratch Enabled Toggle */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Scratch Cards Rewards
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScratchEnabled(true)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    scratchEnabled
                      ? "bg-[#14B8A6] text-white border-[#14B8A6]"
                      : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                  }`}
                >
                  Enabled
                </button>
                <button
                  type="button"
                  onClick={() => setScratchEnabled(false)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    !scratchEnabled
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                  }`}
                >
                  Disabled
                </button>
              </div>
            </div>

            {/* Travel Coins Toggle */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Reward Travel Coins
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTravelCoinsEnabled(true)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    travelCoinsEnabled
                      ? "bg-[#14B8A6] text-white border-[#14B8A6]"
                      : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                  }`}
                >
                  Enabled
                </button>
                <button
                  type="button"
                  onClick={() => setTravelCoinsEnabled(false)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    !travelCoinsEnabled
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                  }`}
                >
                  Disabled
                </button>
              </div>
            </div>

            {/* Coupon Expiry Toggle */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Coupon Expiry (30 days)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCouponExpiryEnabled(true)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    couponExpiryEnabled
                      ? "bg-[#14B8A6] text-white border-[#14B8A6]"
                      : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                  }`}
                >
                  Enabled
                </button>
                <button
                  type="button"
                  onClick={() => setCouponExpiryEnabled(false)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    !couponExpiryEnabled
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                  }`}
                >
                  Disabled
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Min Reward value */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Minimum Reward Discount (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={minReward}
                onChange={(e) => setMinReward(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:border-[#14B8A6] font-bold"
              />
            </div>

            {/* Max Reward value */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Maximum Reward Discount (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={maxReward}
                onChange={(e) => setMaxReward(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:border-[#14B8A6] font-bold"
              />
            </div>
          </div>

          {/* Tier probability weights */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Scratch Card Category Weights (Must sum to 100%)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bronze (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={probBronze}
                  onChange={(e) => setProbBronze(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:border-[#14B8A6] font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Silver (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={probSilver}
                  onChange={(e) => setProbSilver(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:border-[#14B8A6] font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gold (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={probGold}
                  onChange={(e) => setProbGold(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:border-[#14B8A6] font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Diamond (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={probDiamond}
                  onChange={(e) => setProbDiamond(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:border-[#14B8A6] font-mono font-bold"
                />
              </div>
            </div>
            {(probBronze + probSilver + probGold + probDiamond) !== 100 && (
              <p className="text-xs text-rose-500 font-bold animate-pulse mt-1">
                ⚠️ Current total: {probBronze + probSilver + probGold + probDiamond}%. Sum must equal exactly 100%.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="submit"
            disabled={savingReferral}
            className="py-2.5 px-6 bg-[#14B8A6] hover:bg-teal-650 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{savingReferral ? "Saving Settings..." : "Save Referral Policy"}</span>
          </button>

          {referralSaveSuccess && (
            <span className="text-emerald-600 text-xs font-bold animate-fade-in">
              Referral policy saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
export default Settings;
