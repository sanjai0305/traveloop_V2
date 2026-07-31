// src/pages/Dashboard.jsx — V1.6 Smart Explore, Trending, Home/Explore Sync

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import MainLayout from "../layouts/MainLayout";
import { getApiUrl } from "../utils/api";
import { socket } from "../utils/socket";
import WeatherChip from "../components/dashboard/WeatherChip";
import { useAuth } from "../context/AuthContext";
import TravelScoreCard from "../components/dashboard/TravelScoreCard";
import AIAssistantCard from "../components/dashboard/AIAssistantCard";
import ReferralCard from "../components/dashboard/ReferralCard";
import ScratchCardModal from "../components/dashboard/ScratchCardModal";
import AIAssistant from "../components/ai/AIAssistant";
import {
  Search, ChevronRight, Star, MapPin, TrendingUp,
  ArrowRight, Zap, Compass, Flame, Loader2, Sparkles
} from "lucide-react";

// ─── STATIC DESTINATIONS (fallback / "Recommended For You") ─────────────────
const STATIC_DESTINATIONS = [
  { id: 1, name: "Bali",       country: "Indonesia",    emoji: "🌴", rating: 4.9, tag: "Trending",  gradient: "linear-gradient(135deg,#667EEA,#764BA2)", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80" },
  { id: 2, name: "Santorini",  country: "Greece",       emoji: "🏛️", rating: 4.8, tag: "Romance",   gradient: "linear-gradient(135deg,#F093FB,#F5576C)", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80" },
  { id: 3, name: "Maldives",   country: "Maldives",     emoji: "🐚", rating: 4.9, tag: "Luxury",    gradient: "linear-gradient(135deg,#4FACFE,#00F2FE)", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=600&q=80" },
  { id: 4, name: "Tokyo",      country: "Japan",        emoji: "🌸", rating: 4.7, tag: "Culture",   gradient: "linear-gradient(135deg,#F77062,#FE5196)", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80" },
  { id: 5, name: "Swiss Alps", country: "Switzerland",  emoji: "🏔️", rating: 4.9, tag: "Adventure", gradient: "linear-gradient(135deg,#43E97B,#38F9D7)", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80" },
  { id: 6, name: "Goa",        country: "India",        emoji: "🏖️", rating: 4.6, tag: "Beach",     gradient: "linear-gradient(135deg,#FA709A,#FEE140)", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" },
];

// ─── FIX 5: Trending Destinations (static with dynamic fallback) ─────────────
const TRENDING_DESTINATIONS = [
  { name: "Bali",        emoji: "🌴", country: "Indonesia"   },
  { name: "Japan",       emoji: "🌸", country: "Asia"        },
  { name: "Thailand",    emoji: "🐘", country: "Southeast Asia" },
  { name: "Dubai",       emoji: "🏙️", country: "UAE"         },
  { name: "Switzerland", emoji: "🏔️", country: "Europe"      },
  { name: "Maldives",    emoji: "🐚", country: "Indian Ocean" },
  { name: "Paris",       emoji: "🗼", country: "France"      },
  { name: "Kyoto",       emoji: "⛩️", country: "Japan"       },
];

const ACTIVITIES = [
  { emoji: "🪂", label: "Paragliding" },
  { emoji: "🤿", label: "Snorkeling"  },
  { emoji: "🧗", label: "Trekking"    },
  { emoji: "🍜", label: "Food Tour"   },
  { emoji: "🎭", label: "Cultural"    },
  { emoji: "🚤", label: "Boat Tour"   },
  { emoji: "🏄", label: "Surfing"     },
];

const DEST_EMOJIS = { "Goa": "🏖️", "Bali": "🌴", "Paris": "🗼", "Tokyo": "🌸", "Maldives": "🐚", "Switzerland": "🏔️", "default": "✈️" };
const getEmoji = (dest = "") => {
  for (const key of Object.keys(DEST_EMOJIS)) {
    if (key !== "default" && dest.toLowerCase().includes(key.toLowerCase())) return DEST_EMOJIS[key];
  }
  return DEST_EMOJIS.default;
};

// Gradients for search-result cards
const RESULT_GRADIENTS = [
  "linear-gradient(135deg,#667EEA,#764BA2)",
  "linear-gradient(135deg,#F093FB,#F5576C)",
  "linear-gradient(135deg,#4FACFE,#00F2FE)",
  "linear-gradient(135deg,#F77062,#FE5196)",
  "linear-gradient(135deg,#43E97B,#38F9D7)",
];

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "nav.trips",   emoji: "✈️",  path: "/my-trips",    color: "#14B8B5", bg: "rgba(20,184,181,0.1)"  },
  { label: "nav.create",  emoji: "➕",  path: "/create-trip", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)"  },
  { label: "home.packing", emoji: "🧳",  path: "/my-trips",    color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
  { label: "home.notes",   emoji: "📝",  path: "/my-trips",    color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
];

const Dashboard = () => {
  const navigate     = useNavigate();
  const { t }        = useTranslation();
  const [trips, setTrips]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [aiOpen, setAiOpen]               = useState(false);
  const [search, setSearch]               = useState("");

  // FIX 3/4/9 — explore state
  const [exploreResults, setExploreResults] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreQuery, setExploreQuery]     = useState(""); // last successful query

  // 5-minute client-side cache: { key: { places, expiresAt } }
  const exploreCache = useRef({});
  const searchDebounce = useRef(null);
  const abortRef = useRef(null);

  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [unscratchedCard, setUnscratchedCard] = useState(null);
  const [showScratchModal, setShowScratchModal] = useState(false);

  const fetchReferralStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(getApiUrl("profile/referral-dashboard"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.scratchCards) {
        const cardToScratch = data.scratchCards.find(c => !c.scratched && !c.claimed);
        if (cardToScratch) {
          setUnscratchedCard(cardToScratch);
          setShowScratchModal(true);
        } else {
          setUnscratchedCard(null);
          setShowScratchModal(false);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch referral dashboard:", err);
    }
  };

  useEffect(() => {
    fetchReferralStats();
  }, []);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener("userUpdated", handleUserUpdate);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? t("home.greeting") : hour < 17 ? t("home.greeting_afternoon") : t("home.greeting_evening");
  const firstName = currentUser?.firstName || "Traveler";

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res   = await fetch(getApiUrl("trips"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setTrips(data.trips || []);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  useEffect(() => {
    const handleTripDeleted = (deletedId) => {
      console.log("[Dashboard] Live trip_deleted event:", deletedId);
      setTrips(prev => prev.filter(t => t._id !== deletedId));
      setExploreResults(prev => prev.filter(t => t._id !== deletedId));
    };

    socket.on("trip_deleted", handleTripDeleted);
    return () => {
      socket.off("trip_deleted", handleTripDeleted);
    };
  }, []);

  // ── FIX 3/9: Smart Explore — 500ms debounce + 5-min cache ────────────────
  const fetchNearby = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setExploreResults([]);
      setExploreQuery("");
      return;
    }

    const cacheKey = query.trim().toLowerCase();

    // Check client cache
    const cached = exploreCache.current[cacheKey];
    if (cached && cached.expiresAt > Date.now()) {
      setExploreResults(cached.places);
      setExploreQuery(query.trim());
      return;
    }

    // Cancel in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      console.log("Explore Search Start:", query);
      setExploreLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        getApiUrl(`explore/discover?query=${encodeURIComponent(query.trim())}`),
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      const data = await res.json();
      if (data.success && data.places?.length > 0) {
        console.log("Explore API Success");
        // Cache for 5 minutes
        exploreCache.current[cacheKey] = {
          places: data.places,
          expiresAt: Date.now() + 5 * 60 * 1000,
        };
        setExploreResults(data.places);
        setExploreQuery(query.trim());
      } else {
        console.log("Explore API Failed");
        setExploreResults([]);
        setExploreQuery("");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.log("Explore API Failed");
        setExploreResults([]);
        setExploreQuery("");
      }
    } finally {
      if (abortRef.current === controller) {
        setExploreLoading(false);
      }
    }
  }, []);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchDebounce.current);
    if (!val.trim()) {
      setExploreResults([]);
      setExploreQuery("");
      if (abortRef.current) abortRef.current.abort();
      return;
    }
    // 500ms debounce
    searchDebounce.current = setTimeout(() => {
      fetchNearby(val.trim());
    }, 500);
  };

  const recentTrips = trips.slice(0, 5);
  const upcoming    = trips.filter(t => t.status === "upcoming" || t.status === "planning").length;

  return (
    <MainLayout>
      <div className="pb-8 text-slate-800 dark:text-slate-100">

        {/* ── HERO BANNER & PROFESSIONAL SEARCH CARD ── */}
        <div className="relative overflow-hidden rounded-[32px] bg-slate-900 text-white mb-8 shadow-xl min-h-[340px] md:min-h-[400px] flex flex-col justify-center px-6 py-12 md:px-12">
          {/* Background image / abstract overlay */}
          <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80')` }} />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/80 to-transparent" />
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full blur-3xl opacity-20 bg-teal-400" />

          {/* Hero text content */}
          <div className="relative z-10 max-w-2xl text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold tracking-wide uppercase">
              ✨ Plan • Explore • Experience
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight font-poppins text-white tracking-tight">
              {greeting}, {firstName} 👋
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
                Explore the World Your Way
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-300 font-semibold leading-relaxed max-w-md">
              Create itineraries, track budgets, and discover handpicked attractions ranked by AI.
            </p>
          </div>

          {/* Floating Search Bar Card */}
          <div className="relative z-10 mt-8 w-full max-w-3xl">
            <div className="flex flex-col md:flex-row items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-2xl md:rounded-full p-2 md:pl-6">
              
              {/* Field 1: Destination Search */}
              <div className="flex items-center gap-3 flex-1 w-full pl-2">
                {exploreLoading ? (
                  <Loader2 size={18} className="text-teal-500 animate-spin flex-shrink-0" />
                ) : (
                  <Search size={18} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                )}
                <input
                  type="text"
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Where to? (e.g. Bali, Japan, Goa...)"
                  className="flex-1 bg-transparent text-slate-800 dark:text-white text-sm font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-550 outline-none w-full"
                  aria-label="Search destinations"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setExploreResults([]); setExploreQuery(""); if (abortRef.current) abortRef.current.abort(); }}
                    className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-550 hover:bg-slate-200"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Vertical Divider on Desktop */}
              <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-800" />

              {/* Weather Chip Suggestions */}
              <div className="flex items-center gap-2 pr-4 pl-2 text-xs font-bold text-slate-400">
                <WeatherChip />
              </div>

              {/* Search Action CTA Button */}
              <button
                onClick={() => search && fetchNearby(search)}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl md:rounded-full hover:scale-102 active:scale-98 shadow-brand hover:shadow-teal-500/30 transition-all cursor-pointer"
              >
                <span>Search</span>
                <Compass size={14} />
              </button>

            </div>
          </div>
        </div>

        {/* ── FIX 3/9: SMART EXPLORE RESULTS ───────────────────── */}
        <AnimatePresence>
          {exploreResults.length > 0 && (
            <motion.div
              key="explore-results"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between px-4 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-teal-500" />
                  <h3 className="text-[17px] font-bold text-slate-800">
                    {t("home.near")} <span className="text-teal-600">{exploreQuery}</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-100">
                    {t("home.aiRanked")}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 md:overflow-visible hide-scrollbar">
                {exploreResults.map((place, i) => (
                  <motion.div
                    key={place.name + i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.06 * i }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(`/create-trip?dest=${encodeURIComponent(place.name)}`)}
                    className="relative flex-shrink-0 w-40 h-52 md:w-full rounded-[24px] overflow-hidden cursor-pointer"
                    style={{ background: RESULT_GRADIENTS[i % RESULT_GRADIENTS.length] }}
                  >
                    {/* Emoji */}
                    <div className="absolute top-4 left-4 text-4xl">{place.emoji || "📍"}</div>

                    {/* Rating badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                      <Star size={9} className="text-yellow-300 fill-yellow-300" />
                      <span className="text-white text-[10px] font-bold">{place.rating}</span>
                    </div>

                    {/* Bottom info */}
                    <div
                      className="absolute bottom-0 inset-x-0 p-3"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
                    >
                      <p className="text-white font-extrabold text-sm leading-tight">{place.name}</p>
                      <p className="text-white/70 text-[10px] mt-0.5 capitalize">{place.type || "Attraction"}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI ASSISTANT CARD ─────────────────────────────── */}
        <AIAssistantCard onOpen={() => setAiOpen(true)} />

        {/* ── QUICK ACTIONS (Desktop: 4 columns, equal heights, 24px gap) ─────────────────────────────────── */}
        <div className="mb-4 lg:mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * i + 0.1, type: "spring", stiffness: 300 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 lg:gap-3.5 p-4 lg:p-6 min-h-[120px] lg:h-[180px] lg:min-h-[180px] rounded-2xl bg-white border border-slate-200 lg:bg-slate-900/40 lg:backdrop-blur-md lg:border-white/10 shadow-sm hover:shadow-md hover:border-slate-300 lg:hover:border-teal-500/30 lg:hover:shadow-[0_8px_32px_rgba(20,184,181,0.15)] lg:hover:-translate-y-1 transition-all duration-300"
                aria-label={t(action.label)}
              >
                <div
                  className="w-14 h-14 lg:w-16 lg:h-16 rounded-[18px] lg:rounded-2xl flex items-center justify-center text-2xl lg:text-3xl"
                  style={{ background: action.bg }}
                >
                  {action.emoji}
                </div>
                <span className="text-[11px] lg:text-sm font-semibold text-slate-500 lg:text-slate-300">{t(action.label)}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── TRENDING ACTIVITIES ───────────────────────────── */}
        <div className="mb-4 lg:mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-teal-500" />
              <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-200">{t("home.trendingActivities")}</h3>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible hide-scrollbar">
            {ACTIVITIES.map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i + 0.2 }}
                whileTap={{ scale: 0.92 }}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <span className="text-base">{a.emoji}</span>
                <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{a.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── FIX 5: TRENDING DESTINATIONS ──────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-orange-500" />
              <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-200">{t("home.trendingNow")}</h3>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-4 lg:grid-cols-8 md:overflow-visible hide-scrollbar">
            {TRENDING_DESTINATIONS.map((dest, i) => (
              <motion.button
                key={dest.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i + 0.15 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  setSearch(dest.name);
                  fetchNearby(dest.name);
                }}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs active:border-orange-300 dark:active:border-orange-500 transition-colors animate-fade-in"
              >
                <span className="text-base">{dest.emoji}</span>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 leading-none">{dest.name}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{dest.country}</p>
                </div>
                <span className="text-orange-400 text-[10px]">🔥</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── RECOMMENDED FOR YOU (Desktop: 6 cards per row, 4:5 aspect ratio, Unsplash imagery) ──────── */}
        <div className="mb-4 lg:mb-6">
          <div className="flex items-center justify-between px-4 lg:px-0 mb-3 lg:mb-5">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-teal-500" />
              <h3 className="text-[17px] lg:text-2xl font-bold text-slate-800 lg:text-white">{t("home.recommendedForYou")}</h3>
            </div>
            <button className="text-[13px] lg:text-sm font-semibold text-teal-600 flex items-center gap-1">
              {t("home.seeAll")} <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex gap-3 lg:gap-6 overflow-x-auto px-4 lg:px-0 pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0 hide-scrollbar">
            {STATIC_DESTINATIONS.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 * i + 0.2 }}
                whileTap={{ scale: 0.96 }}
                className="relative flex-shrink-0 w-44 h-56 lg:w-full lg:h-auto lg:aspect-[4/5] rounded-[24px] lg:rounded-[24px] overflow-hidden cursor-pointer lg:hover:-translate-y-1.5 lg:hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-all duration-300 group"
                style={{ background: dest.gradient }}
              >
                {/* Image background for desktop/tablet */}
                {dest.image && (
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                )}
                {/* Gradient overlay for photo visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-10" />

                {/* Emoji (hidden on desktop/tablet photography view, or kept small) */}
                <div className="absolute top-4 left-4 text-3xl lg:text-4xl z-20 transition-transform group-hover:scale-110">{dest.emoji}</div>

                {/* Tag */}
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm z-20">
                  <span className="text-white text-[10px] lg:text-xs font-bold">{dest.tag}</span>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 inset-x-0 p-4 lg:p-5 z-20">
                  <p className="text-white font-extrabold text-base lg:text-lg leading-tight">{dest.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-white/70 text-xs lg:text-sm">{dest.country}</p>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="lg:w-3.5 lg:h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-xs lg:text-sm font-semibold">{dest.rating}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── RECENT TRIPS (Desktop: Horizontal cards, 2-3 per row) ──────────────────────────────────── */}
        {recentTrips.length > 0 && (
          <div className="mb-4 lg:mb-6">
            <div className="flex items-center justify-between px-4 lg:px-0 mb-3 lg:mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                <h3 className="text-[17px] lg:text-heading-lg font-bold text-slate-800">{t("home.continuePlanning")}</h3>
              </div>
              <button
                onClick={() => navigate("/my-trips")}
                className="text-[13px] lg:text-sm font-semibold text-teal-600 flex items-center gap-1"
              >
                {t("home.seeAll")} <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-6">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-32 lg:h-40 w-full rounded-[20px] skeleton" />
                ))
              ) : (
                (recentTrips || []).map((trip, i) => {
                  if (!trip) return null;
                  const days = trip.startDate && trip.endDate
                    ? Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000))
                    : null;
                  const totalSpent = Object.values(trip.expenses || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
                  const progressPercent = days ? Math.min(100, Math.round(((trip.activitiesCount || 0) / (days * 3)) * 100)) : 0;
                  const daysRemaining = trip.endDate ? Math.max(0, Math.ceil((new Date(trip.endDate) - new Date()) / 86400000)) : 0;

                  return (
                    <motion.div
                      key={trip._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i + 0.1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/build-itinerary/${trip._id}`)}
                      className="premium-card p-4 lg:p-5 flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4 cursor-pointer min-h-[120px] lg:min-h-[140px]"
                      role="link"
                      aria-label={`Open itinerary for ${trip.title} to ${trip.destination}`}
                    >
                      {/* Cover */}
                      <div
                        className="relative w-12 h-12 lg:w-16 lg:h-16 rounded-[16px] lg:rounded-2xl flex-shrink-0 overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-xl lg:text-2xl">
                          {getEmoji(trip.destination)}
                        </div>
                        {trip.image && (
                          <img
                            src={trip.image}
                            alt={trip.destination}
                            className="absolute inset-0 w-full h-full object-cover z-10"
                            onError={e => { e.target.style.display = "none"; }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <p className="text-sm lg:text-card-text font-bold text-slate-800" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{trip.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                          <span className="text-xs lg:text-sm text-slate-400 truncate">{trip.destination}</span>
                        </div>

                        {/* Progress Bar */}
                        {days && (
                          <div className="mt-2 lg:mt-2.5">
                            <div className="flex justify-between items-center text-[10px] lg:text-xs font-semibold text-slate-400 mb-0.5">
                              <span>{t("home.planningProgress")}</span>
                              <span className="text-teal-600 font-bold">{progressPercent}%</span>
                            </div>
                            <div className="h-1.5 lg:h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${progressPercent}%`,
                                  background: "linear-gradient(90deg, #14B8B5, #0D9488)"
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Metadata row */}
                        <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-2 lg:mt-2.5 text-[10px] lg:text-xs font-bold text-slate-400" style={{overflow:'hidden'}}>
                          {days && <span className="flex-shrink-0">🗓️ {t("home.days", { count: days })}</span>}
                          {daysRemaining > 0 && <span className="flex-shrink-0">⏳ {t("home.daysLeft", { count: daysRemaining })}</span>}
                          {totalSpent > 0 && <span className="text-teal-600 flex-shrink-0">💰 ₹{totalSpent.toLocaleString()} {t("home.spent")}</span>}
                          {trip.activitiesCount > 0 && <span className="text-indigo-500 flex-shrink-0">📍 {t("home.acts", { count: trip.activitiesCount })}</span>}
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-300 flex-shrink-0 mt-2 lg:mt-0" />
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── AI ASSISTANT ──────────────────────────────────────── */}
      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Scratch Card Modal Overlay */}
      <ScratchCardModal
        isOpen={showScratchModal}
        onClose={() => setShowScratchModal(false)}
        card={unscratchedCard}
        onClaimed={() => {
          fetchReferralStats();
        }}
      />
    </MainLayout>
  );
};

export default Dashboard;