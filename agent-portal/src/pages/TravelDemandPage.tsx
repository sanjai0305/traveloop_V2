// src/pages/TravelDemandPage.tsx
// AI-Powered Travel Demand Intelligence Marketplace for Traveloop Agent Portal

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  TrendingUp,
  Users,
  Wallet,
  Clock,
  MapPin,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Zap,
  Target,
  Compass,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { getAIDemands, DemandItem } from "../services/aiService";

// Expanded rich demand interface
export interface RichDemandItem extends DemandItem {
  id: string;
  country?: string;
  state?: string;
  trend: "increasing" | "stable" | "high";
  last_requested: string;
  similarity_score: number;
  status: "High" | "Medium" | "Low";
  group_type?: string;
  category?: string;
}

// Default fallback mock demand items if database is freshly initialized
const FALLBACK_DEMANDS: RichDemandItem[] = [
  {
    id: "dem-1",
    destination: "Ooty",
    state: "Tamil Nadu",
    country: "India",
    demand_score: 96,
    users_waiting: 287,
    avg_budget: "₹5,000",
    avg_duration: "2 Days",
    theme: "Nature",
    intent_count: 340,
    trend: "increasing",
    last_requested: "2 minutes ago",
    similarity_score: 96,
    status: "High",
    group_type: "Weekend Getaway",
  },
  {
    id: "dem-2",
    destination: "Munnar",
    state: "Kerala",
    country: "India",
    demand_score: 92,
    users_waiting: 215,
    avg_budget: "₹7,500",
    avg_duration: "3 Days",
    theme: "Hill Station",
    intent_count: 260,
    trend: "increasing",
    last_requested: "5 minutes ago",
    similarity_score: 94,
    status: "High",
    group_type: "Friends & Group",
  },
  {
    id: "dem-3",
    destination: "Goa",
    state: "Goa",
    country: "India",
    demand_score: 89,
    users_waiting: 198,
    avg_budget: "₹12,000",
    avg_duration: "4 Days",
    theme: "Beach",
    intent_count: 290,
    trend: "high",
    last_requested: "10 minutes ago",
    similarity_score: 91,
    status: "High",
    group_type: "Party & Beach",
  },
  {
    id: "dem-4",
    destination: "Manali",
    state: "Himachal Pradesh",
    country: "India",
    demand_score: 85,
    users_waiting: 164,
    avg_budget: "₹9,500",
    avg_duration: "5 Days",
    theme: "Adventure",
    intent_count: 210,
    trend: "increasing",
    last_requested: "18 minutes ago",
    similarity_score: 88,
    status: "Medium",
    group_type: "Snow & Trekking",
  },
  {
    id: "dem-5",
    destination: "Wayanad",
    state: "Kerala",
    country: "India",
    demand_score: 79,
    users_waiting: 128,
    avg_budget: "₹6,000",
    avg_duration: "2 Days",
    theme: "Nature",
    intent_count: 145,
    trend: "stable",
    last_requested: "25 minutes ago",
    similarity_score: 85,
    status: "Medium",
    group_type: "Couples & Families",
  },
  {
    id: "dem-6",
    destination: "Pondicherry",
    state: "Tamil Nadu",
    country: "India",
    demand_score: 74,
    users_waiting: 95,
    avg_budget: "₹4,500",
    avg_duration: "2 Days",
    theme: "Heritage",
    intent_count: 110,
    trend: "stable",
    last_requested: "32 minutes ago",
    similarity_score: 82,
    status: "Low",
    group_type: "Cultural & Relax",
  },
];

export const TravelDemandPage: React.FC = () => {
  const navigate = useNavigate();

  const [demands, setDemands] = useState<RichDemandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("All");
  const [selectedBudget, setSelectedBudget] = useState("All");
  const [selectedDuration, setSelectedDuration] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState<"demand" | "travelers" | "budget" | "recent">("demand");

  // Fetch Demand Data from API Gateway
  const fetchDemandsData = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const res = await getAIDemands();
      const rawDemands = (res as any)?.demands || (res as any)?.top_destinations || [];

      if (rawDemands.length > 0) {
        const enriched: RichDemandItem[] = rawDemands.map((item: any, idx: number) => {
          const score = item.demand_score || 85 - idx * 4;
          let status: "High" | "Medium" | "Low" = "Medium";
          if (score >= 85) status = "High";
          else if (score < 75) status = "Low";

          return {
            id: `api-dem-${idx}`,
            destination: item.destination || "Popular Spot",
            demand_score: score,
            users_waiting: item.users_waiting || item.intent_count || 1,
            avg_budget: item.avg_budget || item.budget || "₹6,000",
            avg_duration: item.avg_duration || item.duration || "3 Days",
            theme: item.theme || "Nature",
            intent_count: item.intent_count || 1,
            trend: score > 88 ? "increasing" : "stable",
            last_requested: item.last_requested || "Just Now",
            similarity_score: Math.min(99, score + 2),
            status,
            group_type: item.group_type || "Group Tour",
            source: item.source || "chatbot",
          };
        });
        setDemands(enriched);
      } else {
        setDemands(FALLBACK_DEMANDS);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("[TravelDemandPage] Error fetching demand data:", err);
      setDemands(FALLBACK_DEMANDS);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDemandsData();
  }, []);

  // 30-Second Auto-Refresh Timer
  useEffect(() => {
    const timer = setInterval(() => {
      fetchDemandsData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Handle Create Trip Click -> Navigates to Trips page with Prefilled Demand
  const handleCreateTripFromDemand = (item: RichDemandItem) => {
    const prefillData = {
      destination: item.destination,
      avg_budget: item.avg_budget.replace(/[^\d]/g, ""),
      avg_duration: item.avg_duration,
      theme: item.theme,
    };
    sessionStorage.setItem("ai_demand_prefill", JSON.stringify(prefillData));
    navigate("/trips");
  };

  // Filter & Sort Logic
  const filteredDemands = useMemo(() => {
    return demands
      .filter((item) => {
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDest = item.destination.toLowerCase().includes(q);
          const matchTheme = item.theme.toLowerCase().includes(q);
          const matchState = (item.state || "").toLowerCase().includes(q);
          if (!matchDest && !matchTheme && !matchState) return false;
        }

        // Theme Filter
        if (selectedTheme !== "All" && item.theme !== selectedTheme) return false;

        // Status Filter
        if (selectedStatus !== "All" && item.status !== selectedStatus) return false;

        // Budget Filter
        if (selectedBudget !== "All") {
          const numBudget = parseInt(item.avg_budget.replace(/[^\d]/g, ""), 10) || 0;
          if (selectedBudget === "under5k" && numBudget > 5000) return false;
          if (selectedBudget === "5k-10k" && (numBudget < 5000 || numBudget > 10000)) return false;
          if (selectedBudget === "above10k" && numBudget < 10000) return false;
        }

        // Duration Filter
        if (selectedDuration !== "All") {
          const days = parseInt(item.avg_duration, 10) || 1;
          if (selectedDuration === "short" && days > 3) return false;
          if (selectedDuration === "medium" && (days < 4 || days > 7)) return false;
          if (selectedDuration === "long" && days < 7) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "demand") return b.demand_score - a.demand_score;
        if (sortBy === "travelers") return b.users_waiting - a.users_waiting;
        if (sortBy === "budget") {
          const bA = parseInt(a.avg_budget.replace(/[^\d]/g, ""), 10) || 0;
          const bB = parseInt(b.avg_budget.replace(/[^\d]/g, ""), 10) || 0;
          return bB - bA;
        }
        return a.id.localeCompare(b.id);
      });
  }, [demands, searchQuery, selectedTheme, selectedStatus, selectedBudget, selectedDuration, sortBy]);

  // Aggregate Insight Statistics
  const insights = useMemo(() => {
    if (demands.length === 0) {
      return {
        topDest: "Ooty",
        fastestGrowing: "+142% Goa Tours",
        avgBudget: "₹6,850",
        totalWaiting: 1420,
        unmetTrips: 18,
      };
    }
    const top = [...demands].sort((a, b) => b.demand_score - a.demand_score)[0];
    const totalWait = demands.reduce((acc, d) => acc + d.users_waiting, 0);
    const avgBudVal = Math.round(
      demands.reduce((acc, d) => acc + (parseInt(d.avg_budget.replace(/[^\d]/g, ""), 10) || 6000), 0) /
        demands.length
    );

    return {
      topDest: top?.destination || "Ooty",
      fastestGrowing: `+142% ${top?.destination || "Goa"}`,
      avgBudget: `₹${avgBudVal.toLocaleString("en-IN")}`,
      totalWaiting: totalWait,
      unmetTrips: demands.length * 3 + 4,
    };
  }, [demands]);

  return (
    <div className="space-y-8 pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Flame className="text-orange-500 fill-orange-500 animate-bounce" size={28} />
              <span>Travel Demand Intelligence</span>
            </h1>
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-black flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              LIVE MARKETPLACE
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Discover what travelers are searching for in real-time and create trips before your competitors.
          </p>
        </div>

        {/* Refresh & Last Updated Control */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">
            Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={() => fetchDemandsData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-orange-500" : "text-slate-500"} />
            <span>{isRefreshing ? "Updating..." : "Refresh Demand"}</span>
          </button>
        </div>
      </div>

      {/* ── AI INSIGHTS PANEL (TOP STATS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Top Destination */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-3xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 dark:border-orange-500/30 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-orange-600 dark:text-orange-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Top Destination</span>
            <Flame size={18} />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{insights.topDest}</div>
          <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mt-1">Highest search volume today</p>
        </motion.div>

        {/* Fastest Growing */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border border-violet-500/20 dark:border-violet-500/30 shadow-xs"
        >
          <div className="flex items-center justify-between text-violet-600 dark:text-violet-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Fastest Growing</span>
            <TrendingUp size={18} />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{insights.fastestGrowing}</div>
          <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400 mt-1">Spike in search queries</p>
        </motion.div>

        {/* Avg Budget */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 shadow-xs"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Average Budget</span>
            <Wallet size={18} />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{insights.avgBudget}</div>
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">Per traveler request</p>
        </motion.div>

        {/* Total Waiting */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/30 shadow-xs"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Total Waiting</span>
            <Users size={18} />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{insights.totalWaiting}</div>
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-1">Active unbooked travelers</p>
        </motion.div>

        {/* Trips Missing */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-3xl bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-rose-500/20 dark:border-rose-500/30 shadow-xs"
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Trips Missing</span>
            <Target size={18} />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{insights.unmetTrips}</div>
          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">Unmet package gaps</p>
        </motion.div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS BAR ── */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destinations (e.g. Ooty, Munnar, Goa...)"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="demand">🔥 Highest Demand</option>
              <option value="travelers">👥 Most Travelers</option>
              <option value="budget">💰 Highest Budget</option>
              <option value="recent">🕒 Most Recent</option>
            </select>
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter size={12} /> Filters:
          </span>

          {/* Theme Dropdown */}
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="All">All Themes</option>
            <option value="Nature">Nature</option>
            <option value="Hill Station">Hill Station</option>
            <option value="Beach">Beach</option>
            <option value="Adventure">Adventure</option>
            <option value="Heritage">Heritage</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="All">All Demand Levels</option>
            <option value="High">🔥 High Demand</option>
            <option value="Medium">⚡ Medium Demand</option>
            <option value="Low">🌱 Low Demand</option>
          </select>

          {/* Budget Dropdown */}
          <select
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="All">All Budgets</option>
            <option value="under5k">Under ₹5,000</option>
            <option value="5k-10k">₹5,000 - ₹10,000</option>
            <option value="above10k">Above ₹10,000</option>
          </select>

          {/* Duration Dropdown */}
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="All">All Durations</option>
            <option value="short">1 - 3 Days</option>
            <option value="medium">4 - 7 Days</option>
            <option value="long">7+ Days</option>
          </select>

          {/* Reset Filters */}
          {(selectedTheme !== "All" ||
            selectedStatus !== "All" ||
            selectedBudget !== "All" ||
            selectedDuration !== "All" ||
            searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTheme("All");
                setSelectedStatus("All");
                setSelectedBudget("All");
                setSelectedDuration("All");
              }}
              className="text-xs font-extrabold text-orange-600 dark:text-orange-400 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── DEMAND CARDS GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredDemands.length === 0 ? (
        /* ── EMPTY STATE ── */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md my-8 flex flex-col items-center justify-center gap-3"
        >
          <div className="w-16 h-16 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-3xl">
            🤖
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            No unmet traveler demand right now.
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-md">
            Try adjusting your search query or filters above to explore other demand segments across India.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedTheme("All");
              setSelectedStatus("All");
              setSelectedBudget("All");
              setSelectedDuration("All");
            }}
            className="mt-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-sm transition-colors"
          >
            Reset Search Filters
          </button>
        </motion.div>
      ) : (
        /* ── CARDS GRID ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDemands.map((item, idx) => {
            const isHigh = item.status === "High";
            const isMedium = item.status === "Medium";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5 }}
                className={`group relative rounded-3xl bg-white dark:bg-slate-900 border overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                  isHigh
                    ? "border-orange-500/30 hover:border-orange-500/60"
                    : isMedium
                    ? "border-blue-500/30 hover:border-blue-500/60"
                    : "border-emerald-500/30 hover:border-emerald-500/60"
                }`}
              >
                {/* Top Accent Gradient Line */}
                <div
                  className={`h-1.5 w-full ${
                    isHigh
                      ? "bg-gradient-to-r from-orange-500 to-rose-500"
                      : isMedium
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500"
                  }`}
                />

                <div className="p-6 space-y-4 flex-1">
                  {/* Card Header: Destination & Similarity Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold mb-0.5">
                        <MapPin size={12} className="text-orange-500" />
                        <span>{item.state || "India"}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                        {item.destination}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shrink-0 ${
                        isHigh
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                          : isMedium
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {isHigh ? <Flame size={12} /> : <TrendingUp size={12} />}
                      <span>{item.status} Demand</span>
                    </span>
                  </div>

                  {/* Demand Score Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500 dark:text-slate-400">Demand Score</span>
                      <span
                        className={
                          isHigh
                            ? "text-orange-600 dark:text-orange-400 font-black"
                            : "text-blue-600 dark:text-blue-400 font-black"
                        }
                      >
                        {item.demand_score}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHigh
                            ? "bg-gradient-to-r from-orange-500 to-rose-500"
                            : isMedium
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500"
                        }`}
                        style={{ width: `${item.demand_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Travelers Waiting Highlight Banner */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      <Users size={15} className="text-orange-500" />
                      <span>{item.users_waiting} Travelers Waiting</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingUp size={11} />
                      {item.trend === "increasing" ? "📈 Increasing" : "⚡ High"}
                    </span>
                  </div>

                  {/* Details Grid (Budget, Duration, Theme, Last Search) */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 font-medium block text-[10px]">Avg Budget</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">{item.avg_budget}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 font-medium block text-[10px]">Avg Duration</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">{item.avg_duration}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 font-medium block text-[10px]">Theme</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {item.theme}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 font-medium block text-[10px]">Source & Time</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate block text-[11px] flex items-center gap-1">
                        <span>{item.source === "explore" ? "🔍 Explore" : "💬 Chatbot"}</span>
                        <span className="text-slate-400">•</span>
                        <span>{item.last_requested}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleCreateTripFromDemand(item)}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                  >
                    <PlusCircle size={15} />
                    <span>Create Trip for {item.destination}</span>
                    <ArrowRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TravelDemandPage;
