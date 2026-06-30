import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  BarChart3,
  Percent,
  IndianRupee,
  MapPin,
  Users,
  Compass,
  Trophy,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { GlassCard } from "../components/ui";
import { BookingGraph } from "../components/charts";
import { getAnalytics } from "../services/analyticsService";
import { formatCurrency } from "../utils";

export const Analytics: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Compiling financial performance metrics...</span>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, bookingsGraph, popularDestinations, topAgents } = data;

  // Derive monthly growth rate (comparing last month with current month in graph)
  let growthPct = 12; // fallback
  if (bookingsGraph.length >= 2) {
    const prev = bookingsGraph[bookingsGraph.length - 2].Bookings || 1;
    const curr = bookingsGraph[bookingsGraph.length - 1].Bookings;
    growthPct = Math.round(((curr - prev) / prev) * 100);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Heading ── */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Business Analytics
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold mt-1">
          Review tour performance, customer demographic growth, and local agent leaderboards.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gross Revenue</span>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
              {formatCurrency(metrics.revenue)}
            </h3>
            <span className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +15.4% growth
            </span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-accent/10 text-accent">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Occupancy Rate</span>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
              {metrics.occupancyRate}%
            </h3>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5 block">
              Average seat fill rate
            </span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Monthly Growth</span>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
              {growthPct > 0 ? `+${growthPct}%` : `${growthPct}%`}
            </h3>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5 block">
              Monthly reservations delta
            </span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 text-sky-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Seats Sold</span>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
              {metrics.totalTravelers} Seats
            </h3>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5 block">
              Trips occupancy count
            </span>
          </div>
        </GlassCard>
      </div>

      {/* ── Charts Split layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Line Chart */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Revenue & Booking Progression</h3>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5">Performance over the past six months</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 px-3 py-1 rounded-lg text-[10px] font-extrabold text-slate-500 dark:text-slate-450">
              <Activity className="w-3.5 h-3.5 text-primary" /> Active tracking
            </div>
          </div>
          <div className="min-h-[220px] flex items-center justify-center">
            <BookingGraph data={bookingsGraph} />
          </div>
        </GlassCard>

        {/* Popular Destinations and metrics */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-6">Top Tour Routes</h3>
            {popularDestinations.length === 0 ? (
              <div className="text-center text-slate-400 py-10 text-xs">No tour routes published.</div>
            ) : (
              <div className="space-y-5">
                {popularDestinations.map((dest, i) => {
                  const maxCount = Math.max(...popularDestinations.map((d) => d.count), 1);
                  const barWidth = `${(dest.count / maxCount) * 100}%`;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {dest.destination}
                        </span>
                        <span className="text-primary dark:text-primary-light">{dest.count} Tours</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full gradient-brand rounded-full transition-all duration-500" style={{ width: barWidth }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>Market Demand</span>
            <span className="text-emerald-500 flex items-center gap-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> High volume
            </span>
          </div>
        </GlassCard>
      </div>

      {/* ── Top Agents Leaderboard ── */}
      <GlassCard className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent animate-bounce" />
              Regional Agent Leaderboard
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Comparing booking revenues among Traveloop's certified agencies.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {topAgents.map((ag, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                i === 0
                  ? "bg-primary/5 border-primary/20 dark:bg-primary/10"
                  : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
                  i === 0
                    ? "bg-accent text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}>
                  {i + 1}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{ag.name}</h4>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{ag.trips} group trips organized</span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-850 dark:text-slate-150">
                {formatCurrency(ag.revenue)}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
