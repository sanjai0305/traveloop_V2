// src/pages/CreateTrip.jsx — 6-step wizard

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, CalendarDays, DollarSign, Heart, Sparkles,
  CheckCircle, ArrowLeft, ArrowRight, ChevronDown, Plane, X
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { useTheme } from "../context/ThemeContext";

// ─── DESTINATIONS ─────────────────────────────────────────────
const POPULAR_DESTINATIONS = [
  { name: "Bali, Indonesia",     emoji: "🌴", tag: "Trending"  },
  { name: "Paris, France",       emoji: "🗼", tag: "Romance"   },
  { name: "Santorini, Greece",   emoji: "🏛️", tag: "Luxury"    },
  { name: "Maldives",            emoji: "🐚", tag: "Beach"     },
  { name: "Tokyo, Japan",        emoji: "🌸", tag: "Culture"   },
  { name: "Goa, India",          emoji: "🏖️", tag: "Budget"    },
  { name: "Switzerland",         emoji: "🏔️", tag: "Adventure" },
  { name: "Dubai, UAE",          emoji: "🌆", tag: "Luxury"    },
  { name: "Manali, India",       emoji: "⛄", tag: "Hills"     },
  { name: "Pokhara, Nepal",      emoji: "🏔️", tag: "Trek"      },
  { name: "Singapore",           emoji: "🦁", tag: "City"      },
  { name: "Phuket, Thailand",    emoji: "🐠", tag: "Beach"     },
];

const TRAVEL_STYLES = [
  { id: "adventure",   emoji: "🪂", label: "Adventure",    desc: "Thrills & outdoor activities"    },
  { id: "relax",       emoji: "🧘", label: "Relaxation",   desc: "Beaches, spas & slow travel"     },
  { id: "culture",     emoji: "🏛️", label: "Cultural",     desc: "History, art & local life"       },
  { id: "food",        emoji: "🍜", label: "Food & Drink", desc: "Cuisine, markets & nightlife"    },
  { id: "romance",     emoji: "💑", label: "Romantic",     desc: "Sunset dinners & getaways"       },
  { id: "family",      emoji: "👨‍👩‍👧", label: "Family",      desc: "Kid-friendly & safe itineraries"},
  { id: "solo",        emoji: "🧍", label: "Solo",         desc: "Free-spirited self-discovery"    },
  { id: "friends",     emoji: "👯", label: "Friends",      desc: "Group fun & shared memories"    },
  { id: "luxury",      emoji: "💎", label: "Luxury",       desc: "Premium stays & fine dining"    },
  { id: "backpacking", emoji: "🎒", label: "Backpacking",  desc: "Budget travel & hostel vibes"   },
  { id: "business",    emoji: "💼", label: "Business",     desc: "Work trips & corporate travel"  },
  { id: "roadtrip",    emoji: "🚗", label: "Road Trip",    desc: "Highways, pit stops & freedom"  },
];

const BUDGET_PRESETS = [
  { label: "Budget", range: "< ₹20K",    value: 15000,  color: "#10B981" },
  { label: "Comfort",range: "₹20–50K",   value: 35000,  color: "#3B82F6" },
  { label: "Premium",range: "₹50–1L",    value: 75000,  color: "#8B5CF6" },
  { label: "Luxury", range: "> ₹1L",     value: 150000, color: "#F59E0B" },
];

const AI_SUGGESTIONS = [
  "📍 Visit Uluwatu Temple at sunset",
  "🏄 Try surfing at Kuta Beach",
  "🌺 Explore Ubud rice terraces",
  "🐬 Snorkeling at Crystal Bay",
  "🛵 Rent a scooter & explore",
  "🍛 Try babi guling at local warungs",
];

const STEPS = [
  { id: 1, label: "Destination", icon: MapPin      },
  { id: 2, label: "Dates",       icon: CalendarDays },
  { id: 3, label: "Budget",      icon: DollarSign   },
  { id: 4, label: "Style",       icon: Heart        },
  { id: 5, label: "AI Tips",     icon: Sparkles     },
  { id: 6, label: "Create",      icon: CheckCircle  },
];

const slideVariants = {
  enter: dir => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  dir => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
};

const getSuggestionsForDestination = (dest = "") => {
  const normalized = dest.toLowerCase();
  if (normalized.includes("chennai")) {
    return [
      "📍 Take a morning walk at Marina Beach",
      "🏛️ Explore the ancient Shore Temple in Mahabalipuram",
      "☕ Sip traditional South Indian filter coffee",
      "🛍️ Shop for silk sarees at T. Nagar",
      "🍛 Savour a delicious ghee roast at Murugan Idli Shop",
      "⛪ Visit Saint Thomas Cathedral Basilica",
    ];
  }
  if (normalized.includes("paris")) {
    return [
      "🗼 Climb the Eiffel Tower at sunset",
      "🎨 Visit the Louvre Museum & see Mona Lisa",
      "⛵ Take a romantic cruise on the Seine River",
      "🥐 Enjoy fresh croissants at a Montmartre café",
      "🏰 Take a day trip to the Palace of Versailles",
      "🛍️ Stroll down the famous Champs-Élysées",
    ];
  }
  if (normalized.includes("tokyo")) {
    return [
      "🌸 Stroll through Shinjuku Gyoen National Garden",
      "🏮 Visit the historic Senso-ji Temple in Asakusa",
      "🚦 Walk across the famous Shibuya Crossing",
      "🍣 Enjoy fresh sushi at Toyosu Market",
      "🗼 View the city from Tokyo Skytree or Tokyo Tower",
      "🛍️ Explore anime & electronics in Akihabara",
    ];
  }
  if (normalized.includes("goa")) {
    return [
      "🏖️ Relax at Baga or Calangute Beach",
      "⛪ Visit Basilica of Bom Jesus in Old Goa",
      "🌶️ Tour a local spice plantation in Ponda",
      "⛵ Try water sports like parasailing or jet skiing",
      "🐟 Enjoy fresh seafood at beach shacks",
      "🏰 Explore Chapora Fort at sunset",
    ];
  }
  if (normalized.includes("switzerland")) {
    return [
      "🏔️ Ride the scenic Jungfrau Railway",
      "⛵ Cruise on beautiful Lake Lucerne",
      "🍫 Visit a traditional Swiss chocolate factory",
      "🌲 Hike the panoramic trails in Lauterbrunnen",
      "📸 Photo shoot at the iconic Matterhorn in Zermatt",
      "🧀 Enjoy a classic Swiss cheese fondue dinner",
    ];
  }
  if (normalized.includes("maldives")) {
    return [
      "🐚 Stay in an overwater villa",
      "🐬 Go dolphin watching during sunset",
      "🐠 Snorkel or scuba dive in crystal clear reefs",
      "🏖️ Have a private dinner on a sandbank",
      "💆 Pamper yourself with a tropical spa treatment",
      "🛶 Try glass-bottom kayaking over lagoons",
    ];
  }
  if (normalized.includes("santorini")) {
    return [
      "🌅 Watch the famous sunset from Oia",
      "⛪ Walk the scenic trail from Fira to Oia",
      "🍷 Tour local volcanic vineyards and wine tasting",
      "🏖️ Visit the unique Red Beach and Black Sand Beach",
      "⛵ Take a catamaran cruise around the caldera",
      "🍲 Try local specialties like tomato fritters",
    ];
  }
  if (normalized.includes("dubai")) {
    return [
      "🌆 Visit the observation deck of Burj Khalifa",
      "🛍️ Shop at Dubai Mall & watch the fountain show",
      "🐪 Go on a desert safari with dune bashing",
      "⛵ Ride a traditional abra across Dubai Creek",
      "🌴 Walk around Palm Jumeirah or visit Atlantis",
      "❄️ Experience indoor skiing at Ski Dubai",
    ];
  }
  if (normalized.includes("manali")) {
    return [
      "🏔️ Visit Solang Valley for paragliding & zorbing",
      "🪵 Explore the ancient wood-carved Hadimba Temple",
      "🚙 Drive through the spectacular Atal Tunnel",
      "🛍️ Walk and shop along Mall Road",
      "♨️ Soak in the hot sulfur springs of Vashisht",
      "🥾 Hike to Jogini Waterfall",
    ];
  }
  if (normalized.includes("singapore")) {
    return [
      "🦁 Visit Gardens by the Bay & see Supertree Grove",
      "🎢 Spend a day at Universal Studios Singapore",
      "🛍️ Shop on Orchard Road",
      "🍛 Try Hainanese chicken rice at Maxwell Food Centre",
      "🦁 Photo at Merlion Park",
      "🌃 Walk along Marina Bay Sands boardwalk at night",
    ];
  }
  if (normalized.includes("phuket")) {
    return [
      "🐚 Take a boat tour to Phi Phi Islands",
      "🏖️ Chill at Patong, Kata, or Karon beach",
      "🛕 Visit the iconic Big Buddha atop Nakkerd Hill",
      "🛍️ Walk through Phuket Old Town weekend market",
      "🐘 Visit an ethical elephant sanctuary",
      "🍛 Enjoy local Tom Yum Goong & street pad thai",
    ];
  }
  // Default fallback (Bali)
  return [
    "📍 Visit Uluwatu Temple at sunset",
    "🏄 Try surfing at Kuta Beach",
    "🌺 Explore Ubud rice terraces",
    "🐬 Snorkeling at Crystal Bay",
    "🛵 Rent a scooter & explore",
    "🍛 Try local specialties at warungs",
  ];
};

const CreateTrip = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destParam = searchParams.get("dest") || "";
  const [step,    setStep]    = useState(1);
  const [dir,     setDir]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  // FIX 2: Custom travel style
  const [customStyle, setCustomStyle] = useState("");

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(getApiUrl("profile/saved-destinations"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSavedPlaces(data.savedDestinations || []);
        }
      } catch (err) {
        console.error("Failed to load saved places in CreateTrip:", err);
      }
    };
    fetchSaved();
  }, []);

  const toggleSaveDest = async (destName, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const isSaved = savedPlaces.includes(destName);
      let res;
      if (isSaved) {
        res = await fetch(getApiUrl(`profile/saved-destinations/${encodeURIComponent(destName)}`), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await fetch(getApiUrl("profile/saved-destinations"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ destination: destName })
        });
      }
      const data = await res.json();
      if (data.success) {
        setSavedPlaces(data.savedDestinations || []);
      }
    } catch (err) {
      console.error("Error toggling saved destination:", err);
    }
  };

  const [form, setForm] = useState({
    destination: destParam,
    startDate:   "",
    endDate:     "",
    budget:      35000,
    style:       "",
    tripName:    "",
    destinationName: "",
    placeId:     "",
    formattedAddress: "",
    country:     "",
    state:       "",
    latitude:    null,
    longitude:   null,
  });

  const debounceTimer = useRef(null);
  const autocompleteCache = useRef({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleDestinationChange = (val) => {
    setForm(f => ({
      ...f,
      destination: val,
      destinationName: "",
      placeId: "",
      formattedAddress: "",
      country: "",
      state: "",
      latitude: null,
      longitude: null,
    }));

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (val.trim().length <= 1) {
      setSuggestions([]);
      return;
    }

    const cacheKey = val.trim().toLowerCase();
    if (autocompleteCache.current[cacheKey]) {
      setSuggestions(autocompleteCache.current[cacheKey]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`trips/destinations/autocomplete?input=${encodeURIComponent(val)}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const preds = data.predictions || [];
          autocompleteCache.current[cacheKey] = preds;
          setSuggestions(preds);
        }
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    }, 300);
  };

  const handleSelectDestination = async (pred) => {
    setSuggestions([]);
    setForm(f => ({
      ...f,
      destination: pred.description,
      placeId: pred.placeId,
    }));

    if (!pred.placeId) return;

    try {
      setLoadingDetails(true);
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/destinations/details?placeId=${encodeURIComponent(pred.placeId)}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setForm(f => ({
          ...f,
          destination: data.formattedAddress,
          destinationName: data.destinationName,
          placeId: data.placeId,
          formattedAddress: data.formattedAddress,
          country: data.country,
          state: data.state,
          latitude: data.latitude,
          longitude: data.longitude,
        }));
      }
    } catch (err) {
      console.error("Error loading place details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const go = (next) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const validate = () => {
    if (step === 1 && !form.destination) { setErrors({ destination: "Pick a destination" }); return false; }
    if (step === 2 && !form.startDate)   { setErrors({ startDate: "Select start date" }); return false; }
    if (step === 2 && !form.endDate)     { setErrors({ endDate: "Select end date" }); return false; }
    if (step === 2 && new Date(form.endDate) < new Date(form.startDate)) {
      setErrors({ endDate: "End date cannot be before start date" });
      return false;
    }
    // FIX 1: Allow any positive budget — remove the ₹5000 lower bound restriction
    if (step === 3 && (!form.budget || Number(form.budget) <= 0)) {
      setErrors({ budget: "Please enter a valid budget amount" });
      return false;
    }
    if (step === 3 && Number(form.budget) > 10000000) {
      setErrors({ budget: "Budget cannot exceed ₹1,00,00,000" });
      return false;
    }
    // FIX 2: Accept predefined style OR custom style text
    if (step === 4 && !form.style && !customStyle.trim()) {
      setErrors({ style: "Choose your travel style or enter a custom one" });
      return false;
    }
    setErrors({});
    return true;
  };

  const next = () => { if (validate()) go(Math.min(6, step + 1)); };
  const prev = () => go(Math.max(1, step - 1));

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const name  = form.tripName || `${form.destination.split(",")[0]} Trip`;
      const res   = await fetch(getApiUrl("trips/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title:       name,
          destination: form.destination,
          startDate:   form.startDate,
          endDate:     form.endDate,
          budget:      form.budget,
          travelers:   1,
          description: `Travel style: ${form.style || "flexible"}`,
          destinationName: form.destinationName,
          placeId:     form.placeId,
          formattedAddress: form.formattedAddress,
          country:     form.country,
          state:       form.state,
          latitude:    form.latitude,
          longitude:   form.longitude,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Error creating trip"); return; }
      navigate("/my-trips");
    } catch (_) {
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  const { isDark } = useTheme();
  const bg = isDark ? "#0B0F14" : "#F8FAFC";
  const cardBg = isDark ? "#121821" : "#FFFFFF";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#475569";
  const inputBg = isDark ? "#1A2332" : "#F8FAFC";
  const borderColor = isDark ? "#1E293B" : "#E2E8F0";

  return (
    // Wizard wrapper — NO BottomNavBar, NO MobileAppBar
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Wizard Header */}
      <div
        className="sticky top-0 z-50 border-b"
        style={{
          background: isDark ? "rgba(18,24,33,0.95)" : "rgba(248,250,252,0.95)",
          borderColor,
          paddingTop: "max(env(safe-area-inset-top), 0px)"
        }}
      >
        <div className="flex items-center gap-3 px-4 h-[60px] max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => step > 1 ? prev() : navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? "#1A2332" : "#F1F5F9" }}
          >
            <ArrowLeft size={18} style={{ color: textPrimary }} />
          </motion.button>
          <div className="flex-1">
            <div className="text-xs font-semibold mb-0.5" style={{ color: textMuted }}>
              Step {step} of {STEPS.length}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "#1E293B" : "#E2E8F0" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #14B8B5, #0D9488)" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
          <span className="text-xs font-bold text-teal-500">{Math.round(progress)}%</span>
        </div>
      </div>

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
      >
        <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">

        {/* ── STEP CONTENT ── */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >

              {/* STEP 1 — DESTINATION */}
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-extrabold mb-1" style={{ color: textPrimary }}>Where to? 🌍</h2>
                  <p className="text-sm mb-5" style={{ color: textMuted }}>Pick your dream destination</p>

                  <div className="relative mb-5">
                    <div
                      className="flex items-center gap-3 px-4 py-3.5 rounded-[18px] border shadow-sm transition-all"
                      style={{ background: cardBg, borderColor }}
                    >
                      {loadingDetails ? (
                        <div className="w-[18px] h-[18px] border-2 border-teal-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <MapPin size={18} className="text-teal-500 flex-shrink-0" />
                      )}
                      <input
                        type="text"
                        value={form.destination}
                        onChange={e => handleDestinationChange(e.target.value)}
                        placeholder="Type a destination..."
                        className="flex-1 text-sm font-medium placeholder:text-slate-400 outline-none bg-transparent"
                        style={{ color: textPrimary }}
                      />
                    </div>
                    {suggestions.length > 0 && (
                      <div
                        className="absolute z-[99] left-0 right-0 border rounded-[18px] shadow-lg mt-1.5 divide-y max-h-56 overflow-y-auto"
                        style={{ background: cardBg, borderColor }}
                      >
                        {suggestions.map((pred, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectDestination(pred)}
                            className="px-4 py-3 text-xs font-bold cursor-pointer flex items-center gap-2 active:opacity-70"
                            style={{ color: textPrimary }}
                          >
                            📍 <span>{pred.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.destination && <p className="text-red-500 text-xs mb-3">{errors.destination}</p>}

                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: textMuted }}>Popular</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {POPULAR_DESTINATIONS.map(d => (
                      <motion.button
                        key={d.name}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setForm(f => ({
                          ...f,
                          destination: d.name,
                          destinationName: d.name,
                          placeId: "",
                          formattedAddress: "",
                          country: "",
                          state: "",
                          latitude: null,
                          longitude: null,
                        }))}
                        className={`flex items-center gap-3 p-3.5 rounded-[18px] border-2 text-left transition-all relative ${
                          form.destination === d.name
                            ? "border-teal-400"
                            : "border-transparent shadow-xs"
                        }`}
                        style={{
                          background: form.destination === d.name
                            ? "rgba(20,184,181,0.08)"
                            : cardBg
                        }}
                      >
                        <span className="text-2xl flex-shrink-0">{d.emoji}</span>
                        <div className="min-w-0 pr-4">
                          <p className="text-sm font-bold truncate leading-tight" style={{ color: textPrimary }}>{d.name.split(",")[0]}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: textMuted }}>{d.tag}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleSaveDest(d.name, e)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center active:scale-90"
                          style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.75)" }}
                        >
                          <Heart
                            size={11}
                            className={savedPlaces.includes(d.name) ? "text-rose-500 fill-rose-500" : "text-slate-400"}
                          />
                        </button>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 — DATES */}
              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 mb-1">When? 📅</h2>
                  <p className="text-slate-400 text-sm mb-6">Choose your travel dates</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2">Start Date</label>
                      <div className="flex items-center gap-3 px-4 py-4 rounded-[18px] bg-white border-2 border-slate-200 focus-within:border-teal-400 transition-all shadow-xs">
                        <CalendarDays size={20} className="text-teal-500 flex-shrink-0" />
                        <input
                          type="date"
                          value={form.startDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                          className="flex-1 text-slate-700 text-sm font-semibold outline-none bg-transparent"
                        />
                      </div>
                      {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2">End Date</label>
                      <div className="flex items-center gap-3 px-4 py-4 rounded-[18px] bg-white border-2 border-slate-200 focus-within:border-teal-400 transition-all shadow-xs">
                        <CalendarDays size={20} className="text-violet-500 flex-shrink-0" />
                        <input
                          type="date"
                          value={form.endDate}
                          min={form.startDate || new Date().toISOString().split("T")[0]}
                          onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                          className="flex-1 text-slate-700 text-sm font-semibold outline-none bg-transparent"
                        />
                      </div>
                      {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                    </div>

                    {form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate) && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-[18px] flex items-center gap-3"
                        style={{ background: "linear-gradient(135deg, rgba(20,184,181,0.08), rgba(13,148,136,0.05))", border: "1px solid rgba(20,184,181,0.2)" }}
                      >
                        <span className="text-3xl">🗓️</span>
                        <div>
                          <p className="text-sm font-bold text-teal-700">
                            {Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000)) === 1
                              ? "1 Day Trip"
                              : `${Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000))} days adventure!`}
                          </p>
                          <p className="text-xs text-teal-600">Perfect duration for exploring {form.destination?.split(",")[0] || "your destination"}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3 — BUDGET */}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-extrabold mb-1" style={{ color: textPrimary }}>Budget 💰</h2>
                  <p className="text-sm mb-6" style={{ color: textMuted }}>How much are you planning to spend?</p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {BUDGET_PRESETS.map(b => (
                      <motion.button
                        key={b.label}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setForm(f => ({ ...f, budget: b.value }))}
                        className="p-4 rounded-[20px] border-2 text-left transition-all relative"
                        style={form.budget === b.value
                          ? { background: `${b.color}15`, borderColor: `${b.color}60` }
                          : { background: cardBg, borderColor: "transparent", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }
                        }
                      >
                        {form.budget === b.value && (
                          <div
                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold"
                            style={{ background: b.color }}
                          >
                            ✓
                          </div>
                        )}
                        <div
                          className="w-10 h-10 rounded-[14px] flex items-center justify-center mb-2 text-xl"
                          style={{ background: `${b.color}18` }}
                        >
                          💰
                        </div>
                        <p className="text-sm font-extrabold" style={{ color: textPrimary }}>{b.label}</p>
                        <p className="text-xs font-semibold" style={{ color: b.color }}>{b.range}</p>
                      </motion.button>
                    ))}
                  </div>

                  {/* FIX 1: Custom Budget — slider + text input synced, no min restriction */}
                  <div
                    className="p-4 rounded-[20px] border"
                    style={{ background: cardBg, borderColor }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-bold" style={{ color: textPrimary }}>Custom Amount</label>
                      <div
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border"
                        style={{ background: inputBg, borderColor }}
                      >
                        <span className="text-sm font-bold text-teal-500">₹</span>
                        <input
                          type="number"
                          min={1}
                          step={1000}
                          value={form.budget}
                          onChange={e => {
                            const val = e.target.value;
                            setForm(f => ({ ...f, budget: val === "" ? "" : parseInt(val) || 0 }));
                          }}
                          className="w-28 text-sm font-extrabold text-teal-600 bg-transparent outline-none text-right"
                          placeholder="Enter amount"
                        />
                      </div>
                    </div>

                    {/* FIX 1: Quick-pick chips */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {[
                        { label: "₹5K",  value: 5000   },
                        { label: "₹10K", value: 10000  },
                        { label: "₹25K", value: 25000  },
                        { label: "₹1L",  value: 100000 },
                      ].map(chip => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, budget: chip.value }))}
                          className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                          style={{
                            background: form.budget === chip.value ? "rgba(20,184,181,0.12)" : inputBg,
                            borderColor: form.budget === chip.value ? "#14B8B5" : borderColor,
                            color: form.budget === chip.value ? "#14B8B5" : textMuted,
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="range"
                      min={1000}
                      max={500000}
                      step={1000}
                      value={Math.min(500000, Math.max(1000, Number(form.budget) || 1000))}
                      onChange={e => setForm(f => ({ ...f, budget: parseInt(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: "#14B8B5" }}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs" style={{ color: textMuted }}>₹1K</span>
                      <span className="text-xs" style={{ color: textMuted }}>₹5L</span>
                    </div>
                    {errors.budget && (
                      <p className="text-xs text-red-500 font-semibold mt-2">
                        {errors.budget}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4 — TRAVEL STYLE */}
              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-extrabold mb-1" style={{ color: textPrimary }}>Your Style ✨</h2>
                  <p className="text-sm mb-4" style={{ color: textMuted }}>How do you like to travel?</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {TRAVEL_STYLES.map(s => {
                      const selected = form.style === s.id;
                      return (
                        <motion.button
                          key={s.id}
                          whileTap={{ scale: 0.92 }}
                          animate={{ scale: selected ? 1.02 : 1 }}
                          onClick={() => {
                            setForm(f => ({ ...f, style: s.id }));
                            setCustomStyle(""); // clear custom when picking a card
                          }}
                          className="p-4 rounded-[20px] border-2 text-left transition-all relative overflow-hidden"
                          style={{
                            background: selected ? "rgba(20,184,181,0.10)" : cardBg,
                            borderColor: selected ? "#14B8B5" : borderColor,
                            boxShadow: selected ? "0 0 0 3px rgba(20,184,181,0.15)" : isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                          }}
                        >
                          {/* Selected badge */}
                          {selected && (
                            <div
                              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[9px] font-extrabold"
                              style={{ background: "#14B8B5" }}
                            >
                              ✓ Selected
                            </div>
                          )}
                          <span className="text-3xl">{s.emoji}</span>
                          <p className="text-sm font-extrabold mt-2" style={{ color: textPrimary }}>{s.label}</p>
                          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: textMuted }}>{s.desc}</p>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* FIX 2: Custom travel style input */}
                  <div className="p-4 rounded-[20px] border" style={{ background: cardBg, borderColor }}>
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: textMuted }}>
                      🎨 Custom Travel Style
                    </label>
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-[14px] border-2 transition-all"
                      style={{
                        background: inputBg,
                        borderColor: customStyle ? "#14B8B5" : borderColor,
                      }}
                    >
                      <input
                        type="text"
                        value={customStyle}
                        onChange={e => {
                          const val = e.target.value;
                          setCustomStyle(val);
                          if (val.trim()) {
                            // Clear predefined style when user types custom
                            setForm(f => ({ ...f, style: val.trim() }));
                          } else {
                            setForm(f => ({ ...f, style: "" }));
                          }
                        }}
                        placeholder="e.g. Photography, Food Tour, Temple Tour, Bike Trip..."
                        className="flex-1 text-sm font-medium placeholder:text-slate-400 outline-none bg-transparent"
                        style={{ color: textPrimary }}
                        maxLength={60}
                      />
                      {customStyle && (
                        <button
                          type="button"
                          onClick={() => { setCustomStyle(""); setForm(f => ({ ...f, style: "" })); }}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] mt-1.5" style={{ color: textMuted }}>
                      Describe your unique trip style — the AI will personalize suggestions.
                    </p>
                  </div>

                  {errors.style && (
                    <p className="text-xs text-red-500 font-bold mt-3">
                      {errors.style}
                    </p>
                  )}
                </div>
              )}

              {/* STEP 5 — AI SUGGESTIONS */}
              {step === 5 && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={20} className="text-teal-500" />
                    <h2 className="text-2xl font-extrabold text-slate-800">AI Suggestions</h2>
                  </div>
                  <p className="text-slate-400 text-sm mb-5">
                    Traveloop AI curated these ideas for{" "}
                    <span className="font-bold text-teal-600">{form.destination?.split(",")[0] || "your trip"}</span>
                  </p>

                  <div className="space-y-3">
                    {getSuggestionsForDestination(form.destination).map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 p-4 rounded-[18px] bg-white border border-slate-100 shadow-xs"
                      >
                        <div
                          className="w-8 h-8 rounded-[12px] flex items-center justify-center flex-shrink-0 text-sm"
                          style={{ background: "rgba(20,184,181,0.1)" }}
                        >
                          {i + 1}
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{s}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 6 — REVIEW & CREATE */}
              {step === 6 && (
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 mb-1">All set! 🎉</h2>
                  <p className="text-slate-400 text-sm mb-5">Review your trip details before creating</p>

                  <div className="premium-card p-5 mb-5 space-y-4">
                    {[
                      { emoji: "🌍", label: "Destination", value: form.destination || "Not set" },
                      {
                        emoji: "📅", label: "Dates",
                        value: form.startDate && form.endDate
                          ? `${new Date(form.startDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })} → ${new Date(form.endDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}`
                          : "Not set"
                      },
                      { emoji: "💰", label: "Budget", value: `₹${Number(form.budget || 0).toLocaleString()}` },
                      {
                        emoji: "✨", label: "Travel Style",
                        value: customStyle.trim()
                          ? customStyle.trim()
                          : (TRAVEL_STYLES.find(s => s.id === form.style)?.label || "Flexible")
                      },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xl">{item.emoji}</span>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                          <p className="text-sm font-bold text-slate-800">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-bold text-slate-600 mb-2">Trip Name (optional)</label>
                    <div className="flex items-center gap-3 px-4 py-3.5 rounded-[18px] bg-white border-2 border-slate-200 focus-within:border-teal-400 transition-all shadow-xs">
                      <Plane size={18} className="text-teal-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={form.tripName}
                        onChange={e => setForm(f => ({ ...f, tripName: e.target.value }))}
                        placeholder={`${form.destination?.split(",")[0] || "My"} Trip`}
                        className="flex-1 text-slate-700 text-sm font-semibold placeholder:text-slate-400 outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-4 rounded-full text-white font-bold text-base shadow-brand disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
                  >
                    {loading ? "Creating your trip..." : "🚀 Create My Trip"}
                  </motion.button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── NAVIGATION ── */}
        {step < 6 && (
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={prev}
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ background: isDark ? "#1A2332" : "#F1F5F9", color: textPrimary }}
              >
                <ArrowLeft size={20} />
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full text-white font-bold shadow-brand"
              style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
            >
              Continue <ArrowRight size={18} />
            </motion.button>
          </div>
        )}
      </div>
      </main>
    </div>
  );
};

export default CreateTrip;