import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  Users,
  IndianRupee,
  CalendarDays,
  FileCheck,
  TrendingUp,
  Percent,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Lock,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { GlassCard, Button, Modal } from "../components/ui";
import { BookingGraph, GenderDistributionChart } from "../components/charts";
import { getAnalytics } from "../services/analyticsService";
import { getAgentMetrics, getAgentSlots, applyAgentReferral, getAgentReferralSettings, createSlotOrder, verifySlotPurchase } from "../services/tripService";
import { formatCurrency, formatDate } from "../utils";
import { useAuthStore } from "../store/authStore";
import { OnboardingWizard } from "../features/auth/components/OnboardingWizard";

export const Dashboard: React.FC = () => {
  const { agent } = useAuthStore();
  const navigate = useNavigate();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const kycStatus = agent?.kycStatus || "PENDING";
  const isKycIncomplete = kycStatus !== "KYC_COMPLETED" && kycStatus !== "APPROVED";

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    enabled: !isKycIncomplete, // Disable query fetching if KYC is not completed
    refetchInterval: 10000,
  });

  const { data: agentMetricsData } = useQuery({
    queryKey: ["agent-metrics"],
    queryFn: getAgentMetrics,
    enabled: !isKycIncomplete,
    refetchInterval: 10000,
  });

  const { data: slotData, refetch: refetchSlots } = useQuery({
    queryKey: ["agent-slots"],
    queryFn: getAgentSlots,
    enabled: !isKycIncomplete,
    refetchInterval: 10000,
  });

  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<{ slots: number; amount: number } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"razorpay" | "upi" | "wallet">("razorpay");
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const { data: slotSettingsData } = useQuery({
    queryKey: ["agent-slot-settings"],
    queryFn: getAgentReferralSettings,
    enabled: !isKycIncomplete,
  });

  if (!agent) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // LOCKED DASHBOARD STATE (kycStatus incomplete)
  // ─────────────────────────────────────────────────────────────────────────
  if (isKycIncomplete) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Banner */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse text-amber-500" />
          <span>Complete your agency profile to start creating trips.</span>
        </div>

        {/* Welcome Heading */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mt-1">
            Activate your workspace by completing your agent profile.
          </p>
        </div>

        {/* Dashboard Widgets (Locked State Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Profile Completion Card */}
          <GlassCard className="flex flex-col justify-between p-6 h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-all duration-300" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 dark:bg-rose-950/25 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Incomplete
                </span>
                <span className="text-xs font-bold text-slate-400">Step 1 of 2</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-150">
                Profile Onboarding
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed font-semibold">
                Submit your agency legal details, tax identification numbers (GSTIN), operations contacts, and branding logo files to activate group trips hosting.
              </p>
            </div>
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button onClick={() => navigate("/complete-profile")} className="w-full flex items-center justify-center gap-2">
                <FileCheck className="w-4 h-4" /> Complete Profile
              </Button>
            </div>
          </GlassCard>

          {/* 2. Verification Pending Card */}
          <GlassCard className="flex flex-col justify-between p-6 h-full">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Verification Status
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-150">
                Agency Verification
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed font-semibold">
                Your verification remains locked. Once your profile details are fully submitted, your registration credentials will be queued for review.
              </p>
            </div>
            <div className="mt-8 text-xs font-bold text-slate-450 dark:text-slate-500 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
              Awaiting profile details submission
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 3. Trips Locked Card */}
          <GlassCard className="p-6 relative group overflow-hidden border border-slate-100 dark:border-slate-850 opacity-80">
            <div className="absolute top-4 right-4 text-slate-300 dark:text-slate-750">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex gap-4">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0 self-start">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Trips Manager
                </span>
                <h3 className="text-base font-extrabold text-slate-400 dark:text-slate-600 mt-1">
                  Group Routes Locked
                </h3>
                <p className="text-[11px] text-slate-350 dark:text-slate-600 mt-2 leading-relaxed font-semibold">
                  Trips creation, day itineraries, bus fleet details, driver credentials, and passenger manifests are locked until onboarding is completed.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* 4. Bookings Locked Card */}
          <GlassCard className="p-6 relative group overflow-hidden border border-slate-100 dark:border-slate-850 opacity-80">
            <div className="absolute top-4 right-4 text-slate-300 dark:text-slate-750">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex gap-4">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0 self-start">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Travelers Bookings
                </span>
                <h3 className="text-base font-extrabold text-slate-400 dark:text-slate-600 mt-1">
                  Reservations Logger Locked
                </h3>
                <p className="text-[11px] text-slate-350 dark:text-slate-600 mt-2 leading-relaxed font-semibold">
                  Roster ledger tracking, ticket verification reviews, seat re-allocations, and approval controls are locked until onboarding is completed.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Onboarding Wizard Modal */}
        <Modal
          isOpen={onboardingOpen}
          onClose={() => setOnboardingOpen(false)}
          title="Agency Profile Onboarding"
        >
          <OnboardingWizard modalMode />
        </Modal>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UNLOCKED DASHBOARD STATE (profileCompleted = true)
  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading your workspace...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
        <ShieldAlert className="w-6 h-6 text-rose-500" />
        <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
          Failed to fetch dashboard metrics. Please reload the page or check your backend connection.
        </span>
      </div>
    );
  }

  const { metrics, recentActivities, bookingsGraph, popularDestinations, liveBoarding } = data as any;

  const m = agentMetricsData?.metrics || {
    publishedTrips: 0,
    draftTrips: 0,
    cancelledTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    occupancy: 0,
    revenue: 0,
  };

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(agentMetricsData ? m.revenue : metrics.revenue),
      sub: `Draft: ${m.draftTrips} | Cancelled: ${m.cancelledTrips}`,
      icon: IndianRupee,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/25",
    },
    {
      label: "Occupancy Rate",
      value: `${agentMetricsData ? m.occupancy : (metrics.occupancyRate || 0)}%`,
      sub: `Based on filled seats`,
      icon: Users,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Published Trips",
      value: agentMetricsData ? m.publishedTrips : metrics.totalTrips,
      sub: `Total hosting trips`,
      icon: Compass,
      color: "text-sky-500 bg-sky-50 dark:bg-sky-950/25",
    },
    {
      label: "Upcoming & Completed",
      value: `${m.upcomingTrips} / ${m.completedTrips}`,
      sub: "Trip status metrics",
      icon: Clock,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/25",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {data?.isDemo && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse text-amber-500" />
          <span>Analytics unavailable. Backend not configured. Using demo values.</span>
        </div>
      )}
      {/* Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mt-1">
            Real-time insights on departures, travelers, and reservation approvals.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <GlassCard key={i} className="flex items-center gap-4 hover:translate-y-[-2px] transition-all">
              <div className={`p-3.5 rounded-xl ${c.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  {c.label}
                </span>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                  {c.value}
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                  {c.sub}
                </span>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Trip Slots & Referrals Section */}
      {slotData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trip Slots Progress Card */}
          <GlassCard className="lg:col-span-2 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-poppins">Trip Slots Allocation</span>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-poppins">
                    {slotData.usedSlots} / {slotData.tripSlots} Slots Consumed
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  {slotSettingsData?.settings?.slotPurchaseEnabled !== false && (
                    <button
                      onClick={() => setBuyModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg uppercase tracking-wider transition-all font-mono shadow-sm"
                    >
                      Buy Slots
                    </button>
                  )}
                  <span className="text-[10px] font-extrabold text-[#14B8A6] bg-teal-50 dark:bg-teal-950/25 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
                    {slotData.remainingSlots !== undefined ? slotData.remainingSlots : Math.max(0, slotData.tripSlots - slotData.usedSlots)} Remaining
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="w-full bg-slate-100 dark:bg-slate-855 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-[#14B8A6] h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${Math.min(100, (slotData.usedSlots / slotData.tripSlots) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-405 dark:text-slate-500 font-bold font-mono">
                  <span>0% Consumed</span>
                  <span>100% Full</span>
                </div>
              </div>

              {/* Grid breakdown */}
              <div className="grid grid-cols-4 gap-2 pt-1 pb-1">
                <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40 text-center">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">Base</span>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-350 font-mono">{slotData.baseSlots ?? 2}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40 text-center">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">Bonus</span>
                  <span className="text-xs font-extrabold text-purple-500 dark:text-purple-400 font-mono">{slotData.bonusSlots ?? 0}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40 text-center">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">Purchased</span>
                  <span className="text-xs font-extrabold text-emerald-500 dark:text-emerald-400 font-mono">{slotData.purchasedSlots ?? 0}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40 text-center">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">Active</span>
                  <span className="text-xs font-extrabold text-amber-505 dark:text-amber-400 font-mono">{slotData.usedSlots ?? 0}</span>
                </div>
              </div>

              <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed font-semibold">
                Each active trip consumes one slot. Slots release automatically when a trip is completed or cancelled. Earn extra slots by inviting other agency partners.
              </p>
            </div>
            
            {slotData.usedSlots >= slotData.tripSlots && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                ⚠️ All trip slots consumed. Complete active trips or refer partners to unlock slots.
              </div>
            )}
          </GlassCard>

          {/* Referral & Invite Card */}
          <GlassCard className="p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-poppins">Invite Host Partners</span>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-poppins">
                  🎁 Earn Extra Slots
                </h3>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800 space-y-1">
                <span className="text-[9px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider block">Your Referral Code</span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-105 font-mono tracking-wider">{slotData.referralCode}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(slotData.referralCode);
                      alert("Referral code copied to clipboard!");
                    }}
                    className="px-2.5 py-1 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-850 font-bold text-[9px] rounded-lg uppercase tracking-wider hover:bg-opacity-90 transition-all font-mono"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Apply Referral Code */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Enter Invite Code</span>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const code = (e.target as any).elements.inviteCode.value;
                  if (!code) return;
                  try {
                    const res = await applyAgentReferral(code);
                    if (res.success) {
                      alert(res.message);
                      refetchSlots();
                      (e.target as any).reset();
                    } else {
                      alert(res.message);
                    }
                  } catch (err: any) {
                    alert(err.response?.data?.message || "Failed to apply referral code");
                  }
                }} className="flex gap-2">
                  <input 
                    type="text" 
                    name="inviteCode"
                    placeholder="e.g. AGT-XYZ-1234"
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-[#14B8A6] font-mono"
                  />
                  <button 
                    type="submit"
                    className="px-3 py-1.5 bg-[#14B8A6] text-white font-bold text-[9px] rounded-xl uppercase tracking-wider hover:opacity-90 transition-all font-mono"
                  >
                    Apply
                  </button>
                </form>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800 pt-3">
                <span>Successful Referrals:</span>
                <span className="font-extrabold text-slate-755 dark:text-slate-300 font-mono">{slotData.referralCount} Partners</span>
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "Join TravelLoop Host Network",
                    text: `Hey! Host amazing group trips with TravelLoop. Use my agent referral code: ${slotData.referralCode} to get started!`,
                    url: window.location.origin
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(`Join TravelLoop Host Network. Use referral code: ${slotData.referralCode}`);
                  alert("Invite link copied to clipboard!");
                }
              }}
              className="mt-4 w-full py-2.5 bg-[#14B8A6] hover:bg-teal-650 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs font-poppins"
            >
              Share Invite Code
            </button>
          </GlassCard>
        </div>
      )}

      {/* Live Boarding Status Widget */}
      {liveBoarding && liveBoarding.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Boarding Status (Today's Departures)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveBoarding.map((tb: any) => (
              <GlassCard key={tb.tripId} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-extrabold text-slate-850 dark:text-slate-150 text-sm leading-tight truncate max-w-[80%]">
                      {tb.title}
                    </h4>
                    <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/20 px-2 py-0.5 rounded uppercase">
                      {tb.busNumber || "Bus"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 my-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl text-center">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Booked</p>
                      <p className="text-lg font-extrabold text-slate-850 dark:text-slate-100">{tb.total}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl text-center">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Boarded</p>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{tb.boarded}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl text-center">
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Pending</p>
                      <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{tb.pending}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1.5">
                    <span>Occupancy Rate</span>
                    <span className="text-teal-500">{tb.occupancyPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${tb.occupancyPct}%` }}
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Graph Card */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Booking Graph</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Monthly seat reservation trajectory</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              Growth Track
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <BookingGraph data={bookingsGraph} />
          </div>
        </GlassCard>

        {/* Gender Distribution Chart */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Gender Demographics</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Traveler gender balance metrics</p>
          </div>
          <div className="my-6">
            <GenderDistributionChart
              male={metrics.maleCount}
              female={metrics.femaleCount}
              other={metrics.otherCount}
            />
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
            <span>Occupancy Rate</span>
            <span className="text-primary dark:text-primary-light flex items-center gap-0.5">
              <Percent className="w-3 h-3" /> {metrics.occupancyRate}%
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Activities & Destinations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <GlassCard className="lg:col-span-2">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-6">Recent Bookings Log</h3>
          {recentActivities.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-xs">No activity log found. New bookings will appear here.</div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all">
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      act.type === "paid"
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20"
                        : act.type === "pending"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-950/20"
                        : "bg-rose-100 text-rose-600 dark:bg-rose-950/20"
                    }`}>
                      {act.travelerName[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {act.travelerName}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">
                        {act.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                    {formatDate(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Popular Destinations */}
        <GlassCard>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-6">Popular Destinations</h3>
          {popularDestinations.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-xs">No destinations mapped. Create a trip to initialize.</div>
          ) : (
            <div className="space-y-4">
              {popularDestinations.map((dest, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{dest.destination}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{dest.count} Tour(s)</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── BUY SLOTS MODAL ── */}
      {buyModalOpen && (
        <Modal
          isOpen={buyModalOpen}
          onClose={() => setBuyModalOpen(false)}
          title="Upgrade Trip Slots Capacity"
        >
          <div className="space-y-6">
            <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed font-semibold">
              Host more group trips simultaneously by purchasing additional slots. Your purchased capacity is permanently credited to your operator account.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  slots: 1,
                  title: "Single Slot",
                  amount: slotSettingsData?.settings?.slotPrice || 1000,
                  badge: "Standard",
                },
                {
                  slots: 3,
                  title: "3 Slots Bundle",
                  amount: Math.floor((slotSettingsData?.settings?.slotPrice || 1000) * 2.5),
                  badge: "Save 16%",
                },
                {
                  slots: 5,
                  title: "5 Slots Premium",
                  amount: Math.floor((slotSettingsData?.settings?.slotPrice || 1000) * 4),
                  badge: "Save 20%",
                },
              ].map((tier) => (
                <button
                  key={tier.slots}
                  onClick={() => setSelectedTier(tier)}
                  type="button"
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedTier?.slots === tier.slots
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/20"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">{tier.badge}</span>
                    {selectedTier?.slots === tier.slots && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-805 dark:text-slate-100">{tier.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">+{tier.slots} Slots</p>
                  <div className="text-md font-black text-slate-800 dark:text-slate-205 font-mono mt-3">
                    {formatCurrency(tier.amount)}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setBuyModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedTier}
                onClick={() => {
                  if (!selectedTier) return;
                  setBuyModalOpen(false);
                  setCheckoutModalOpen(true);
                }}
                className="flex-1"
              >
                Proceed to Pay
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── SECURE CHECKOUT SIMULATION OVERLAY ── */}
      {checkoutModalOpen && selectedTier && (
        <Modal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          title="Traveloop Secure Checkout"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-450">Recipient</span>
                <span className="text-slate-800 dark:text-slate-200">Traveloop B2B Marketplace</span>
              </div>
              <div className="flex justify-between text-xs font-semibold border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-slate-405">Description</span>
                <span className="text-slate-800 dark:text-slate-200">Purchase of {selectedTier.slots} Trip Slots</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-xs font-semibold text-slate-450">Amount Payable</span>
                <span className="text-lg font-black text-emerald-500 font-mono">{formatCurrency(selectedTier.amount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Choose Payment Method</span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "razorpay" as const, name: "Razorpay Card" },
                  { id: "upi" as const, name: "UPI / QR" },
                  { id: "wallet" as const, name: "Agent Wallet" },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    type="button"
                    className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                      selectedMethod === method.id
                        ? "bg-[#14B8A6]/10 border-[#14B8A6] text-[#14B8A6]"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={async () => {
                  setPurchaseLoading(true);
                  try {
                    const orderRes = await createSlotOrder(selectedTier.slots);
                    if (orderRes.success) {
                      const verifyRes = await verifySlotPurchase({
                        razorpay_order_id: orderRes.orderId,
                        razorpay_payment_id: `pay_simulated_${Math.floor(100000 + Math.random() * 900000)}`,
                        razorpay_signature: "simulated_signature",
                        slotsCount: selectedTier.slots,
                        amount: selectedTier.amount
                      });
                      if (verifyRes.success) {
                        alert(`Payment Successful! +${selectedTier.slots} Trip Slots added to your profile.`);
                        refetchSlots();
                        setCheckoutModalOpen(false);
                      }
                    }
                  } catch (err: any) {
                    alert(err.response?.data?.message || "Slot purchase transaction failed.");
                  } finally {
                    setPurchaseLoading(false);
                  }
                }}
                disabled={purchaseLoading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                {purchaseLoading ? "Processing secure payment..." : `Simulate ${selectedMethod.toUpperCase()} Success`}
              </button>
              <button
                onClick={() => {
                  alert("Simulated: Checkout failed / user cancelled.");
                  setCheckoutModalOpen(false);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel / Decline Transaction
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
