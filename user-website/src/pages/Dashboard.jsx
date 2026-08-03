// src/pages/Dashboard.jsx — Enterprise SaaS Redesign (Airbnb + Stripe + Linear + Apple)

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import MainLayout from "../layouts/MainLayout";
import { getApiUrl } from "../utils/api";
import { socket } from "../utils/socket";
import WeatherChip from "../components/dashboard/WeatherChip";
import { useAuth } from "../context/AuthContext";
import AIAssistantCard from "../components/dashboard/AIAssistantCard";
import ScratchCardModal from "../components/dashboard/ScratchCardModal";
import AIAssistant from "../components/ai/AIAssistant";
import { usePublishedTrips } from "../hooks/usePublishedTrips";
import {
  Search, ChevronRight, Star, MapPin, TrendingUp,
  ArrowRight, Zap, Compass, Flame, Loader2, Sparkles,
  Calendar, Plane, Hotel, DollarSign, Clock, ShieldCheck,
  Compass as CompassIcon, Filter, Layers, Heart
} from "lucide-react";

// ─── DEFAULT FALLBACK COVER IMAGES ──────────────────────────────
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
];

// Helper Functions for Published Trips Card Format
const getTripTitle = (t) => t.title || t.name || t.destination || "Curated Travel Package";
const getTripLocation = (t) => t.destination || t.location || "Global Destination";
const getTripImage = (t, idx) => t.coverImage || t.image || t.photos?.[0] || DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length];
const getTripPrice = (t) => t.pricePerPerson || t.price || t.priceInr || 4999;
const getTripDuration = (t) => {
  if (t.duration) return t.duration;
  if (t.startDate && t.endDate) {
    const days = Math.max(1, Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / 86400000));
    return `${days} Days / ${days - 1} Nights`;
  }
  return "3 Days / 2 Nights";
};
const getTripRating = (t) => t.rating || "4.8";
const getAgentName = (t) => t.agentName || t.createdBy?.name || t.agent?.name || "Verified Partner";
const getAvailableSeats = (t) => t.availableSeats ?? t.seatsLeft ?? t.available_seats ?? 12;

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

// Quick action shortcuts with 3D image card artwork
const QUICK_ACTIONS = [
  {
    title: "My Trips",
    subtitle: "View & organize itineraries",
    badge: "✈️ Trips",
    path: "/my-trips",
    image: "/assets/cards/trips_card.png",
  },
  {
    title: "Create Trip",
    subtitle: "AI journey planner",
    badge: "➕ Create",
    path: "/create-trip",
    image: "/assets/cards/create_trip_card.png",
  },
  {
    title: "Packing List",
    subtitle: "Smart travel checklist",
    badge: "🧳 Packing",
    path: "/my-trips",
    image: "/assets/cards/packing_card.png",
  },
  {
    title: "Travel Notes",
    subtitle: "Memories & diary log",
    badge: "📝 Notes",
    path: "/my-trips",
    image: "/assets/cards/notes_card.png",
  },
];

const Dashboard = () => {
  const navigate     = useNavigate();
  const { t }        = useTranslation();
  const [trips, setTrips]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [aiOpen, setAiOpen]               = useState(false);
  const [search, setSearch]               = useState("");
  const [selectedDates, setSelectedDates] = useState("Anytime");

  const [exploreResults, setExploreResults] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreQuery, setExploreQuery]     = useState("");

  const exploreCache = useRef({});
  const searchDebounce = useRef(null);
  const abortRef = useRef(null);

  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [unscratchedCard, setUnscratchedCard] = useState(null);
  const [showScratchModal, setShowScratchModal] = useState(false);

  // Live Published Trips Hook (Same backend feed as Explore)
  const { data: publishedTrips, isLoading: loadingPublished } = usePublishedTrips();

  // Local Save / Bookmark State
  const [savedTripIds, setSavedTripIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("savedTripIds") || "[]");
    } catch (e) {
      return [];
    }
  });

  const toggleSaveTrip = (id) => {
    setSavedTripIds(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("savedTripIds", JSON.stringify(updated));
      return updated;
    });
  };

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
      if (e.detail) setCurrentUser(e.detail);
    };
    window.addEventListener("userUpdated", handleUserUpdate);
    return () => window.removeEventListener("userUpdated", handleUserUpdate);
  }, []);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(getApiUrl("trips"), {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) setTrips(data.trips || []);
    } catch (err) {
      console.error("Error fetching trips:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    const handleTripDeleted = (deletedId) => {
      setTrips(prev => prev.filter(t => t._id !== deletedId));
      setExploreResults(prev => prev.filter(t => t._id !== deletedId));
    };

    socket.on("trip_deleted", handleTripDeleted);
    return () => socket.off("trip_deleted", handleTripDeleted);
  }, []);

  // Smart Explore Discovery API with 500ms debounce
  const fetchNearby = useCallback(async (query) => {
    if (!query.trim()) return;

    const cacheKey = query.trim().toLowerCase();
    if (exploreCache.current[cacheKey] && exploreCache.current[cacheKey].expiresAt > Date.now()) {
      setExploreResults(exploreCache.current[cacheKey].places);
      setExploreQuery(query.trim());
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setExploreLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        getApiUrl(`explore/discover?query=${encodeURIComponent(query.trim())}`),
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      const data = await res.json();
      if (data.success && data.places?.length > 0) {
        exploreCache.current[cacheKey] = {
          places: data.places,
          expiresAt: Date.now() + 5 * 60 * 1000,
        };
        setExploreResults(data.places);
        setExploreQuery(query.trim());
      } else {
        setExploreResults([]);
        setExploreQuery("");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
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
    searchDebounce.current = setTimeout(() => {
      fetchNearby(val.trim());
    }, 500);
  };

  const recentTrips = trips.slice(0, 4);
  const firstName = currentUser?.firstName || currentUser?.name?.split(" ")[0] || "Traveler";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <MainLayout>
      <div className="pb-12 text-[#0F172A]">

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── HERO BANNER SECTION (Clean Spacing, Centered Search) ──── */}
        {/* ════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-sky-50/70 to-cyan-50/50 border border-slate-900/[0.06] mb-12 shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-8 sm:p-12 md:p-14 flex flex-col justify-center items-center text-center"
        >
          {/* Animated Glow Circles */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-1/3 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none"
          />

          {/* Minimal Vector Mountain Line Illustration in background */}
          <svg className="absolute bottom-0 left-0 right-0 w-full h-36 opacity-10 text-cyan-700 pointer-events-none" viewBox="0 0 1440 320" fill="none">
            <path fill="currentColor" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,218.7C840,213,960,171,1080,165.3C1200,160,1320,192,1380,208L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>

          {/* Hero Header Content */}
          <div className="relative z-10 max-w-4xl space-y-4 pt-2 flex flex-col items-center">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-cyan-200/60 shadow-sm text-cyan-700 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Next-Gen AI Travel SaaS</span>
            </div>

            {/* Main Typography */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-black text-[#0F172A] tracking-tight leading-[1.12]"
            >
              {greeting}, {firstName} 👋
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #06B6D4, #2563EB)" }}
              >
                Explore the World Your Way
              </span>
            </motion.h1>

            <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed max-w-2xl">
              Seamlessly generate AI itineraries, manage travel budgets, and discover handpicked global destinations.
            </p>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* ── FLOATING PRIMARY SEARCH BAR (Centered, max-w-[1100px]) ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative z-10 w-full max-w-[1100px] mt-10 md:mt-12"
          >
            <div className="h-auto md:h-[72px] rounded-[28px] md:rounded-full bg-white border border-slate-900/[0.08] shadow-[0_20px_50px_rgba(15,23,42,0.1)] p-2 md:px-4 flex flex-col md:flex-row items-center gap-3 transition-all duration-300">
              
              {/* 1. Destination Input */}
              <div className="flex items-center gap-3 flex-1 w-full pl-3 pr-2 py-2 md:py-0">
                {exploreLoading ? (
                  <Loader2 className="w-5 h-5 text-cyan-500 animate-spin shrink-0" />
                ) : (
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <input
                  type="text"
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Where to? (e.g. Bali, Japan, Paris...)"
                  className="w-full bg-transparent text-[#0F172A] text-sm md:text-base font-bold placeholder:text-slate-400 outline-none"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setExploreResults([]); setExploreQuery(""); if (abortRef.current) abortRef.current.abort(); }}
                    className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 text-xs font-bold shrink-0"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Vertical Divider */}
              <div className="hidden md:block w-px h-8 bg-slate-200" />

              {/* 2. Date Picker Selector */}
              <div className="hidden md:flex items-center gap-2.5 px-3 text-xs md:text-sm font-extrabold text-slate-600 shrink-0 cursor-pointer hover:text-cyan-600 transition-colors">
                <Calendar className="w-4 h-4 text-cyan-500" />
                <span>{selectedDates}</span>
              </div>

              {/* Vertical Divider */}
              <div className="hidden md:block w-px h-8 bg-slate-200" />

              {/* 3. Weather Chip */}
              <div className="hidden lg:flex items-center gap-2 px-2 shrink-0">
                <WeatherChip />
              </div>

              {/* 4. Search CTA Button */}
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => search && fetchNearby(search)}
                className="w-full md:w-auto h-12 md:h-14 px-8 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white font-extrabold text-sm md:text-base tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <span>Search</span>
                <Compass className="w-4 h-4" />
              </motion.button>

            </div>
          </motion.div>
        </motion.div>

        {/* ── LIVE SEARCH EXPLORE RESULTS DROPDOWN ── */}
        <AnimatePresence>
          {exploreResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-10 p-6 rounded-[28px] bg-white border border-slate-900/[0.08] shadow-[0_20px_60px_rgba(15,23,42,0.12)] space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-500" />
                  <h3 className="text-lg font-black text-[#0F172A]">Discover Places for "{exploreQuery}"</h3>
                </div>
                <button
                  onClick={() => { setExploreResults([]); setExploreQuery(""); setSearch(""); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {exploreResults.map((place, i) => (
                  <motion.div
                    key={place.name + i}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ y: -6 }}
                    onClick={() => navigate(`/create-trip?dest=${encodeURIComponent(place.name)}`)}
                    className="group relative rounded-[24px] overflow-hidden bg-white border border-slate-900/[0.06] shadow-[0_15px_40px_rgba(15,23,42,0.06)] aspect-[4/5] cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 mix-blend-multiply z-10" />
                    <div className="absolute top-4 left-4 text-3xl z-20">{place.emoji || "📍"}</div>
                    
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-extrabold z-20">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{place.rating || "4.9"}</span>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent z-20 space-y-1">
                      <p className="text-white font-extrabold text-base leading-tight truncate">{place.name}</p>
                      <p className="text-white/70 text-xs font-medium capitalize">{place.type || "Attraction"}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI ASSISTANT BANNER CARD ── */}
        <AIAssistantCard onOpen={() => setAiOpen(true)} />

        {/* ── TRAVEL-THEMED 3D IMAGE CARDS (340×180px, Glass Overlay) ── */}
        <div className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                whileHover={{ y: -8 }}
                onClick={() => navigate(action.path)}
                className="group relative h-[180px] rounded-[24px] overflow-hidden bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_60px_rgba(6,182,212,0.25)] flex flex-col justify-between cursor-pointer transition-all duration-300"
              >
                {/* Image Section (Top 68%) */}
                <div className="relative h-[68%] w-full overflow-hidden bg-slate-100">
                  <img
                    src={action.image}
                    alt={action.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Subtle Top Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                  {/* Top Badge Pill */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/85 backdrop-blur-md border border-white/60 text-[11px] font-black text-[#0F172A] shadow-sm">
                    {action.badge}
                  </div>
                </div>

                {/* Bottom Glass Overlay Section (Bottom 32%) */}
                <div className="h-[32%] w-full bg-white/90 backdrop-blur-md border-t border-slate-200/50 px-4 py-2 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-[#0F172A] group-hover:text-cyan-600 transition-colors leading-tight">
                        {action.title}
                      </h4>
                      <p className="text-[11px] text-[#64748B] font-semibold leading-tight mt-0.5">
                        {action.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── TRENDING DESTINATIONS & ACTIVITIES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Left: Trending Dest Pills (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="text-xl font-extrabold text-[#0F172A]">{t("home.trendingNow")}</h3>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 flex-wrap">
              {TRENDING_DESTINATIONS.map((dest, i) => (
                <motion.button
                  key={dest.name}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearch(dest.name);
                    fetchNearby(dest.name);
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-slate-900/[0.06] shadow-sm hover:shadow-md text-xs font-extrabold text-[#0F172A] cursor-pointer transition-all"
                >
                  <span className="text-base">{dest.emoji}</span>
                  <span>{dest.name}</span>
                  <span className="text-[10px] text-[#64748B] font-medium">• {dest.country}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right: Trending Activities (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-500" />
              <h3 className="text-xl font-extrabold text-[#0F172A]">{t("home.trendingActivities")}</h3>
            </div>

            <div className="flex gap-2 flex-wrap">
              {ACTIVITIES.map((a, i) => (
                <motion.button
                  key={a.label}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-900/[0.06] shadow-xs text-xs font-bold text-slate-700 hover:text-cyan-600 transition-colors"
                >
                  <span className="text-base">{a.emoji}</span>
                  <span>{a.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── RECOMMENDED FOR YOU (LIVE PUBLISHED TRIPS) ────────────── */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-500" />
                <h3 className="text-2xl font-black text-[#0F172A]">{t("home.recommendedForYou")}</h3>
              </div>
              <p className="text-xs text-[#64748B] font-medium">Live published travel packages synchronized with Explore</p>
            </div>

            {publishedTrips && publishedTrips.length > 0 && (
              <button
                onClick={() => navigate("/activities")}
                className="text-xs font-extrabold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({publishedTrips.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {loadingPublished ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-96 rounded-[24px] bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : !publishedTrips || publishedTrips.length === 0 ? (
            <div className="rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.06)] p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center mx-auto mb-2">
                <Compass className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-[#0F172A]">No trips have been published yet.</h4>
              <p className="text-xs text-[#64748B] font-medium max-w-sm mx-auto">
                Check back soon or create your own custom AI itinerary to explore handpicked destinations!
              </p>
              <button
                onClick={() => navigate("/create-trip")}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                Create Custom Trip
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {publishedTrips.slice(0, 8).map((trip, i) => {
                const title = getTripTitle(trip);
                const location = getTripLocation(trip);
                const image = getTripImage(trip, i);
                const price = getTripPrice(trip);
                const duration = getTripDuration(trip);
                const rating = getTripRating(trip);
                const agentName = getAgentName(trip);
                const availableSeats = getAvailableSeats(trip);
                const isSaved = savedTripIds.includes(trip._id);

                return (
                  <motion.div
                    key={trip._id || i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ y: -6 }}
                    className="group rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col justify-between transition-all duration-300 relative"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                      {/* Verified Badge */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black text-emerald-700 border border-emerald-200/80 shadow-sm flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span>Verified Partner</span>
                      </div>

                      {/* Rating & Save Button */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-black">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{rating}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveTrip(trip._id);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer ${
                            isSaved ? "bg-rose-500 text-white" : "bg-black/40 text-white hover:bg-black/60"
                          }`}
                          title={isSaved ? "Saved" : "Save trip"}
                        >
                          <Heart size={14} className={isSaved ? "fill-white" : ""} />
                        </button>
                      </div>

                      {/* Duration Tag */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-bold text-white/90">
                        <Clock size={12} className="text-cyan-400" />
                        <span>{duration}</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-[#64748B] font-medium">
                          <MapPin size={12} className="text-cyan-500 shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                        <h4 className="text-base font-black text-[#0F172A] leading-snug line-clamp-1 group-hover:text-cyan-600 transition-colors">
                          {title}
                        </h4>
                      </div>

                      {/* Agent Name & Seats Left */}
                      <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 font-black text-[10px] flex items-center justify-center">
                            {agentName.charAt(0)}
                          </div>
                          <span className="text-slate-600 font-bold text-[11px] truncate max-w-[110px]">{agentName}</span>
                        </div>

                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                          {availableSeats} seats left
                        </span>
                      </div>

                      {/* Footer: Price & Book Now CTA */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Price</span>
                          <span className="text-base font-black text-cyan-600">₹{price.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-medium"> / person</span>
                        </div>

                        <button
                          onClick={() => navigate(`/trips/${trip._id}/activities`)}
                          className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <span>Book Now</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* ── MY TRIPS TIMELINE SECTION ─────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════ */}
        {recentTrips.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="text-2xl font-black text-[#0F172A]">{t("home.continuePlanning")}</h3>
              </div>
              <button
                onClick={() => navigate("/my-trips")}
                className="text-xs font-extrabold text-cyan-600 flex items-center gap-1 cursor-pointer"
              >
                <span>{t("home.seeAll")}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="h-44 rounded-[24px] bg-slate-200/60 animate-pulse" />
                ))
              ) : (
                recentTrips.map((trip, i) => {
                  if (!trip) return null;
                  const days = trip.startDate && trip.endDate
                    ? Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000))
                    : null;
                  const totalSpent = Object.values(trip.expenses || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
                  const progressPercent = days ? Math.min(100, Math.round(((trip.activitiesCount || 0) / (days * 3)) * 100)) : 0;

                  return (
                    <motion.div
                      key={trip._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i }}
                      whileHover={{ y: -6 }}
                      onClick={() => navigate(`/build-itinerary/${trip._id}`)}
                      className="p-6 rounded-[24px] bg-white border border-slate-900/[0.06] shadow-[0_15px_50px_rgba(15,23,42,0.08)] flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300"
                    >
                      {/* Trip Top Row */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center text-2xl shadow-md shadow-cyan-500/20 shrink-0">
                          {getEmoji(trip.destination)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-extrabold text-[#0F172A] truncate mb-0.5">
                            {trip.title}
                          </h4>
                          <p className="text-xs text-[#64748B] flex items-center gap-1 font-medium truncate">
                            <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                            <span>{trip.destination}</span>
                          </p>
                        </div>
                      </div>

                      {/* Timeline Icons & Progress */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
                          <span className="flex items-center gap-1">
                            <Plane className="w-3.5 h-3.5 text-cyan-500" /> Flight
                          </span>
                          <span className="flex items-center gap-1">
                            <Hotel className="w-3.5 h-3.5 text-blue-500" /> Hotel
                          </span>
                          <span className="text-cyan-600 font-bold">{progressPercent}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer Metadata */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-extrabold text-[#0F172A]">
                          {days ? `${days} Days` : "Custom"}
                        </span>
                        <span className="font-extrabold text-cyan-600">
                          {totalSpent > 0 ? `₹${totalSpent.toLocaleString()}` : "Planning"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── AI ASSISTANT DRAWER MODAL ── */}
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