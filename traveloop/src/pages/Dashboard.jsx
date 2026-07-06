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
  { id: 1, name: "Bali",       country: "Indonesia",    emoji: "🌴", rating: 4.9, tag: "Trending",  gradient: "linear-gradient(135deg,#667EEA,#764BA2)" },
  { id: 2, name: "Santorini",  country: "Greece",       emoji: "🏛️", rating: 4.8, tag: "Popular",   gradient: "linear-gradient(135deg,#F093FB,#F5576C)" },
  { id: 3, name: "Maldives",   country: "Maldives",     emoji: "🐚", rating: 4.9, tag: "Luxury",    gradient: "linear-gradient(135deg,#4FACFE,#00F2FE)" },
  { id: 4, name: "Tokyo",      country: "Japan",        emoji: "🌸", rating: 4.7, tag: "Culture",   gradient: "linear-gradient(135deg,#F77062,#FE5196)" },
  { id: 5, name: "Swiss Alps", country: "Switzerland",  emoji: "🏔️", rating: 4.9, tag: "Adventure", gradient: "linear-gradient(135deg,#43E97B,#38F9D7)" },
  { id: 6, name: "Goa",        country: "India",        emoji: "🏖️", rating: 4.6, tag: "Beach",     gradient: "linear-gradient(135deg,#FA709A,#FEE140)" },
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
      <div className="pb-4 overflow-x-hidden">

        {/* ── GREETING ──────────────────────────────────────── */}
        <div className="px-4 pt-5 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <p className="text-slate-500 text-[15px] font-medium">{greeting},</p>
              <WeatherChip />
            </div>
            <h2 className="text-[26px] font-extrabold text-slate-800 leading-tight">
              {firstName} 👋
            </h2>
            {upcoming > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-slate-400 mt-1"
                dangerouslySetInnerHTML={{ __html: t("home.upcomingTrips", { count: upcoming }) }}
              />
            )}
          </motion.div>
        </div>

        {/* ── TRAVEL SCORE ──────────────────────────────────── */}
        <TravelScoreCard trips={trips} loading={loading} />

        {/* ── REFERRAL & REWARDS CARD ────────────────────────── */}
        <ReferralCard />

        {/* ── SEARCH BAR (Smart Explore) ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-4 mb-5"
        >
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-[18px] bg-white border border-slate-200 shadow-sm focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all duration-200">
            {exploreLoading ? (
              <Loader2 size={18} className="text-teal-400 flex-shrink-0 animate-spin" />
            ) : (
              <Search size={18} className="text-slate-400 flex-shrink-0" />
            )}
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              className="flex-1 bg-transparent text-slate-700 text-sm font-medium placeholder:text-slate-400 outline-none"
              aria-label="Search destinations"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setExploreResults([]); setExploreQuery(""); if (abortRef.current) abortRef.current.abort(); }}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 flex-shrink-0"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}>
              <Compass size={14} className="text-white" />
            </div>
          </div>
        </motion.div>

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

              <div className="flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar">
                {exploreResults.map((place, i) => (
                  <motion.div
                    key={place.name + i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.06 * i }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(`/create-trip?dest=${encodeURIComponent(place.name)}`)}
                    className="relative flex-shrink-0 w-40 h-52 rounded-[24px] overflow-hidden cursor-pointer"
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

        {/* ── QUICK ACTIONS ─────────────────────────────────── */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * i + 0.1, type: "spring", stiffness: 300 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 min-h-[48px]"
                aria-label={t(action.label)}
              >
                <div
                  className="w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl"
                  style={{ background: action.bg }}
                >
                  {action.emoji}
                </div>
                <span className="text-[11px] font-semibold text-slate-500">{t(action.label)}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── TRENDING ACTIVITIES ───────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-teal-500" />
              <h3 className="text-[17px] font-bold text-slate-800">{t("home.trendingActivities")}</h3>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 hide-scrollbar">
            {ACTIVITIES.map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i + 0.2 }}
                whileTap={{ scale: 0.92 }}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-xs"
              >
                <span className="text-base">{a.emoji}</span>
                <span className="text-[13px] font-semibold text-slate-600">{a.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── FIX 5: TRENDING DESTINATIONS ──────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-orange-500" />
              <h3 className="text-[17px] font-bold text-slate-800">{t("home.trendingNow")}</h3>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 hide-scrollbar">
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
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-xs active:border-orange-300 transition-colors"
              >
                <span className="text-base">{dest.emoji}</span>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-slate-700 leading-none">{dest.name}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{dest.country}</p>
                </div>
                <span className="text-orange-400 text-[10px]">🔥</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── FIX 4: RECOMMENDED FOR YOU (Home/Explore Sync) ──────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-teal-500" />
              <h3 className="text-[17px] font-bold text-slate-800">{t("home.recommendedForYou")}</h3>
            </div>
            <button className="text-[13px] font-semibold text-teal-600 flex items-center gap-1">
              {t("home.seeAll")} <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar">
            {STATIC_DESTINATIONS.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 * i + 0.2 }}
                whileTap={{ scale: 0.96 }}
                className="relative flex-shrink-0 w-44 h-56 rounded-[24px] overflow-hidden cursor-pointer"
                style={{ background: dest.gradient }}
              >
                {/* Emoji */}
                <div className="absolute top-4 left-4 text-5xl">{dest.emoji}</div>

                {/* Tag */}
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-white text-[10px] font-bold">{dest.tag}</span>
                </div>

                {/* Bottom info */}
                <div
                  className="absolute bottom-0 inset-x-0 p-4"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}
                >
                  <p className="text-white font-extrabold text-base leading-tight">{dest.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-white/70 text-xs">{dest.country}</p>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-xs font-semibold">{dest.rating}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── RECENT TRIPS ──────────────────────────────────── */}
        {recentTrips.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                <h3 className="text-[17px] font-bold text-slate-800">{t("home.continuePlanning")}</h3>
              </div>
              <button
                onClick={() => navigate("/my-trips")}
                className="text-[13px] font-semibold text-teal-600 flex items-center gap-1"
              >
                {t("home.seeAll")} <ChevronRight size={14} />
              </button>
            </div>

            <div className="px-4 flex flex-col gap-3">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-20 w-full rounded-[20px] skeleton" />
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
                      className="premium-card p-4 flex items-center gap-4 cursor-pointer"
                      role="link"
                      aria-label={`Open itinerary for ${trip.title} to ${trip.destination}`}
                    >
                      {/* Cover */}
                      <div
                        className="relative w-14 h-14 rounded-[16px] flex-shrink-0 overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">
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
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{trip.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-400 truncate">{trip.destination}</span>
                        </div>

                        {/* Progress Bar */}
                        {days && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 mb-0.5">
                              <span>{t("home.planningProgress")}</span>
                              <span className="text-teal-600 font-bold">{progressPercent}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
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
                        <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-2 text-[10px] font-bold text-slate-400" style={{overflow:'hidden'}}>
                          {days && <span className="flex-shrink-0">🗓️ {t("home.days", { count: days })}</span>}
                          {daysRemaining > 0 && <span className="flex-shrink-0">⏳ {t("home.daysLeft", { count: daysRemaining })}</span>}
                          {totalSpent > 0 && <span className="text-teal-600 flex-shrink-0">💰 ₹{totalSpent.toLocaleString()} {t("home.spent")}</span>}
                          {trip.activitiesCount > 0 && <span className="text-indigo-500 flex-shrink-0">📍 {t("home.acts", { count: trip.activitiesCount })}</span>}
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />
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