// src/pages/PackingChecklist.jsx — Premium redesign

import React, { useEffect, useState, useMemo } from "react";
import { useParams }    from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import { getApiUrl } from "../utils/api";
import BottomSheet from "../components/mobile/BottomSheet";
import {
  Search, Plus, X, CheckCircle, Circle, ChevronDown, Sparkles,
  Shirt, Laptop, FileText, Droplets, Pill, Camera, Dumbbell, AlertTriangle, Trash2,
  Wand2, Package
} from "lucide-react";
import { useToast } from "../components/mobile/MobileToast";
import { useTheme } from "../context/ThemeContext";
import { db } from "../services/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

// ─── DEFAULT CATEGORIES ───────────────────────────────────────
const DEFAULT_CATEGORIES = [
  {
    id: "clothes", label: "Clothes", icon: Shirt,    color: "#8B5CF6", bg: "#EDE9FE",
    items: [
      { id: "c1", label: "T-shirts (5x)",   packed: false, priority: "essential" },
      { id: "c2", label: "Trousers (2x)",   packed: false, priority: "essential" },
      { id: "c3", label: "Underwear (5x)",  packed: false, priority: "essential" },
      { id: "c4", label: "Socks (5x)",      packed: false, priority: "essential" },
      { id: "c5", label: "Jacket",          packed: false, priority: "optional"  },
      { id: "c6", label: "Swimwear",        packed: false, priority: "optional"  },
    ],
  },
  {
    id: "electronics", label: "Electronics", icon: Laptop, color: "#3B82F6", bg: "#DBEAFE",
    items: [
      { id: "e1", label: "Phone charger",   packed: false, priority: "essential" },
      { id: "e2", label: "Power bank",      packed: false, priority: "essential" },
      { id: "e3", label: "Laptop + charger",packed: false, priority: "optional"  },
      { id: "e4", label: "Earphones",       packed: false, priority: "optional"  },
      { id: "e5", label: "Travel adapter",  packed: false, priority: "essential" },
    ],
  },
  {
    id: "documents", label: "Documents", icon: FileText, color: "#EF4444", bg: "#FEE2E2",
    items: [
      { id: "d1", label: "Passport / ID",   packed: false, priority: "essential" },
      { id: "d2", label: "Flight tickets",  packed: false, priority: "essential" },
      { id: "d3", label: "Hotel booking",   packed: false, priority: "essential" },
      { id: "d4", label: "Travel insurance",packed: false, priority: "essential" },
      { id: "d5", label: "Visa documents",  packed: false, priority: "optional"  },
    ],
  },
  {
    id: "toiletries", label: "Toiletries", icon: Droplets, color: "#14B8B5", bg: "#CCFBF1",
    items: [
      { id: "t1", label: "Toothbrush & paste",packed: false, priority: "essential" },
      { id: "t2", label: "Shampoo & conditioner",packed: false, priority: "essential" },
      { id: "t3", label: "Sunscreen SPF 50+",packed: false, priority: "essential" },
      { id: "t4", label: "Deodorant",        packed: false, priority: "essential" },
      { id: "t5", label: "Face wash",        packed: false, priority: "optional"  },
    ],
  },
  {
    id: "health", label: "Health", icon: Pill, color: "#F59E0B", bg: "#FEF3C7",
    items: [
      { id: "h1", label: "Paracetamol",     packed: false, priority: "essential" },
      { id: "h2", label: "Antacids",        packed: false, priority: "essential" },
      { id: "h3", label: "Motion sickness", packed: false, priority: "optional"  },
      { id: "h4", label: "First aid kit",   packed: false, priority: "optional"  },
    ],
  },
  {
    id: "camera", label: "Photography", icon: Camera, color: "#EC4899", bg: "#FCE7F3",
    items: [
      { id: "p1", label: "Camera + lens",   packed: false, priority: "optional"  },
      { id: "p2", label: "Memory cards",    packed: false, priority: "optional"  },
      { id: "p3", label: "Tripod",          packed: false, priority: "optional"  },
    ],
  },
];

const PRIORITY_COLORS = {
  essential: { bg: "#FEE2E2", text: "#EF4444", label: "Essential" },
  optional:  { bg: "#DBEAFE", text: "#3B82F6", label: "Optional"  },
};

// ─── CIRCULAR PROGRESS RING ───────────────────────────────────
const ProgressRing = ({ percent }) => {
  const r   = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <motion.circle
          cx="56" cy="56" r={r}
          fill="none"
          stroke="#14B8B5"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center">
        <p className="text-2xl font-extrabold text-slate-800">{percent}%</p>
        <p className="text-[10px] font-semibold text-slate-400">Packed</p>
      </div>
    </div>
  );
};

// ─── CATEGORY ACCORDION ───────────────────────────────────────
const CategoryAccordion = ({ category, onToggle, onDelete, isViewer }) => {
  const [open, setOpen] = useState(true);
  const Icon = category.icon;
  const packed  = category.items.filter(i => i.packed).length;
  const total   = category.items.length;
  const allDone = packed === total;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden mb-3"
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div
          className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0"
          style={{ background: category.bg }}
        >
          <Icon size={18} style={{ color: category.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{category.label}</p>
          <p className="text-xs text-slate-400">{packed}/{total} packed</p>
        </div>
        <div className="flex items-center gap-2">
          {allDone && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle size={18} className="text-emerald-500" />
            </motion.div>
          )}
          <div
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: allDone ? "#D1FAE5" : category.bg, color: allDone ? "#059669" : category.color }}
          >
            {total - packed} left
          </div>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Items */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-slate-50 pt-2 space-y-2">
              {category.items.map(item => {
                const pri = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.optional;
                return (
                  <div
                    key={item.id}
                    className="w-full flex items-center gap-3 py-1.5 px-3 rounded-[14px] transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                  >
                    <div
                      onClick={() => !isViewer && onToggle(category.id, item.id)}
                      className={`flex-1 flex items-center gap-3 py-1.5 ${isViewer ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <motion.div
                        animate={{ scale: item.packed ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.packed
                          ? <CheckCircle size={20} className="text-teal-500" />
                          : <Circle     size={20} className="text-slate-300" />
                        }
                      </motion.div>
                      <span
                        className={`flex-1 text-sm font-semibold transition-all ${
                          item.packed ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: pri.bg, color: pri.text }}
                      >
                        {pri.label}
                      </span>
                    </div>
                    {/* Delete item button */}
                    {!isViewer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDelete) onDelete(category.id, item.id);
                        }}
                        className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                        title="Delete item"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── CATEGORY MAP — maps backend category names to UI config ──────────────
const AI_CATEGORY_MAP = {
  "Clothes":     { id: "clothes",     icon: Shirt,    color: "#8B5CF6", bg: "#EDE9FE" },
  "Electronics": { id: "electronics", icon: Laptop,   color: "#3B82F6", bg: "#DBEAFE" },
  "Documents":   { id: "documents",   icon: FileText, color: "#EF4444", bg: "#FEE2E2" },
  "Toiletries":  { id: "toiletries",  icon: Droplets, color: "#14B8B5", bg: "#CCFBF1" },
  "Health":      { id: "health",      icon: Pill,     color: "#F59E0B", bg: "#FEF3C7" },
  "Accessories": { id: "accessories", icon: Package,  color: "#6366F1", bg: "#EEF2FF" },
  "Food":        { id: "food",        icon: Dumbbell, color: "#10B981", bg: "#D1FAE5" },
};

const SEASONS = ["Summer", "Winter", "Monsoon", "Spring", "Autumn"];
const TRAVEL_STYLES = [
  { key: "casual",     label: "Casual",      emoji: "👟" },
  { key: "beach",      label: "Beach",       emoji: "🏖️" },
  { key: "adventure",  label: "Adventure",   emoji: "🏕️" },
  { key: "business",   label: "Business",    emoji: "💼" },
  { key: "backpacker", label: "Backpacker",  emoji: "🎒" },
];

// ─── MAIN PAGE ────────────────────────────────────────────────
const PackingChecklist = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const [trip,       setTrip]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [pendingSync, setPendingSync] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search,     setSearch]     = useState("");
  const [showDone,   setShowDone]   = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("clothes");
  const toast = useToast();
  const isViewer = trip?.role === "viewer";

  // ── AI PACKING STATE ──
  const [showAISheet,    setShowAISheet]    = useState(false);
  const [aiSeason,       setAiSeason]       = useState("Summer");
  const [aiStyle,        setAiStyle]        = useState("casual");
  const [aiDuration,     setAiDuration]     = useState("");
  const [aiSuggestions,  setAiSuggestions]  = useState([]);
  const [aiSelected,     setAiSelected]     = useState(new Set());
  const [aiLoading,      setAiLoading]      = useState(false);
  const [aiGenerated,    setAiGenerated]    = useState(false);

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiGenerated(false);
    try {
      const token = localStorage.getItem("token");
      const duration = parseInt(aiDuration) || (
        trip?.startDate && trip?.endDate
          ? Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000))
          : 5
      );
      const res = await fetch(getApiUrl("checklist/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          destination: trip?.destination || "",
          duration,
          season: aiSeason.toLowerCase(),
          travelStyle: aiStyle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSuggestions(data.suggestions || []);
        // Pre-select all suggestions
        setAiSelected(new Set(data.suggestions.map((_, i) => i)));
        setAiGenerated(true);
      } else {
        toast.error("Could not generate suggestions. Try again.");
      }
    } catch (err) {
      console.error("AI packing error:", err);
      toast.error("Failed to generate suggestions.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAISuggestions = async () => {
    const selectedItems = aiSuggestions.filter((_, i) => aiSelected.has(i));
    if (selectedItems.length === 0) {
      toast.error("Select at least one item.");
      return;
    }
    try {
      for (const item of selectedItems) {
        const docRef = doc(collection(db, "trips", id, "checklist"));
        await setDoc(docRef, {
          item: item.item,
          category: item.category.toLowerCase(),
          checked: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      toast.success(`✨ ${selectedItems.length} AI items added to checklist!`);
      setShowAISheet(false);
      setAiGenerated(false);
      setAiSuggestions([]);
    } catch (err) {
      console.error("Bulk create in Firestore error:", err);
      toast.error("Failed to save items.");
    }
  };

  const toggleAIItem = (idx) => {
    setAiSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleAddChecklistItem = async (e) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      const docRef = doc(collection(db, "trips", id, "checklist"));
      await setDoc(docRef, {
        item: newItemName.trim(),
        category: newItemCategory,
        checked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewItemName("");
      toast.success("Item added to packing list!");
    } catch (err) {
      console.error("Failed to add packing item:", err);
      toast.error("Failed to add item.");
    }
  };

  const getBaseCategories = () => [
    { id: "clothes", label: "Clothes", icon: Shirt, color: "#8B5CF6", bg: "#EDE9FE", items: [] },
    { id: "electronics", label: "Electronics", icon: Laptop, color: "#3B82F6", bg: "#DBEAFE", items: [] },
    { id: "documents", label: "Documents", icon: FileText, color: "#EF4444", bg: "#FEE2E2", items: [] },
    { id: "toiletries", label: "Toiletries", icon: Droplets, color: "#14B8B5", bg: "#CCFBF1", items: [] },
    { id: "health", label: "Health", icon: Pill, color: "#F59E0B", bg: "#FEF3C7", items: [] },
    { id: "camera", label: "Photography", icon: Camera, color: "#EC4899", bg: "#FCE7F3", items: [] },
  ];

  const handleGenerateDefaults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const checklistRes = await fetch(getApiUrl(`checklist/${id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const checklistData = await checklistRes.json();
      if (checklistData.success) {
        const itemsFromDB = checklistData.checklist || [];
        for (const dbItem of itemsFromDB) {
          const docRef = doc(db, "trips", id, "checklist", dbItem._id || dbItem.id);
          await setDoc(docRef, {
            item: dbItem.item || "",
            category: dbItem.category || "clothes",
            checked: dbItem.checked || false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        toast.success("Default packing checklist generated!");
      }
    } catch (err) {
      console.error("Failed to generate default checklist:", err);
      toast.error("Failed to generate default checklist.");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (catId, itemId) => {
    try {
      const docRef = doc(db, "trips", id, "checklist", itemId);
      await deleteDoc(docRef);
      toast.success("Item deleted");
    } catch (err) {
      console.error("Failed to delete item:", err);
      toast.error("Failed to delete item");
    }
  };

  // Handle android back button for custom non-BottomSheet overlays
  useEffect(() => {
    if (!showResetConfirm) return;
    const handleHardwareBack = (e) => {
      e.preventDefault();
      setShowResetConfirm(false);
    };
    window.addEventListener("hardwareBack", handleHardwareBack);
    return () => {
      window.removeEventListener("hardwareBack", handleHardwareBack);
    };
  }, [showResetConfirm]);

  useEffect(() => {
    let unsubscribe = null;
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // 1. Fetch trip
        const tripRes = await fetch(getApiUrl(`trips/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tripData = await tripRes.json();
        if (tripData.success) setTrip(tripData.trip);

        // 2. Fetch checklist from MongoDB for bootstrapping
        const checklistRes = await fetch(getApiUrl(`checklist/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const checklistData = await checklistRes.json();
        const itemsFromDB = (checklistData.success && checklistData.checklist) ? checklistData.checklist : [];

        // Subscribe to Firestore checklist subcollection
        const checklistColRef = collection(db, "trips", id, "checklist");
        const q = query(checklistColRef);
        unsubscribe = onSnapshot(q, async (snapshot) => {
          if (snapshot.empty && itemsFromDB.length > 0) {
            // Auto-migrate from MongoDB to Firestore
            for (const dbItem of itemsFromDB) {
              const docRef = doc(db, "trips", id, "checklist", dbItem._id || dbItem.id);
              await setDoc(docRef, {
                item: dbItem.item || "",
                category: dbItem.category || "clothes",
                checked: dbItem.checked || false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
            return;
          }

          const categoryList = getBaseCategories();
          const catMap = {};
          categoryList.forEach(c => { catMap[c.id] = c; });

          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const dbItem = {
              id: docSnap.id,
              label: data.item || "",
              packed: data.checked || false,
              category: data.category || "clothes",
              priority: "optional"
            };
            const isEssential = ["passport", "ticket", "id", "charger", "booking", "insurance", "toothbrush", "paracetamol"].some(keyword => dbItem.label.toLowerCase().includes(keyword));
            dbItem.priority = isEssential ? "essential" : "optional";

            const catId = dbItem.category.toLowerCase();
            if (!catMap[catId]) {
              const matchedConfig = Object.values(AI_CATEGORY_MAP).find(c => c.id === catId) || {
                id: catId,
                icon: Package,
                color: "#6366F1",
                bg: "#EEF2FF"
              };
              const newCat = {
                id: catId,
                label: dbItem.category.charAt(0).toUpperCase() + dbItem.category.slice(1),
                icon: matchedConfig.icon || Package,
                color: matchedConfig.color || "#6366F1",
                bg: matchedConfig.bg || "#EEF2FF",
                items: []
              };
              categoryList.push(newCat);
              catMap[catId] = newCat;
            }

            catMap[catId].items.push(dbItem);
          });

          setCategories(categoryList);
          setPendingSync(snapshot.metadata.hasPendingWrites);
          setLoading(false);
        }, (err) => {
          console.error("Firestore checklist subscribe error:", err);
          setLoading(false);
        });

      } catch (err) {
        console.error("Error loading checklist details:", err);
        setLoading(false);
      }
    };
    fetch_();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  const handleResetChecklist = async () => {
    setShowResetConfirm(false);
    try {
      const itemsToReset = categories.flatMap(c => c.items);
      for (const item of itemsToReset) {
        const docRef = doc(db, "trips", id, "checklist", item.id);
        await updateDoc(docRef, { checked: false, updatedAt: serverTimestamp() });
      }
      toast.success("Checklist reset successfully!");
    } catch (err) {
      console.error("Failed to reset checklist:", err);
      toast.error("Failed to reset checklist.");
    }
  };

  const toggleItem = async (catId, itemId) => {
    let newPackedState = false;
    setCategories(prev =>
      prev.map(cat =>
        cat.id !== catId ? cat : {
          ...cat,
          items: cat.items.map(item => {
            if (item.id === itemId) {
              newPackedState = !item.packed;
              return { ...item, packed: newPackedState };
            }
            return item;
          }),
        }
      )
    );

    try {
      const docRef = doc(db, "trips", id, "checklist", itemId);
      await updateDoc(docRef, {
        checked: newPackedState,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to sync checklist toggle:", err);
    }
  };

  const allItems   = categories.flatMap(c => c.items);
  const packedCount = allItems.filter(i => i.packed).length;
  const totalCount  = allItems.length;
  const percent     = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const filtered = useMemo(() => {
    if (!search) return categories;
    return categories.map(cat => ({
      ...cat,
      items: cat.items.filter(i => i.label.toLowerCase().includes(search.toLowerCase())),
    })).filter(cat => cat.items.length > 0);
  }, [categories, search]);

  if (loading) {
    return (
      <MainLayout>
        <div className="px-4 pt-4">
          <div className="h-40 skeleton rounded-[24px] mb-4" />
          {[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-[20px] mb-3" />)}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 pt-4">

        {/* ── PROGRESS HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-5 mb-5 flex items-center gap-5"
        >
          <ProgressRing percent={percent} />
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-1.5">
              {trip?.title || "Packing List"}
              {pendingSync && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 animate-pulse">
                  Pending Sync
                </span>
              )}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">{trip?.destination}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-[14px] text-center" style={{ background: "rgba(20,184,181,0.08)" }}>
                <p className="text-lg font-extrabold text-teal-600">{packedCount}</p>
                <p className="text-[10px] font-semibold text-slate-400">Packed</p>
              </div>
              <div className="p-2.5 rounded-[14px] text-center" style={{ background: "rgba(239,68,68,0.06)" }}>
                <p className="text-lg font-extrabold text-red-400">{totalCount - packedCount}</p>
                <p className="text-[10px] font-semibold text-slate-400">Remaining</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Completion banner */}
        {percent === 100 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 p-4 rounded-[20px] flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)" }}
          >
            <span className="text-3xl">🎉</span>
            <div>
              <p className="text-sm font-extrabold text-emerald-800">All packed! You're ready!</p>
              <p className="text-xs text-emerald-600">Have an amazing trip ✈️</p>
            </div>
          </motion.div>
        )}

        {/* ── SEARCH, AI BUTTON & RESET ── */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-[18px] bg-white border border-slate-200 shadow-xs focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all" style={isDark ? { background: "var(--surface)", borderColor: "var(--border)" } : {}}>
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              className="flex-1 text-slate-700 text-sm font-medium placeholder:text-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* AI Generate Button */}
          {!isViewer && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => { setShowAISheet(true); setAiGenerated(false); setAiSuggestions([]); }}
              className="flex items-center gap-1.5 px-3.5 py-3.5 rounded-[18px] text-white font-bold text-xs flex-shrink-0 shadow-brand active:scale-95"
              style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
              title="AI Smart Packing"
            >
              <Wand2 size={14} />
              <span className="hidden sm:inline">AI</span>
            </motion.button>
          )}

          {totalCount > 0 && !isViewer && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-3.5 rounded-[18px] border border-red-200 text-red-500 text-xs font-bold bg-red-50/50 hover:bg-red-50 flex items-center gap-1 flex-shrink-0 active:scale-95"
            >
              Reset
            </motion.button>
          )}
        </div>

        {/* AI suggestion chip */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-[14px]" style={{ background: "rgba(20,184,181,0.08)", border: "1px solid rgba(20,184,181,0.15)" }}>
          <Sparkles size={14} className="text-teal-500" />
          <p className="text-xs font-semibold text-teal-700">AI suggests: Pack light clothes — {trip?.destination?.split(",")[0] || "your destination"} is warm in this season 🌞</p>
        </div>

        {/* ── CATEGORIES ── */}
        {totalCount === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 dark:bg-slate-800/20 dark:border-slate-800 mb-6"
          >
            <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-3xl mb-2">
              🧳
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Your Checklist is Empty</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] mb-6">
              Add your own custom packing items or generate Traveloop's recommended standard checklist.
            </p>
            
            {!isViewer && (
              <>
                <button
                  onClick={handleGenerateDefaults}
                  className="py-3 px-6 rounded-full text-white font-bold text-xs shadow-brand active:scale-95 transition-all flex items-center justify-center gap-1.5 mb-6"
                  style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
                >
                  Generate Recommended Checklist
                </button>
                
                <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-6">
                  <p className="text-xs font-bold text-slate-500 mb-3 text-left">Add Custom Item</p>
                  <form onSubmit={handleAddChecklistItem} className="flex flex-col gap-2.5 w-full">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      placeholder="e.g. Hiking shoes, Sunglasses..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-slate-200 text-xs font-bold bg-white dark:bg-slate-900"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newItemCategory}
                        onChange={e => setNewItemCategory(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-slate-200 text-xs font-bold bg-white dark:bg-slate-900"
                      >
                        <option value="clothes">Clothes</option>
                        <option value="electronics">Electronics</option>
                        <option value="documents">Documents</option>
                        <option value="toiletries">Toiletries</option>
                        <option value="health">Health</option>
                        <option value="camera">Photography</option>
                      </select>
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-xl text-white font-bold text-xs bg-slate-800 dark:bg-teal-500 active:scale-95 transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <>
            {/* Inline creator form when checklist has items */}
            {!isViewer && (
              <div className="premium-card p-4 mb-5">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Add Custom Item</p>
                <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    placeholder="Add item (e.g. Swimwear)..."
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-slate-200 text-xs font-bold bg-slate-50 dark:bg-slate-900"
                  />
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-slate-200 text-[11px] font-bold bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="clothes">Clothes</option>
                    <option value="electronics">Electronics</option>
                    <option value="documents">Documents</option>
                    <option value="toiletries">Toiletries</option>
                    <option value="health">Health</option>
                    <option value="camera">Photo</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-white font-bold text-xs bg-teal-500 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
                  >
                    <Plus size={14} /> Add
                  </button>
                </form>
              </div>
            )}

            {/* ── CATEGORIES ── */}
            {filtered.map(cat => (
              <CategoryAccordion key={cat.id} category={cat} onToggle={toggleItem} onDelete={deleteItem} isViewer={isViewer} />
            ))}
          </>
        )}
      </div>

      {/* Custom Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-x-4 top-[35%] z-[999] max-w-sm mx-auto p-6 rounded-[24px] bg-white border border-slate-100 shadow-lg text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 mb-2">Reset Checklist?</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                This will uncheck all items in your packing list. This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-full border border-slate-200 text-slate-500 text-xs font-bold bg-white active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetChecklist}
                  className="flex-1 py-3 rounded-full text-white text-xs font-bold bg-red-500 shadow-sm active:scale-95"
                >
                  Reset List
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── AI SMART PACKING BOTTOM SHEET ─────────────────────── */}
      <BottomSheet
        isOpen={showAISheet}
        onClose={() => setShowAISheet(false)}
        title="✨ AI Smart Packing"
        snapPoints={["85vh"]}
      >
        <div className="space-y-5 pb-6">

          {/* Trip destination chip */}
          {trip?.destination && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px]" style={{ background: "rgba(20,184,181,0.08)", border: "1px solid rgba(20,184,181,0.2)" }}>
              <span className="text-base">📍</span>
              <span className="text-xs font-bold text-teal-700">{trip.destination}</span>
            </div>
          )}

          {/* Season selector */}
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Season</p>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map(s => (
                <button
                  key={s}
                  onClick={() => setAiSeason(s)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                    aiSeason === s
                      ? "bg-teal-500 text-white border-teal-500"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Travel style selector */}
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Travel Style</p>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_STYLES.map(s => (
                <button
                  key={s.key}
                  onClick={() => setAiStyle(s.key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    aiStyle === s.key
                      ? "bg-teal-500 text-white border-teal-500"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  <span>{s.emoji}</span>{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration input */}
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Trip Duration (Days)</p>
            <input
              type="number"
              value={aiDuration}
              onChange={e => setAiDuration(e.target.value)}
              placeholder={
                trip?.startDate && trip?.endDate
                  ? `${Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000))} days (auto)`
                  : "Enter number of days..."
              }
              min="1"
              max="60"
              className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm font-bold bg-slate-50 text-slate-700 outline-none focus:border-teal-400 transition-colors"
              style={isDark ? { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" } : {}}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading}
            className="w-full py-4 rounded-[18px] text-white font-bold text-sm shadow-brand active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
          >
            {aiLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                {aiGenerated ? "Regenerate List" : "Generate My Packing List"}
              </>
            )}
          </button>

          {/* Suggestions list */}
          {aiGenerated && aiSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {/* Select all toggle */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-extrabold text-slate-700">{aiSuggestions.length} Suggestions</p>
                <button
                  onClick={() => {
                    if (aiSelected.size === aiSuggestions.length) {
                      setAiSelected(new Set());
                    } else {
                      setAiSelected(new Set(aiSuggestions.map((_, i) => i)));
                    }
                  }}
                  className="text-xs font-bold text-teal-600 underline"
                >
                  {aiSelected.size === aiSuggestions.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {aiSuggestions.map((item, idx) => {
                const catConfig = AI_CATEGORY_MAP[item.category] || AI_CATEGORY_MAP["Accessories"];
                const isSelected = aiSelected.has(idx);
                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleAIItem(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] border text-left transition-all ${
                      isSelected
                        ? "border-teal-300 bg-teal-50"
                        : "border-slate-100 bg-slate-50"
                    }`}
                    style={isDark ? {
                      background: isSelected ? "rgba(20,184,181,0.1)" : "var(--surface-2)",
                      borderColor: isSelected ? "rgba(20,184,181,0.4)" : "var(--border)",
                    } : {}}
                  >
                    <div
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                      style={{ background: catConfig.bg }}
                    >
                      <catConfig.icon size={14} style={{ color: catConfig.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700" style={isDark ? { color: "var(--text-primary)" } : {}}>{item.item}</p>
                      <p className="text-[10px] font-bold" style={{ color: catConfig.color }}>{item.category}</p>
                    </div>
                    {isSelected
                      ? <CheckCircle size={18} className="text-teal-500 flex-shrink-0" />
                      : <Circle size={18} className="text-slate-300 flex-shrink-0" />
                    }
                  </motion.button>
                );
              })}

              {/* Add selected to checklist */}
              <button
                onClick={handleAddAISuggestions}
                className="w-full py-4 rounded-[18px] text-white font-bold text-sm mt-3 shadow-brand active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
              >
                <Plus size={16} />
                Add {aiSelected.size} Item{aiSelected.size !== 1 ? "s" : ""} to Checklist
              </button>
            </motion.div>
          )}
        </div>
      </BottomSheet>
    </MainLayout>
  );
};

export default PackingChecklist;