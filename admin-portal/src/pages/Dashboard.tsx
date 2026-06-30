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
        // Call seed route first to make sure there is mock data for presentation if DB is empty
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
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Securing environment & aggregating metrics...</p>
      </div>
    );
  }

  // Format currency helper
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
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-400"
    },
    {
      title: "Platform Revenue",
      value: fmt(stats.platformRevenue),
      desc: "Commission + Gateway Fees",
      icon: TrendingUp,
      color: "from-teal-500/20 to-cyan-500/10 text-teal-400"
    },
    {
      title: "Commission Earned",
      value: fmt(stats.commissionEarned),
      desc: "Default and custom rates",
      icon: DollarSign,
      color: "from-blue-500/20 to-indigo-500/10 text-blue-400"
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      desc: "Successful packages sold",
      icon: Briefcase,
      color: "from-purple-500/20 to-pink-500/10 text-purple-400"
    },
    {
      title: "Active Agents",
      value: stats.totalAgents,
      desc: "Verified travel operators",
      icon: Users,
      color: "from-cyan-500/20 to-blue-500/10 text-cyan-400"
    },
    {
      title: "Total Drivers",
      value: stats.totalDrivers,
      desc: "Assigned vehicle pilots",
      icon: Car,
      color: "from-amber-500/20 to-orange-500/10 text-amber-400"
    },
    {
      title: "Active Trips",
      value: stats.activeTrips,
      desc: "Trips in progress or open",
      icon: Compass,
      color: "from-teal-500/20 to-emerald-500/10 text-teal-400"
    },
    {
      title: "Cancelled Trips",
      value: stats.cancelledTrips,
      desc: "Discontinued agent packages",
      icon: AlertTriangle,
      color: "from-rose-500/20 to-pink-500/10 text-rose-400"
    },
    {
      title: "Pending Refunds",
      value: stats.pendingRefunds,
      desc: fmt(stats.pendingRefundsAmount) + " in process",
      icon: FolderSync,
      color: "from-orange-500/20 to-rose-500/10 text-orange-400"
    }
  ];

  // Visual SVG chart coordinate computation
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
    // inverse y coordinate
    const y = chartHeight - 10 - ((val - chartMin) / (chartMax - chartMin || 1)) * (chartHeight - 30);
    return `${x},${y}`;
  }).join(" ");

  const closedSvgPoints = `0,${chartHeight} ${svgPoints} ${chartWidth},${chartHeight}`;

  return (
    <div className="space-y-8 animate-page">
      
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-poppins text-white tracking-tight">Marketplace Command Centre</h2>
          <p className="text-slate-400 text-xs mt-1">Hello, {admin?.displayName}. Real-time Traveloop logistics monitoring.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Commission Analytics Filter:</span>
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {(["today", "thisMonth", "last30Days", "lastYear"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-md transition-all ${
                  timeframe === t ? "bg-teal-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
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
            <div key={c.title} className="glass-panel glass-panel-hover p-6 rounded-2xl transition-all duration-300 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${c.color} rounded-bl-full opacity-10 group-hover:scale-110 transition-transform duration-300`}></div>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{c.title}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.color} bg-opacity-20`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-2xl font-extrabold text-white font-mono tracking-tight">{c.value}</span>
                <p className="text-[10px] text-slate-400">{c.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Graph & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Sparkline Graph */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-md font-bold text-white font-poppins">Commission Trend</h3>
              <p className="text-[10px] text-slate-400">Platform earnings vector based on active bookings</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block uppercase tracking-wider">Estimated Yield</span>
              <span className="text-lg font-bold text-teal-400 font-mono">
                {analytics ? fmt(analytics[timeframe]) : "---"}
              </span>
            </div>
          </div>

          <div className="relative h-44 w-full mt-4 flex items-end">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14B8B5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#14B8B5" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="40" x2={chartWidth} y2="40" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="0" y1="90" x2={chartWidth} y2="90" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="0" y1="140" x2={chartWidth} y2="140" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />

              {/* Area */}
              <polygon points={closedSvgPoints} fill="url(#chartGradient)" />
              {/* Line */}
              <polyline points={svgPoints} fill="none" stroke="#14B8B5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Highlight Nodes */}
              {chartPoints.map((val, idx) => {
                const x = (idx / (chartPoints.length - 1)) * chartWidth;
                const y = chartHeight - 10 - ((val - chartMin) / (chartMax - chartMin || 1)) * (chartHeight - 30);
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#0F172A"
                    stroke="#14B8B5"
                    strokeWidth="2.5"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Action Panel / Simulation Info */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-md font-bold text-white font-poppins flex items-center gap-2">
              <BellRing className="w-5 h-5 text-teal-400" />
              <span>Logistics Summary</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Traveloop marketplace commission model ensures a default charge of <span className="text-teal-400 font-bold">10%</span> on all traveler bookings. Standard agent commission rates can be overridden individually in the Agent Management page.
            </p>

            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Commission Example</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Trip Base Price:</span>
                <span className="font-mono text-slate-200">₹4,500</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Commission Deducted (10%):</span>
                <span className="font-mono text-teal-400">-₹450</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-300 font-medium">Agent Settlement:</span>
                <span className="font-mono text-emerald-400 font-bold">₹4,050</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Security Node: 2FA ACTIVE</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
        </div>
      </div>

    </div>
  );
};
