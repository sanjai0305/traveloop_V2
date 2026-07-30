// src/pages/CreateTrip.jsx — Desktop-First 6-Step Travel Booking Wizard

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, CalendarDays, DollarSign, Heart, Sparkles,
  CheckCircle, ArrowLeft, ArrowRight, ChevronDown, Plane, X,
  Search, Star, Mic, Compass, Users, Check, Clock, ShieldCheck, Info
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import ResponsiveNavbar from "../components/common/ResponsiveNavbar";
import ResponsiveFooter from "../components/common/ResponsiveFooter";

// ─── RICH DESTINATIONS METADATA ────────────────────────────────
const POPULAR_DESTINATIONS = [
  {
    name: "Bali, Indonesia",
    country: "Indonesia",
    emoji: "🌴",
    tag: "Trending",
    rating: "4.9",
    weather: "28°C Sunny",
    avgCost: "₹35,000",
    desc: "Tropical paradise with emerald rice terraces, vibrant culture, and pristine beaches.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Paris, France",
    country: "France",
    emoji: "🗼",
    tag: "Romance",
    rating: "4.8",
    weather: "19°C Pleasant",
    avgCost: "₹75,000",
    desc: "City of lights, iconic architecture, world-class art, and exquisite gastronomy.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Santorini, Greece",
    country: "Greece",
    emoji: "🏛️",
    tag: "Luxury",
    rating: "4.9",
    weather: "26°C Breezy",
    avgCost: "₹85,000",
    desc: "Breathtaking white-washed caldera views, turquoise waters, and stunning sunsets.",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Maldives",
    country: "Maldives",
    emoji: "🐚",
    tag: "Beach",
    rating: "5.0",
    weather: "30°C Warm",
    avgCost: "₹1,20,000",
    desc: "Overwater bungalows, vibrant marine reefs, and crystal-clear private lagoons.",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Tokyo, Japan",
    country: "Japan",
    emoji: "🌸",
    tag: "Culture",
    rating: "4.9",
    weather: "22°C Clear",
    avgCost: "₹90,000",
    desc: "Futuristic neon skyscrapers alongside ancient shrines, culinary excellence, and cherry blossoms.",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Goa, India",
    country: "India",
    emoji: "🏖️",
    tag: "Budget",
    rating: "4.7",
    weather: "31°C Tropical",
    avgCost: "₹18,000",
    desc: "Golden sands, vibrant shacks, heritage Portuguese churches, and thrilling watersports.",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Switzerland",
    country: "Switzerland",
    emoji: "🏔️",
    tag: "Adventure",
    rating: "4.9",
    weather: "16°C Cool",
    avgCost: "₹1,10,000",
    desc: "Majestic Alpine peaks, scenic train journeys, alpine lakes, and quaint villages.",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Dubai, UAE",
    country: "UAE",
    emoji: "🌆",
    tag: "Luxury",
    rating: "4.8",
    weather: "34°C Sunny",
    avgCost: "₹65,000",
    desc: "World-record architecture, desert safaris, mega shopping malls, and futuristic luxury.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Manali, India",
    country: "India",
    emoji: "⛄",
    tag: "Hills",
    rating: "4.6",
    weather: "15°C Chilly",
    avgCost: "₹22,000",
    desc: "Snow-capped Himalayan peaks, pine valleys, Atal tunnel drives, and adventure sports.",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Pokhara, Nepal",
    country: "Nepal",
    emoji: "🏔️",
    tag: "Trek",
    rating: "4.7",
    weather: "20°C Mild",
    avgCost: "₹15,000",
    desc: "Gateway to Annapurna circuit, serene Fewa lake reflection, and mountain tranquility.",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Singapore",
    country: "Singapore",
    emoji: "🦁",
    tag: "City",
    rating: "4.8",
    weather: "29°C Humid",
    avgCost: "₹55,000",
    desc: "Futuristic supertrees, Marina Bay skyline, lush botanical havens, and street food markets.",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Phuket, Thailand",
    country: "Thailand",
    emoji: "🐠",
    tag: "Beach",
    rating: "4.7",
    weather: "30°C Sunny",
    avgCost: "₹30,000",
    desc: "Emerald waters of Phi Phi islands, limestone cliffs, night markets, and island hopping.",
    image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80"
  }
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

const STEPS = [
  { id: 1, label: "Destination", icon: MapPin      },
  { id: 2, label: "Dates",       icon: CalendarDays },
  { id: 3, label: "Budget",      icon: DollarSign   },
  { id: 4, label: "Travel Style",icon: Heart        },
  { id: 5, label: "AI Tips",     icon: Sparkles     },
  { id: 6, label: "Review",      icon: CheckCircle  },
];

const slideVariants = {
  enter: dir => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  dir => ({ x: dir < 0 ? 50 : -50, opacity: 0 }),
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

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [customStyle, setCustomStyle] = useState("");

  const [form, setForm] = useState({
    destination: destParam,
    startDate: "",
    endDate: "",
    budget: 35000,
    style: "",
    tripName: "",
    destinationName: "",
    placeId: "",
    formattedAddress: "",
    country: "",
    state: "",
    latitude: null,
    longitude: null,
  });

  const debounceTimer = useRef(null);
  const autocompleteCache = useRef({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { isDark } = useTheme();

  // Load saved places on mount
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
    if (e) e.stopPropagation();
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

  const go = (nextStep) => {
    setDir(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const validate = () => {
    if (step === 1 && !form.destination) { setErrors({ destination: "Pick or type a destination" }); return false; }
    if (step === 2 && !form.startDate)   { setErrors({ startDate: "Select start date" }); return false; }
    if (step === 2 && !form.endDate)     { setErrors({ endDate: "Select end date" }); return false; }
    if (step === 2 && new Date(form.endDate) < new Date(form.startDate)) {
      setErrors({ endDate: "End date cannot be before start date" });
      return false;
    }
    if (step === 3 && (!form.budget || Number(form.budget) <= 0)) {
      setErrors({ budget: "Please enter a valid budget amount" });
      return false;
    }
    if (step === 3 && Number(form.budget) > 10000000) {
      setErrors({ budget: "Budget cannot exceed ₹1,00,00,000" });
      return false;
    }
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

  // Helper calculations
  const progressPercent = Math.round(((step - 1) / (STEPS.length - 1)) * 100);
  const tripDays = form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate)
    ? Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000))
    : 0;

  const currentDestObj = POPULAR_DESTINATIONS.find(
    d => d.name.toLowerCase() === form.destination.toLowerCase() || d.name.split(",")[0].toLowerCase() === form.destination.toLowerCase()
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* ── 1. STICKY RESPONSIVE NAVBAR ────────────────────────── */}
      <ResponsiveNavbar />

      {/* ── 2. HERO BANNER & FLOATING SEARCH (Step 1 focus) ────── */}
      <div className="relative bg-slate-900 text-white overflow-hidden shadow-xl border-b border-slate-800">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay scale-105 transition-transform duration-1000" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80')` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-900" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3 max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Sparkles size={14} className="animate-pulse" /> AI-Powered Travel Planner
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-poppins">
              Create Your Perfect Journey
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl mx-auto">
              Plan custom itineraries, optimize travel budgets, and discover handpicked experiences in minutes.
            </p>
          </motion.div>

          {/* Floating Search Bar Section */}
          <div className="mt-8 max-w-2xl mx-auto relative z-20">
            <div className="relative flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-2xl rounded-full p-2 pl-6 transition-all duration-300 focus-within:ring-4 focus-within:ring-teal-500/20">
              {loadingDetails ? (
                <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mr-3" />
              ) : (
                <Search size={20} className="text-teal-500 flex-shrink-0 mr-3" />
              )}

              <input
                type="text"
                value={form.destination}
                onChange={e => handleDestinationChange(e.target.value)}
                placeholder="Where do you want to go? (e.g. Bali, Paris, Tokyo...)"
                className="flex-1 bg-transparent text-slate-900 dark:text-white font-semibold text-sm sm:text-base outline-none placeholder:text-slate-400"
              />

              {form.destination && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, destination: "", placeId: "" }))}
                  className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white mr-2 transition-colors"
                >
                  <X size={14} />
                </button>
              )}

              <button
                type="button"
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-teal-500 mr-2 transition-colors hidden sm:flex"
                title="Voice Search"
              >
                <Mic size={18} />
              </button>

              <button
                onClick={() => { if (form.destination) next(); }}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-full hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30 transition-all flex items-center gap-2"
              >
                <span>Search</span>
                <Compass size={16} />
              </button>
            </div>

            {/* Autocomplete Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-50 left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-left max-h-60 overflow-y-auto"
              >
                {suggestions.map((pred, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectDestination(pred)}
                    className="px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <MapPin size={16} className="text-teal-500 flex-shrink-0" />
                    <span>{pred.description}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Popular Searches Chips */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <span className="text-xs font-semibold text-slate-400">Popular:</span>
              {["Bali", "Paris", "Goa", "Tokyo", "Switzerland"].map(chip => (
                <button
                  key={chip}
                  onClick={() => {
                    const dest = POPULAR_DESTINATIONS.find(d => d.name.toLowerCase().includes(chip.toLowerCase()));
                    if (dest) {
                      setForm(f => ({
                        ...f,
                        destination: dest.name,
                        destinationName: dest.name
                      }));
                    } else {
                      setForm(f => ({ ...f, destination: chip }));
                    }
                  }}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-medium text-slate-200 transition-all hover:scale-105"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. HORIZONTAL STEPPER BAR ──────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto relative">
            
            {/* Horizontal Track Background */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 z-0" />
            
            {/* Active Progress Line */}
            <div 
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 z-0"
              style={{ width: `calc(${progressPercent}% * 0.88)` }}
            />

            {STEPS.map((s) => {
              const StepIcon = s.icon;
              const isCompleted = step > s.id;
              const isActive = step === s.id;
              
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => s.id < step && go(s.id)}>
                  <button
                    disabled={s.id > step}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-500/20"
                        : isActive
                          ? "bg-white dark:bg-slate-900 border-teal-500 text-teal-500 scale-110 shadow-lg shadow-teal-500/30 ring-4 ring-teal-500/20"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400"
                    }`}
                  >
                    {isCompleted ? <Check size={16} className="stroke-[3]" /> : <StepIcon size={16} />}
                  </button>
                  <span className={`text-[11px] font-bold mt-1.5 transition-colors hidden sm:block ${
                    isActive ? "text-teal-600 dark:text-teal-400 font-extrabold" : isCompleted ? "text-slate-700 dark:text-slate-300" : "text-slate-400"
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 4. TWO-COLUMN MAIN CONTENT ────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT COLUMN: STEP WIZARD (70% -> col-span-8) ────── */}
          <div className="lg:col-span-8 space-y-6">
            
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl"
              >
                
                {/* ── STEP 1: DESTINATION SELECTION ──────────────── */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        Where is your next adventure? 🌍
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Select a curated destination or use the search bar above to type any location.
                      </p>
                    </div>

                    {errors.destination && (
                      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                        <Info size={16} /> {errors.destination}
                      </div>
                    )}

                    {/* Destination Cards Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {POPULAR_DESTINATIONS.map((d) => {
                        const isSelected = form.destination.toLowerCase().includes(d.name.split(",")[0].toLowerCase());
                        const isBookmarked = savedPlaces.includes(d.name);

                        return (
                          <motion.div
                            key={d.name}
                            whileHover={{ y: -6, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setForm(f => ({
                              ...f,
                              destination: d.name,
                              destinationName: d.name,
                              placeId: "",
                              formattedAddress: "",
                              country: d.country,
                              state: "",
                              latitude: null,
                              longitude: null,
                            }))}
                            className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 shadow-md ${
                              isSelected
                                ? "border-teal-500 ring-4 ring-teal-500/20 shadow-teal-500/10"
                                : "border-slate-100 dark:border-slate-800 hover:border-teal-400 hover:shadow-xl"
                            }`}
                          >
                            {/* Destination Card Background Image */}
                            <div className="h-44 w-full relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                              <img
                                src={d.image}
                                alt={d.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                              
                              {/* Tag Badge */}
                              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wide">
                                {d.emoji} {d.tag}
                              </span>

                              {/* Heart Bookmark Button */}
                              <button
                                type="button"
                                onClick={(e) => toggleSaveDest(d.name, e)}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors"
                              >
                                <Heart
                                  size={16}
                                  className={isBookmarked ? "text-rose-500 fill-rose-500" : "text-white"}
                                />
                              </button>

                              {/* Rating & Weather Floating Badge */}
                              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold">
                                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                                  <Star size={12} className="text-amber-400 fill-amber-400" />
                                  {d.rating}
                                </span>
                                <span className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                                  {d.weather}
                                </span>
                              </div>
                            </div>

                            {/* Card Content Body */}
                            <div className="p-4 bg-white dark:bg-slate-900 space-y-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                                  {d.name}
                                </h3>
                                {isSelected && (
                                  <CheckCircle size={18} className="text-teal-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {d.desc}
                              </p>
                              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-medium">Est. Cost:</span>
                                <span className="font-extrabold text-teal-600 dark:text-teal-400">{d.avgCost}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── STEP 2: TRAVEL DATES ──────────────────────── */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        When are you traveling? 📅
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Select your start and end dates to build your day-by-day itinerary.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                          Start Date
                        </label>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                          <CalendarDays size={20} className="text-teal-500 flex-shrink-0" />
                          <input
                            type="date"
                            value={form.startDate}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                            className="w-full bg-transparent outline-none font-bold text-sm text-slate-900 dark:text-white"
                          />
                        </div>
                        {errors.startDate && <p className="text-xs font-bold text-rose-500">{errors.startDate}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                          End Date
                        </label>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                          <CalendarDays size={20} className="text-emerald-500 flex-shrink-0" />
                          <input
                            type="date"
                            value={form.endDate}
                            min={form.startDate || new Date().toISOString().split("T")[0]}
                            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                            className="w-full bg-transparent outline-none font-bold text-sm text-slate-900 dark:text-white"
                          />
                        </div>
                        {errors.endDate && <p className="text-xs font-bold text-rose-500">{errors.endDate}</p>}
                      </div>
                    </div>

                    {/* Duration Highlight Banner */}
                    {tripDays > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-lg shadow-teal-500/30">
                          {tripDays}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                            {tripDays === 1 ? "1-Day Getaway" : `${tripDays}-Day Experience`}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Perfect timeframe to explore attractions in {form.destination?.split(",")[0] || "your destination"}.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ── STEP 3: BUDGET ────────────────────────────── */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        What is your budget? 💰
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Set your target budget. We will adjust stay and activity recommendations to match.
                      </p>
                    </div>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {BUDGET_PRESETS.map((b) => (
                        <motion.button
                          key={b.label}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setForm(f => ({ ...f, budget: b.value }))}
                          className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                            form.budget === b.value
                              ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/20"
                              : "border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: `${b.color}20`, color: b.color }}>
                            💰
                          </div>
                          <p className="font-black text-sm text-slate-900 dark:text-white">{b.label}</p>
                          <p className="text-xs font-bold mt-0.5" style={{ color: b.color }}>{b.range}</p>
                        </motion.button>
                      ))}
                    </div>

                    {/* Custom Budget Controls */}
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                          Custom Amount (INR)
                        </label>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="font-extrabold text-teal-500">₹</span>
                          <input
                            type="number"
                            min={1000}
                            step={1000}
                            value={form.budget}
                            onChange={e => setForm(f => ({ ...f, budget: parseInt(e.target.value) || 0 }))}
                            className="w-28 text-right font-black text-base bg-transparent outline-none text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <input
                        type="range"
                        min={1000}
                        max={300000}
                        step={1000}
                        value={Math.min(300000, Math.max(1000, Number(form.budget) || 1000))}
                        onChange={e => setForm(f => ({ ...f, budget: parseInt(e.target.value) }))}
                        className="w-full h-2 rounded-full accent-teal-500 cursor-pointer"
                      />

                      <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span>₹1,000</span>
                        <span>₹3,000,000+</span>
                      </div>
                    </div>
                    {errors.budget && <p className="text-xs font-bold text-rose-500">{errors.budget}</p>}
                  </div>
                )}

                {/* ── STEP 4: TRAVEL STYLE ──────────────────────── */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        What is your travel style? ✨
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Choose how you like to experience your trips so AI can tailor activities.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {TRAVEL_STYLES.map((s) => {
                        const selected = form.style === s.id;
                        return (
                          <motion.button
                            key={s.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setForm(f => ({ ...f, style: s.id }));
                              setCustomStyle("");
                            }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              selected
                                ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/20"
                                : "border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                            }`}
                          >
                            <span className="text-2xl">{s.emoji}</span>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">{s.label}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{s.desc}</p>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Custom Style Text Input */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        Or Specify Custom Preference
                      </label>
                      <input
                        type="text"
                        value={customStyle}
                        onChange={e => {
                          const val = e.target.value;
                          setCustomStyle(val);
                          setForm(f => ({ ...f, style: val.trim() ? val.trim() : "" }));
                        }}
                        placeholder="e.g. Photography tour, Scuba Diving, Foodie Walk..."
                        className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-sm font-semibold text-slate-900 dark:text-white focus:border-teal-500"
                      />
                    </div>
                    {errors.style && <p className="text-xs font-bold text-rose-500">{errors.style}</p>}
                  </div>
                )}

                {/* ── STEP 5: AI SUGGESTIONS ────────────────────── */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles size={24} className="text-teal-500" />
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                          AI Suggestions Curated For You
                        </h2>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Handpicked experiences generated for <span className="font-extrabold text-teal-600 dark:text-teal-400">{form.destination || "your destination"}</span>.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {getSuggestionsForDestination(form.destination).map((suggestion, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center gap-3.5"
                        >
                          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                            #{i + 1}
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{suggestion}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 6: REVIEW & CONFIRM ──────────────────── */}
                {step === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        Review Your Journey Details 🎉
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Verify your selections before building your AI itinerary.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                        <span className="text-xs font-bold text-slate-400">Destination</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">{form.destination || "Not set"}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                        <span className="text-xs font-bold text-slate-400">Dates</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {form.startDate && form.endDate ? `${form.startDate} to ${form.endDate}` : "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                        <span className="text-xs font-bold text-slate-400">Target Budget</span>
                        <span className="font-extrabold text-teal-600 dark:text-teal-400 text-sm">₹{Number(form.budget).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Travel Style</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm capitalize">{form.style || customStyle || "Flexible"}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        Trip Title (Optional)
                      </label>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <Plane size={18} className="text-teal-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={form.tripName}
                          onChange={e => setForm(f => ({ ...f, tripName: e.target.value }))}
                          placeholder={`${form.destination?.split(",")[0] || "My"} Trip`}
                          className="w-full bg-transparent outline-none font-bold text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Wizard Buttons Navigation Bar */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 mt-8">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={prev}
                      className="px-6 py-3 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 6 ? (
                    <button
                      type="button"
                      onClick={next}
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-sm px-8 py-3.5 rounded-full hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30 transition-all flex items-center gap-2 ml-auto"
                    >
                      <span>Continue</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-base px-10 py-3.5 rounded-full hover:scale-105 active:scale-95 shadow-xl shadow-teal-500/30 transition-all flex items-center gap-2 ml-auto disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating Itinerary...</span>
                        </>
                      ) : (
                        <>
                          <span>🚀 Create My Trip</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </motion.div>
            </AnimatePresence>

          </div>

          {/* ── RIGHT COLUMN: STICKY JOURNEY SUMMARY CARD (30% -> col-span-4) ── */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass size={20} className="text-teal-500" />
                  <span>Journey Summary</span>
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 text-xs font-extrabold">
                  Step {step} of 6
                </span>
              </div>

              {/* Destination Image Preview */}
              <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img
                  src={currentDestObj?.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"}
                  alt="Destination"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Destination</p>
                  <p className="font-extrabold text-base leading-tight truncate">
                    {form.destination || "Select Destination"}
                  </p>
                </div>
              </div>

              {/* Selected Parameters Breakdown */}
              <div className="space-y-3.5 text-xs font-semibold">
                
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-teal-500" /> Dates
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {form.startDate ? `${form.startDate} ${form.endDate ? `→ ${form.endDate}` : ""}` : "Not selected"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <Users size={16} className="text-emerald-500" /> Travelers
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">1 Traveler</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <DollarSign size={16} className="text-amber-500" /> Est. Budget
                  </span>
                  <span className="font-extrabold text-teal-600 dark:text-teal-400 text-sm">
                    ₹{Number(form.budget).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <Heart size={16} className="text-rose-500" /> Travel Style
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white capitalize">
                    {form.style || customStyle || "Flexible"}
                  </span>
                </div>

              </div>

              {/* Estimated Budget Allocation Breakdown */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Estimated Allocation
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                    🏨 Stay: <span className="text-teal-600">40%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                    🍛 Food: <span className="text-teal-600">25%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                    🎟️ Activities: <span className="text-teal-600">20%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                    🚗 Travel: <span className="text-teal-600">15%</span>
                  </div>
                </div>
              </div>

              {/* Security / Guarantee Badge */}
              <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/50 flex items-center gap-2.5 text-xs text-teal-700 dark:text-teal-300 font-semibold">
                <ShieldCheck size={18} className="text-teal-500 flex-shrink-0" />
                <span>AI Guarantee: Free cancellation & instant itinerary modification.</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ── 5. RESPONSIVE FOOTER ──────────────────────────────── */}
      <ResponsiveFooter />

    </div>
  );
};

export default CreateTrip;