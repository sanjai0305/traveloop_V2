// src/pages/Activities.jsx — V1.7 AI Destination Discovery Engine
// Preserves all existing in-trip AI + Curated Feed functionality.
// New: AI-powered destination discovery mode when no trip is selected.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import {
  Star, MapPin, Clock, Search, Bookmark, Plus, ArrowRight,
  TrendingUp, Sparkles, Compass, X, Heart, Loader2,
  Zap, Navigation, Globe, Calendar
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { useToast } from "../components/mobile/MobileToast";
import { usePublishedTrips } from "../hooks/usePublishedTrips";

// Curated local images (paragliding feed — preserved from V1.0)
import BirBilling  from "../assets/images/bir-billing.jpg";
import Oludeniz    from "../assets/images/oludeniz.jpg";
import Interlaken  from "../assets/images/interlaken.jpg";
import Pokhara     from "../assets/images/pokhara.jpg";
import Goa         from "../assets/images/goa-paragliding.jpg";

const CURATED_ACTIVITIES = [
  { id: "c1", title: "Paragliding in Bir Billing",  location: "Bir Billing, Himachal Pradesh", image: BirBilling,  rating: 4.8, reviews: "1.2k", duration: "1-2 hrs",    price: 3500,  oldPrice: 4800,  tags: ["Adventure", "Beginners"], description: "Experience the world's second highest paragliding site.", category: "Activity" },
  { id: "c2", title: "Paragliding in Oludeniz",     location: "Oludeniz, Turkey",              image: Oludeniz,    rating: 4.7, reviews: "856",   duration: "30-45 min", price: 7200,  oldPrice: 11000, tags: ["Adventure", "Popular"],   description: "Soar above the beautiful blue lagoon.", category: "Activity" },
  { id: "c3", title: "Paragliding in Interlaken",   location: "Interlaken, Switzerland",       image: Interlaken,  rating: 4.9, reviews: "1.5k",  duration: "15-30 min", price: 12500, oldPrice: 18000, tags: ["Adventure", "Scenic"],    description: "Fly over the majestic Swiss Alps.", category: "Activity" },
  { id: "c4", title: "Paragliding in Pokhara",      location: "Pokhara, Nepal",                image: Pokhara,     rating: 4.8, reviews: "987",   duration: "20-30 min", price: 6000,  oldPrice: 8200,  tags: ["Adventure"],              description: "Enjoy stunning views of Phewa Lake.", category: "Activity" },
  { id: "c5", title: "Paragliding in Goa",          location: "North Goa, India",              image: Goa,         rating: 4.6, reviews: "642",   duration: "10-20 min", price: 2800,  oldPrice: 3900,  tags: ["Adventure", "Beach Views"],description: "Fly over scenic Goa beaches.", category: "Activity" },
];

const CATEGORIES = ["All", "Adventure", "Beach Views", "Scenic", "Popular", "Beginners"];

// ─── Badge logic ──────────────────────────────────────────────────────────────
const BADGE_THRESHOLDS = { trending: 50000, highlyRated: 4.6 };

const getPlaceBadge = (place) => {
  if (place.reviewCount >= BADGE_THRESHOLDS.trending)  return { label: "🔥 Trending",       style: "bg-orange-50 text-orange-600 border border-orange-100" };
  if (place.rating   >= BADGE_THRESHOLDS.highlyRated)  return { label: "⭐ Highly Rated",    style: "bg-yellow-50 text-yellow-700 border border-yellow-100" };
  return                                                       { label: "🤖 AI Recommended", style: "bg-teal-50 text-teal-600 border border-teal-100"       };
};

// ─── Gradient palette for photo fallback ─────────────────────────────────────
const CARD_GRADIENTS = [
  "linear-gradient(135deg,#667EEA,#764BA2)",
  "linear-gradient(135deg,#F093FB,#F5576C)",
  "linear-gradient(135deg,#4FACFE,#00F2FE)",
  "linear-gradient(135deg,#F77062,#FE5196)",
  "linear-gradient(135deg,#43E97B,#38F9D7)",
  "linear-gradient(135deg,#FA709A,#FEE140)",
  "linear-gradient(135deg,#A18CD1,#FBC2EB)",
  "linear-gradient(135deg,#FCCB90,#D57EEB)",
  "linear-gradient(135deg,#E0C3FC,#8EC5FC)",
  "linear-gradient(135deg,#FDD835,#FF6F00)",
];

// Place-type → emoji for fallback cards
const TYPE_EMOJI = {
  "attraction": "📍", "museum": "🏛️", "park": "🌿", "temple": "🛕",
  "beach": "🏖️", "fort": "🏰", "palace": "👑", "lake": "💧",
  "mountain": "🏔️", "waterfall": "💧", "market": "🛍️", "garden": "🌸",
  "monument": "🗺️", "castle": "🏯", "island": "🏝️", "nature": "🌲",
  "heritage": "🏛️", "shrine": "⛩️", "church": "⛪", "zoo": "🦁",
  "aquarium": "🐟", "ghat": "🌅", "cruise": "🚢", "adventure": "🎯",
};

const getTypeEmoji = (typeLabel = "") => {
  const key = typeLabel.toLowerCase();
  for (const [k, v] of Object.entries(TYPE_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return "✈️";
};

// Format review count
const fmtReviews = (n) => {
  if (!n) return "";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
};

// ─── Discover Card ────────────────────────────────────────────────────────────
const DiscoverCard = ({ place, index, onCreateTrip }) => {
  const badge    = getPlaceBadge(place);
  const emoji    = getTypeEmoji(place.type);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 260, damping: 22 }}
      className="premium-card overflow-hidden bg-white shadow-sm"
    >
      {/* Photo / Gradient hero */}
      <div className="relative h-48 flex-shrink-0" style={{ background: gradient }}>
        {place.photo && !imgErr ? (
          <img
            src={place.photo}
            alt={place.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl select-none">
            {emoji}
          </div>
        )}
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />

        {/* Rating badge — top left */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold">
          <Star size={9} className="text-yellow-400 fill-yellow-400" />
          {place.rating.toFixed(1)}
          {place.reviewCount > 0 && (
            <span className="text-white/70 ml-0.5">({fmtReviews(place.reviewCount)})</span>
          )}
        </div>

        {/* AI badge — top right */}
        <span className={`absolute top-3 right-3 text-[9px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${badge.style}`}>
          {badge.label}
        </span>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-white/70 bg-white/10 px-2 py-0.5 rounded mb-1">
            {place.type}
          </span>
          <h3 className="text-white font-extrabold text-[15px] leading-tight">{place.name}</h3>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Location */}
        <p className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-3">
          <MapPin size={11} className="text-slate-300 flex-shrink-0" />
          <span className="truncate">{place.vicinity}</span>
        </p>

        {/* Actions row */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onCreateTrip(place)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-white text-xs font-bold shadow-sm"
            style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
          >
            <Navigation size={13} />
            Create Trip
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = ({ i }) => (
  <motion.div
    key={i}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: i * 0.05 }}
    className="premium-card overflow-hidden"
  >
    <div className="h-48 skeleton" />
    <div className="p-4 space-y-2">
      <div className="h-3 skeleton rounded w-2/3" />
      <div className="h-3 skeleton rounded w-1/2" />
      <div className="h-9 skeleton rounded-[14px] mt-3" />
    </div>
  </motion.div>
);

// ─── Published Trip Card ──────────────────────────────────────────────────────
const PublishedTripCard = ({ trip, onClick }) => {
  const discountAmount = (trip.originalPrice || 0) - (trip.offerPrice || trip.pricePerPerson || 0);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="premium-card bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col cursor-pointer"
    >
      <div className="relative h-44 w-full">
        <img
          src={trip.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-teal-500 text-white text-[9px] font-extrabold uppercase tracking-wider">
          Published
        </span>
        {discountAmount > 0 && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider">
            Save ₹{discountAmount.toLocaleString()}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block truncate max-w-[65%]">
              👤 {trip.agent?.companyName || "Verified Agent"}
            </span>
            <span className="text-[9px] text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-wider bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded">
              {trip.category || "Group"}
            </span>
          </div>

          <h3 className="text-sm font-extrabold text-slate-850 dark:text-white leading-tight line-clamp-1">{trip.title}</h3>
          
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <MapPin size={11} className="text-teal-500" />
            <span className="truncate">{trip.destinations?.join(" → ")}</span>
          </p>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
            <Calendar size={10} />
            <span>{trip.startDate} to {trip.endDate} ({trip.duration})</span>
          </p>

          <div className="flex items-center gap-2 mt-2 py-1.5 border-y border-slate-50 dark:border-slate-750">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
              🚌 {trip.busType}
            </span>
            <span className="text-slate-200 dark:text-slate-700">|</span>
            <span className="text-[10px] text-rose-500 font-bold animate-pulse">
              🔥 {trip.availableSeats} seats left
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-1">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-extrabold text-slate-850 dark:text-white">
                ₹{(trip.offerPrice || trip.pricePerPerson || 0).toLocaleString()}
              </span>
              {trip.originalPrice > 0 && (
                <span className="text-[10px] text-slate-400 line-through">
                  ₹{trip.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-400 block font-semibold">per person</span>
          </div>

          <button
            className="px-4 py-2 rounded-xl bg-teal-500 text-white font-extrabold text-[10px]"
          >
            Book Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const Activities = () => {
  const { id }   = useParams();
  const navigate  = useNavigate();
  const toast     = useToast();

  // ── In-trip state (preserved) ─────────────────────────────────────────────
  const [trip,            setTrip]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingAI,       setLoadingAI]       = useState(false);
  const [activeTab,       setActiveTab]       = useState(id ? "ai" : "discover");
  const [category,        setCategory]        = useState("All");
  const [bookmarks,       setBookmarks]       = useState(new Set());
  const [savedPlaces,     setSavedPlaces]     = useState([]);
  const [selectedAct,     setSelectedAct]     = useState(null);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [daysCount,       setDaysCount]       = useState(1);
  const [adding,          setAdding]          = useState(false);

  // ── V1.7 Discovery state ──────────────────────────────────────────────────
  const [discoverSearch,  setDiscoverSearch]  = useState("");
  const [discoverResults, setDiscoverResults] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverQuery,   setDiscoverQuery]   = useState(""); // label shown above results
  const discoverCache   = useRef({});                          // 5-min client cache
  const abortRef        = useRef(null);                        // AbortController ref
  const debounceRef     = useRef(null);
  const [inlineSearch,   setInlineSearch]    = useState("");   // shared search bar value

  // ── usePublishedTrips Hook & filtering ──────────────────────────────────
  const { data: publishedTrips, isLoading: pubLoading, error: pubError } = usePublishedTrips();

  const filteredPublishedTrips = useMemo(() => {
    if (!publishedTrips) return [];
    const query = (discoverSearch || inlineSearch || "").toLowerCase().trim();
    if (!query) return publishedTrips;

    return publishedTrips.filter((t) => {
      const matchTitle = (t.title || "").toLowerCase().includes(query);
      const matchSub = (t.subtitle || "").toLowerCase().includes(query);
      const matchDest = (t.destinations || []).some(d => d.toLowerCase().includes(query));
      const matchOrigin = (t.originCity || "").toLowerCase().includes(query);
      const matchAgent = (t.agent?.companyName || t.agent?.displayName || "").toLowerCase().includes(query);
      const matchPickup = (t.pickupLocation || "").toLowerCase().includes(query) || (t.pickupPoint || "").toLowerCase().includes(query);
      const matchTripType = (t.tripType || "").toLowerCase().includes(query);
      
      const matchAmenities = (t.amenities || []).some(a => a.toLowerCase().includes(query)) ||
                             (t.busAmenities || []).some(a => a.toLowerCase().includes(query));
      
      const matchHotels = (t.hotelName || "").toLowerCase().includes(query) ||
                          (t.hotels || []).some(h => (h.name || "").toLowerCase().includes(query));
      
      const matchActivities = (t.activities || []).some(a => a.toLowerCase().includes(query)) ||
                              (t.itinerary || []).some(day => 
                                (day.activities || []).some(act => act.toLowerCase().includes(query))
                              );

      return matchTitle || matchSub || matchDest || matchOrigin || matchAgent || matchPickup || matchTripType || matchAmenities || matchHotels || matchActivities;
    });
  }, [publishedTrips, discoverSearch, inlineSearch]);

  const popularChips = useMemo(() => {
    if (!publishedTrips || publishedTrips.length === 0) {
      return ["Salem", "Adventure Ride", "Temple Tour", "Corporate Tour", "Ooty Hills", "Madurai"];
    }
    const counts = {};
    publishedTrips.forEach((t) => {
      (t.destinations || []).forEach((d) => {
        if (d) counts[d] = (counts[d] || 0) + 1;
      });
      if (t.originCity) {
        counts[t.originCity] = (counts[t.originCity] || 0) + 1;
      }
      if (t.tripType) {
        counts[t.tripType] = (counts[t.tripType] || 0) + 1.5;
      }
      (t.amenities || []).slice(0, 3).forEach((a) => {
        if (a) counts[a] = (counts[a] || 0) + 0.8;
      });
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const defaults = ["Salem", "Adventure Ride", "Temple Tour", "Corporate Tour", "Ooty Hills", "Madurai"];
    const merged = Array.from(new Set([...sorted, ...defaults]));
    return merged.slice(0, 8);
  }, [publishedTrips]);

  // ── Fetch saved destinations ──────────────────────────────────────────────
  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res  = await fetch(getApiUrl("profile/saved-destinations"), { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setSavedPlaces(data.savedDestinations || []);
      } catch (_) {}
    };
    fetchSaved();
  }, []);

  const handleToggleSaveDestination = async () => {
    if (!trip?.destination) return;
    try {
      const token  = localStorage.getItem("token");
      const isSaved = savedPlaces.includes(trip.destination);
      const res     = isSaved
        ? await fetch(getApiUrl(`profile/saved-destinations/${encodeURIComponent(trip.destination)}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
        : await fetch(getApiUrl("profile/saved-destinations"), { method: "POST",   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ destination: trip.destination }) });
      const data = await res.json();
      if (data.success) {
        setSavedPlaces(data.savedDestinations || []);
        toast.success(isSaved ? "Removed from Saved Places" : "Added to Saved Places!");
      }
    } catch (_) { toast.error("Failed to update saved place"); }
  };

  // ── Fetch trip (in-trip mode) ─────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const fetchTrip = async () => {
      try {
        const token = localStorage.getItem("token");
        const res   = await fetch(getApiUrl(`trips/${id}`), { headers: { Authorization: `Bearer ${token}` } });
        const data  = await res.json();
        if (data.success && data.trip) {
          setTrip(data.trip);
          if (data.trip.startDate && data.trip.endDate) {
            setDaysCount(Math.max(1, Math.ceil((new Date(data.trip.endDate) - new Date(data.trip.startDate)) / 86400000)));
          }
          fetchAIRecommendations(data.trip._id);
        }
      } catch (_) {} finally { setLoading(false); }
    };
    fetchTrip();
  }, [id]);

  const fetchAIRecommendations = async (tripId) => {
    try {
      setLoadingAI(true);
      const token = localStorage.getItem("token");
      const res   = await fetch(getApiUrl(`trips/${tripId}/recommendations`), { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setRecommendations(data.recommendations || []);
    } catch (_) {} finally { setLoadingAI(false); }
  };

  // ── V1.7: Discovery fetch with AbortController + 5-min cache ─────────────
  const fetchDiscover = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setDiscoverResults([]);
      setDiscoverQuery("");
      return;
    }

    const cacheKey = query.trim().toLowerCase();

    // Client-side cache hit
    const cached = discoverCache.current[cacheKey];
    if (cached && cached.expiresAt > Date.now()) {
      setDiscoverResults(cached.places);
      setDiscoverQuery(query.trim());
      return;
    }

    // Cancel in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      console.log("Explore Search Start:", query);
      setDiscoverLoading(true);
      const token = localStorage.getItem("token");
      const res   = await fetch(
        getApiUrl(`explore/discover?query=${encodeURIComponent(query.trim())}`),
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      const data = await res.json();

      if (data.success && data.places?.length > 0) {
        console.log("Explore API Success");
        // Cache for 5 minutes
        discoverCache.current[cacheKey] = {
          places:    data.places,
          expiresAt: Date.now() + 5 * 60 * 1000,
        };
        setDiscoverResults(data.places);
        setDiscoverQuery(query.trim());
      } else {
        console.log("Explore API Failed");
        setDiscoverResults([]);
        setDiscoverQuery("");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.log("Explore API Failed");
        console.error("[Discover] fetch error:", err);
        setDiscoverResults([]);
      }
    } finally {
      if (abortRef.current === controller) {
        setDiscoverLoading(false);
      }
    }
  }, []);

  // ── 500ms debounced handler ───────────────────────────────────────────────
  const handleDiscoverInput = (val) => {
    setDiscoverSearch(val);
    setInlineSearch(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setDiscoverResults([]);
      setDiscoverQuery("");
      if (abortRef.current) abortRef.current.abort();
      return;
    }
    debounceRef.current = setTimeout(() => fetchDiscover(val), 500);
  };

  // Handle inline search (shared bar when in-trip tabs are shown)
  const handleInlineSearch = (val) => {
    setInlineSearch(val);
    if (activeTab === "discover") handleDiscoverInput(val);
  };

  // ── Bookmarks ─────────────────────────────────────────────────────────────
  const toggleBookmark = (actId) => {
    setBookmarks(prev => { const n = new Set(prev); n.has(actId) ? n.delete(actId) : n.add(actId); return n; });
    toast.success("Bookmark updated!");
  };

  // ── Add to trip itinerary ─────────────────────────────────────────────────
  const handleOpenAddSelector = (activity) => { setSelectedAct(activity); setShowDaySelector(true); };
  const handleAddConfirm = async (dayNum) => {
    if (!selectedAct) return;
    try {
      setAdding(true);
      const token    = localStorage.getItem("token");
      const response = await fetch(getApiUrl("itinerary/create"), {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          trip:     id,
          day:      dayNum,
          time:     "10:00",
          title:    selectedAct.title || selectedAct.name,
          place:    selectedAct.location || trip?.destination,
          budget:   selectedAct.estimatedCost || selectedAct.price || 0,
          category: selectedAct.category || "Activity",
          note:     selectedAct.description || "",
        }),
      });
      const data = await response.json();
      if (data.success) { toast.success(`Added to Day ${dayNum} itinerary!`); setShowDaySelector(false); setSelectedAct(null); }
    } catch (_) { toast.error("Failed to add to itinerary"); } finally { setAdding(false); }
  };

  // ── Create Trip CTA from discovery card ──────────────────────────────────
  const handleCreateTrip = (place) => {
    const params = new URLSearchParams({ dest: place.name });
    if (place.lat && place.lng) { params.set("lat", place.lat); params.set("lng", place.lng); }
    navigate(`/create-trip?${params.toString()}`);
  };

  // ── Filters (existing logic preserved) ───────────────────────────────────
  const filteredCurated = useMemo(() => {
    return CURATED_ACTIVITIES.filter(a => {
      const s = inlineSearch.toLowerCase();
      return (!s || a.title.toLowerCase().includes(s) || a.location.toLowerCase().includes(s))
        && (category === "All" || a.tags.includes(category));
    });
  }, [inlineSearch, category]);

  const filteredAI = useMemo(() => {
    if (!recommendations?.length) return [];
    const s = inlineSearch.toLowerCase();
    return recommendations.filter(a => !s || (a.title || a.name || "").toLowerCase().includes(s) || (a.description || "").toLowerCase().includes(s));
  }, [recommendations, inlineSearch]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="px-4 pt-4 space-y-4">
          <div className="h-14 skeleton rounded-[18px]" />
          <div className="h-48 skeleton rounded-[24px]" />
          <div className="h-48 skeleton rounded-[24px]" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-6">

        {/* ── Trip info / Explore header ──────────────────────────────── */}
        {trip ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-2 px-4 py-3 mb-4 rounded-[18px] bg-white border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-[12px] bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase block">Activity Guide</p>
                <p className="text-xs font-bold text-slate-700 truncate">{trip.title} · {trip.destination}</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleToggleSaveDestination}
              className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <Heart size={14} className={savedPlaces.includes(trip.destination) ? "text-rose-500 fill-rose-500" : "text-slate-400"} />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 mb-4 rounded-[18px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
          >
            <div className="w-8 h-8 rounded-[12px] bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
              <Globe size={14} className="text-teal-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase block">AI Explore</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Type any city or destination to discover</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
              <Sparkles size={10} className="text-teal-500" />
              <span className="text-[9px] font-bold text-teal-600">AI Powered</span>
            </div>
          </motion.div>
        )}

        {/* ── Shared Search Bar ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3.5 mb-4 rounded-[18px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
          {discoverLoading ? (
            <Loader2 size={16} className="text-teal-400 flex-shrink-0 animate-spin" />
          ) : (
            <Search size={16} className="text-slate-400 flex-shrink-0" />
          )}
          <input
            type="text"
            value={id ? inlineSearch : discoverSearch}
            onChange={e => id ? handleInlineSearch(e.target.value) : handleDiscoverInput(e.target.value)}
            placeholder={id ? "Search activities, categories..." : "Search any city, country or destination..."}
            className="flex-1 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none"
            aria-label="Search destinations or activities"
          />
          {(discoverSearch || inlineSearch) && (
            <button
              onClick={() => { setDiscoverSearch(""); setInlineSearch(""); setDiscoverResults([]); setDiscoverQuery(""); if (abortRef.current) abortRef.current.abort(); }}
              className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* ── Tab Switcher (inside-trip mode only) ────────────────────── */}
        {trip && (
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-5 border border-slate-200 dark:border-slate-700">
            {[
              { key: "ai",       icon: Sparkles, label: "Gemini AI Suggestions", color: "text-teal-500" },
              { key: "discover", icon: Globe,    label: "Discover Destinations",  color: "text-blue-500" },
              { key: "curated",  icon: Compass,  label: "Curated Feed",           color: "text-blue-500" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                  activeTab === tab.key ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500"
                }`}
              >
                <tab.icon size={12} className={activeTab === tab.key ? tab.color : "text-slate-400"} />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            V1.7 — DISCOVER TAB (default when no trip)
        ══════════════════════════════════════════════════════════════ */}
        {(!id || activeTab === "discover") && (
          <div>
            {/* ── Skeletons or Loading States ── */}
            {(pubLoading || discoverLoading) && (
              <div className="space-y-4">
                {[0, 1, 2, 3].map(i => <SkeletonCard key={i} i={i} />)}
              </div>
            )}

            {/* ── Main View (No search active) ── */}
            {!(pubLoading || discoverLoading) && !discoverSearch && (
              <div className="space-y-6">
                {filteredPublishedTrips.length > 0 ? (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        Available Agency Group Trips
                      </h3>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-wider bg-teal-50/60 dark:bg-teal-900/20 px-2 py-0.5 rounded border border-teal-100/40 dark:border-teal-800/40">
                        {filteredPublishedTrips.length} active
                      </span>
                    </div>

                    {/* Chips bar (dynamic suggestions) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar">
                      {popularChips.map(s => (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => {
                            setDiscoverSearch(s);
                            setInlineSearch(s);
                            clearTimeout(debounceRef.current);
                            fetchDiscover(s);
                          }}
                          className="px-4 py-2 rounded-full text-xs font-bold border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:border-teal-400 hover:text-teal-500 transition-colors flex-shrink-0"
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>

                    {/* Cards grid */}
                    <div className="space-y-4">
                      {filteredPublishedTrips.map((trip) => (
                        <PublishedTripCard
                          key={trip._id}
                          trip={trip}
                          onClick={() => navigate(`/trips/${trip._id}`)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  /* Existing empty state if no trips exist */
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center text-center py-10 px-6"
                  >
                    <div className="w-20 h-20 rounded-[28px] flex items-center justify-center text-4xl mb-4"
                      style={{ background: "linear-gradient(135deg, rgba(20,184,181,0.12), rgba(13,148,136,0.08))" }}>
                      🌍
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-1">Discover Any Destination</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 max-w-[260px]">
                      Publish your first trip. Or search Salem, Tokyo, Paris, Bali to explore.
                    </p>

                    {/* Quick suggestions */}
                    <div className="flex flex-wrap justify-center gap-2 mb-2">
                      {popularChips.map(s => (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => { setDiscoverSearch(s); setInlineSearch(s); clearTimeout(debounceRef.current); fetchDiscover(s); }}
                          className="px-3.5 py-2 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-300 hover:border-teal-300 transition-colors"
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ── Search Active View ── */}
            {!(pubLoading || discoverLoading) && discoverSearch && (
              <div className="space-y-6">
                {/* 1. Show matching Group Trips first */}
                {filteredPublishedTrips.length > 0 && (
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Sparkles size={14} className="text-teal-500 animate-pulse" />
                      <span className="text-[13px] font-extrabold text-slate-800 dark:text-slate-200">
                        Matching Group Trips
                      </span>
                    </div>
                    <div className="space-y-4">
                      {filteredPublishedTrips.map((trip) => (
                        <PublishedTripCard
                          key={trip._id}
                          trip={trip}
                          onClick={() => navigate(`/trips/${trip._id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Show Discover results as secondary search discovery */}
                {discoverResults.length > 0 ? (
                  <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-teal-500" />
                        <span className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
                          Attractions in <span className="text-teal-600">{discoverQuery}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
                        <Zap size={10} className="text-teal-500" />
                        <span className="text-[9px] font-bold text-teal-600">{discoverResults.length} spots</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {discoverResults.map((place, i) => (
                        <DiscoverCard
                          key={place.placeId || place.name + i}
                          place={place}
                          index={i}
                          onCreateTrip={handleCreateTrip}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  /* If absolutely nothing matches both group trips and discover search */
                  filteredPublishedTrips.length === 0 && discoverQuery && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-14 gap-3 text-center"
                    >
                      <span className="text-5xl">🔍</span>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No results for "{discoverQuery}"</p>
                      <p className="text-xs text-slate-400">Try a different search query</p>
                    </motion.div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            EXISTING TAB: GEMINI AI (in-trip mode, preserved exactly)
        ══════════════════════════════════════════════════════════════ */}
        {trip && activeTab === "ai" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} className="text-teal-500" />
                AI Recommendations for {trip.destination}
              </span>
            </div>
            {loadingAI ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="premium-card p-5 space-y-3">
                    <div className="h-4 skeleton rounded w-1/3" />
                    <div className="h-12 skeleton rounded" />
                    <div className="h-8 skeleton rounded-full w-24" />
                  </div>
                ))}
              </div>
            ) : filteredAI.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
                <span className="text-4xl">💡</span>
                <p className="text-sm font-bold text-slate-600">No suggestions available</p>
                <p className="text-xs text-slate-400">Failed to load suggestions, or destination is unset.</p>
                <button onClick={() => fetchAIRecommendations(trip._id)}
                  className="px-4 py-2 text-xs font-bold text-white rounded-full mt-2"
                  style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}>
                  Retry Load
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAI.map((act, index) => (
                  <motion.div key={index}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                    className="premium-card p-5 border border-slate-100 relative group bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 block self-start mb-2 w-max">
                          {act.category || "Activity"}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800">{act.title || act.name}</h3>
                      </div>
                      <span className="text-xs font-extrabold text-teal-600">₹{Number(act.estimatedCost || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{act.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock size={11} /> {act.duration}
                      </span>
                      <motion.button whileTap={{ scale: 0.92 }}
                        onClick={() => handleOpenAddSelector(act)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-bold shadow-brand"
                        style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}>
                        <Plus size={14} /> Add to Itinerary
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            EXISTING TAB: CURATED PARAGLIDING FEED (preserved exactly)
        ══════════════════════════════════════════════════════════════ */}
        {(!id || activeTab === "curated") && id && (
          <div className="space-y-4">
            <div className="chip-row pb-2 -mx-4 px-4">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    category === cat ? "text-white shadow-brand border-transparent" : "bg-white text-slate-500 border border-slate-200"
                  }`}
                  style={category === cat ? { background: "linear-gradient(135deg,#14B8B5,#0D9488)" } : {}}>
                  {cat}
                </button>
              ))}
            </div>
            {filteredCurated.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No matching curated activities</div>
            ) : (
              <div className="space-y-4">
                {filteredCurated.map((act, index) => {
                  const isBookmarked = bookmarks.has(act.id);
                  return (
                    <motion.div key={act.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                      className="premium-card overflow-hidden bg-white shadow-sm"
                    >
                      <div className="relative h-44">
                        <img src={act.image} alt={act.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }} />
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-xs text-white text-[10px] font-bold">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" /> {act.rating} ({act.reviews})
                        </div>
                        <button onClick={() => toggleBookmark(act.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-md active:scale-90">
                          <Bookmark size={14} className={isBookmarked ? "text-teal-500 fill-teal-500" : "text-slate-400"} />
                        </button>
                        <div className="absolute bottom-3 left-3 flex gap-1.5">
                          {act.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-slate-800 leading-snug">{act.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> {act.location}</p>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{act.description}</p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                          <div>
                            <span className="text-sm font-extrabold text-slate-800">₹{act.price.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 line-through ml-2">₹{act.oldPrice.toLocaleString()}</span>
                          </div>
                          <motion.button whileTap={{ scale: 0.92 }}
                            onClick={() => handleOpenAddSelector(act)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-bold shadow-brand"
                            style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}>
                            <Plus size={14} /> Add to Itinerary
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Day Selector Bottom Sheet (preserved exactly) ───────────── */}
      <AnimatePresence>
        {showDaySelector && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDaySelector(false)}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[999] bg-white dark:bg-slate-900 rounded-t-[32px] p-6 max-h-[60vh] overflow-y-auto"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Add to Itinerary</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Select a day for: {selectedAct?.title || selectedAct?.name}</p>
                </div>
                <button onClick={() => setShowDaySelector(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <X size={16} className="text-slate-600" />
                </button>
              </div>
              <div className="space-y-2 mb-6">
                {Array.from({ length: daysCount }, (_, i) => i + 1).map(day => (
                  <button key={day} onClick={() => handleAddConfirm(day)} disabled={adding}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-teal-50/20 hover:border-teal-300 text-xs font-bold text-slate-700 active:scale-98 transition-all">
                    <span>Day {day} Schedule</span>
                    <ArrowRight size={14} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default Activities;