import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import {
  TrendingUp,
  DollarSign,
  Users,
  Compass,
  Briefcase,
  AlertTriangle,
  FolderSync,
  Car,
  BellRing
} from "lucide-react";

interface Stats {
  totalRevenue: number;
  platformRevenue: number;
  commissionEarned: number;
  totalBookings: number;
  totalAgents: number;
  totalDrivers: number;
  activeTrips: number;
  cancelledTrips: number;
  pendingRefunds: number;
  pendingRefundsAmount: number;
}

export const Dashboard: React.FC = () => {
  const { admin } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<"today" | "thisMonth" | "last30Days" | "lastYear">("thisMonth");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        try {
          await api.post("/admin/seed");
        } catch (seedErr) {
          // ignore
        }

        const [statsRes, analyticsRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/commission")
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
        if (analyticsRes.data.success) {
          setAnalytics(analyticsRes.data.analytics);
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-3 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Aggregating metrics...</p>
      </div>
    );
  }

  const fmt = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const cards = [
    {
      title: "Total Gross Revenue",
      value: fmt(stats.totalRevenue),
      desc: "Gross bookings processed",
      icon: DollarSign,
      color: "from-emerald-500/10 to-teal-500/5 text-emerald-600 bg-emerald-50"
    },
    {
      title: "Platform Revenue",
      value: fmt(stats.platformRevenue),
      desc: "Commission + Gateway Fees",
      icon: TrendingUp,
      color: "from-teal-500/10 to-cyan-500/5 text-teal-600 bg-teal-50"
    },
    {
      title: "Commission Earned",
      value: fmt(stats.commissionEarned),
      desc: "Default and custom rates",
      icon: DollarSign,
      color: "from-blue-500/10 to-indigo-500/5 text-blue-600 bg-blue-50"
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      desc: "Successful packages sold",
      icon: Briefcase,
      color: "from-purple-500/10 to-pink-500/5 text-purple-600 bg-purple-50"
    },
    {
      title: "Active Agents",
      value: stats.totalAgents,
      desc: "Verified travel operators",
      icon: Users,
      color: "from-cyan-500/10 to-blue-500/5 text-cyan-600 bg-cyan-50"
    },
    {
      title: "Total Drivers",
      value: stats.totalDrivers,
      desc: "Assigned vehicle pilots",
      icon: Car,
      color: "from-amber-500/10 to-orange-500/5 text-amber-600 bg-amber-50"
    },
    {
      title: "Active Trips",
      value: stats.activeTrips,
      desc: "Trips in progress or open",
      icon: Compass,
      color: "from-teal-500/10 to-emerald-500/5 text-teal-600 bg-teal-50"
    },
    {
      title: "Cancelled Trips",
      value: stats.cancelledTrips,
      desc: "Discontinued agent packages",
      icon: AlertTriangle,
      color: "from-rose-500/10 to-pink-500/5 text-rose-600 bg-rose-50"
    },
    {
      title: "Pending Refunds",
      value: stats.pendingRefunds,
      desc: fmt(stats.pendingRefundsAmount) + " in process",
      icon: FolderSync,
      color: "from-orange-500/10 to-rose-500/5 text-orange-600 bg-orange-50"
    }
  ];

  const chartPoints = timeframe === "today" 
    ? [20, 45, 30, 80, 60, 95]
    : timeframe === "thisMonth"
    ? [30, 40, 25, 60, 75, 90, 85, 110]
    : timeframe === "last30Days"
    ? [10, 30, 45, 35, 70, 65, 85, 120]
    : [5, 15, 35, 60, 50, 85, 95, 130];

  const chartMax = Math.max(...chartPoints);
  const chartMin = Math.min(...chartPoints);
  const chartWidth = 500;
  const chartHeight = 160;
  
  const svgPoints = chartPoints.map((val, idx) => {
    const x = (idx / (chartPoints.length - 1)) * chartWidth;
    const y = chartHeight - 10 - ((val - chartMin) / (chartMax - chartMin || 1)) * (chartHeight - 30);
    return `${x},${y}`;
  }).join(" ");

  const closedSvgPoints = `0,${chartHeight} ${svgPoints} ${chartWidth},${chartHeight}`;

  return (
    <div className="space-y-6 animate-page">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-slate-800 tracking-tight">SaaS Marketplace Command Centre</h2>
          <p className="text-slate-400 text-xs mt-0.5">Welcome back, {admin?.displayName}. Real-time business logistics monitoring.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Timeframe:</span>
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-0.5 shadow-xs">
            {(["today", "thisMonth", "last30Days", "lastYear"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`text-[10px] uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-lg transition-all ${
                  timeframe === t ? "bg-white text-[#14B8A6] shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.replace("this", "This ").replace("last", "Last ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="glass-panel glass-panel-hover p-5 rounded-[20px] transition-all duration-300 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.title}</span>
                <div className={`p-2.5 rounded-xl ${c.color.replace("text-", "bg-opacity-10 text-")}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-xl font-black text-slate-805 tracking-tight">{c.value}</span>
                <p className="text-[10px] text-slate-400 font-semibold">{c.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Graph & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Sparkline Graph */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-[20px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-poppins">Commission Yield Trend</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Earnings graph derived from active package bookings</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Estimated Yield</span>
              <span className="text-base font-black text-[#14B8A6] font-mono">
                {analytics ? fmt(analytics[timeframe]) : "---"}
              </span>
            </div>
          </div>

          <div className="relative h-40 w-full mt-4 flex items-end">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="40" x2={chartWidth} y2="40" stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1.5" />
              <line x1="0" y1="90" x2={chartWidth} y2="90" stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1.5" />
              <line x1="0" y1="140" x2={chartWidth} y2="140" stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1.5" />

              {/* Area */}
              <polygon points={closedSvgPoints} fill="url(#chartGradient)" />
              {/* Line */}
              <polyline points={svgPoints} fill="none" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Highlight Nodes */}
              {chartPoints.map((val, idx) => {
                const x = (idx / (chartPoints.length - 1)) * chartWidth;
                const y = chartHeight - 10 - ((val - chartMin) / (chartMax - chartMin || 1)) * (chartHeight - 30);
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill="#FFFFFF"
                    stroke="#14B8A6"
                    strokeWidth="2"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-panel p-6 rounded-[20px] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 font-poppins flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#14B8A6]" />
              <span>Logistics Summary</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Traveloop marketplace commission model automatically applies a default charge of <span className="text-[#14B8A6] font-extrabold">10%</span> on bookings. Standard rates can be customized in Settings.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold block">Commission Calculation Example</span>
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Trip Base Price:</span>
                <span className="font-mono text-slate-700">₹4,500</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2 font-medium">
                <span className="text-slate-400">Commission Deducted (10%):</span>
                <span className="font-mono text-[#14B8A6]">-₹450</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-650 font-bold">Agent Settlement:</span>
                <span className="font-mono text-emerald-600 font-black">₹4,050</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Security: 2FA Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
