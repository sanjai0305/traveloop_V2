// src/pages/TripNotes.jsx — Enterprise Desktop Travel Journal & Notes Editor

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import PageHeader from "../components/common/PageHeader";
import {
  Plus, Search, X, Trash2, MapPin, StickyNote, Pin,
  Calendar, Eye, BookOpen, Edit3, Tag, ArrowLeft, ChevronRight,
  Share2, FileText, Printer, Settings, SlidersHorizontal, ArrowUpDown,
  Sparkles, Download, Mic, FilePlus, ChevronUp, ChevronDown, Check,
  Clock, DollarSign, Users, ShieldCheck, Compass
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
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

const NOTE_THEMES = [
  { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800/40", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-teal-50 dark:bg-teal-950/20", border: "border-teal-200 dark:border-teal-800/40", dot: "bg-teal-500", text: "text-teal-700 dark:text-teal-300" },
  { bg: "bg-purple-50 dark:bg-purple-950/20", border: "border-purple-200 dark:border-purple-800/40", dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-300" },
  { bg: "bg-rose-50 dark:bg-rose-950/20", border: "border-rose-200 dark:border-rose-800/40", dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
  { bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800/40", dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800/40", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
];

const NoteCard = ({ note, index, onPin, onDelete, onEdit, isViewer }) => {
  const theme = NOTE_THEMES[index % NOTE_THEMES.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className={`rounded-2xl p-5 border relative cursor-pointer group shadow-sm hover:shadow-xl transition-all duration-300 ${theme.bg} ${theme.border}`}
      onClick={() => onEdit(note)}
    >
      {/* Color Accent Indicator */}
      <div className={`absolute top-4 left-4 w-3 h-3 rounded-full ${theme.dot}`} />

      <div className="pl-6 pr-12 space-y-2">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 flex items-center gap-2">
          {note.title}
          {note.pinned && <Pin size={14} className="text-violet-500 fill-violet-500 flex-shrink-0" />}
        </h3>
        
        {/* Day badge & Type Tags */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {note.type === "day" ? `Day ${note.day}` : "General"}
          </span>
          {note.tags && note.tags.map(tag => (
            <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-900/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              #{tag}
            </span>
          ))}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-4 leading-relaxed whitespace-pre-line font-medium">
          {note.content}
        </p>
      </div>

      <div className="flex items-center justify-between mt-4 pl-6 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] font-bold text-slate-400">
        {note.createdAt && (
          <span>
            {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      {!isViewer && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin(note._id, !note.pinned);
            }}
            className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-xs"
            title={note.pinned ? "Unpin Note" : "Pin Note"}
          >
            <Pin size={12} className={note.pinned ? "text-violet-500 fill-violet-500" : "text-slate-400"} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note._id);
            }}
            className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-xs text-rose-500"
            title="Delete Note"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

const TripNotes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [trip, setTrip] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingSync, setPendingSync] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("pinned"); // pinned | newest | oldest
  const [selectedTag, setSelectedTag] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid | journal
  const [filterDay, setFilterDay] = useState("all"); // all | general | [dayNumber]

  // Add/Edit states
  const [showSheet, setShowSheet] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    type: "trip",
    day: 1,
    pinned: false,
    tagInput: "",
    tags: []
  });
  const [saving, setSaving] = useState(false);
  const isViewer = trip?.role === "viewer";

  // Auto handle back overlay
  useEffect(() => {
    if (!showSheet) return;
    const handleHardwareBack = (e) => {
      e.preventDefault();
      setShowSheet(false);
    };
    window.addEventListener("hardwareBack", handleHardwareBack);
    return () => {
      window.removeEventListener("hardwareBack", handleHardwareBack);
    };
  }, [showSheet]);

  useEffect(() => {
    let unsubscribe = null;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [tripRes, notesRes] = await Promise.all([
          fetch(getApiUrl(`trips/${id}`), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(getApiUrl(`notes/${id}`), { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const tripData = await tripRes.json();
        const notesData = await notesRes.json();
        if (tripData.success) setTrip(tripData.trip);
        const notesFromDB = (notesData.success && notesData.notes) ? notesData.notes : [];

        // Set up Firestore notes listener
        const notesColRef = collection(db, "trips", id, "notes");
        const q = query(notesColRef);
        unsubscribe = onSnapshot(q, async (snapshot) => {
          if (snapshot.empty && notesFromDB.length > 0) {
            // Auto-migrate from MongoDB to Firestore
            for (const note of notesFromDB) {
              const docRef = doc(db, "trips", id, "notes", note._id || note.id);
              await setDoc(docRef, {
                title: note.title || "",
                content: note.content || "",
                type: note.type || "trip",
                day: note.day || null,
                pinned: note.pinned || false,
                tags: note.tags || [],
                createdAt: note.createdAt ? new Date(note.createdAt) : serverTimestamp(),
                updatedAt: note.updatedAt ? new Date(note.updatedAt) : serverTimestamp()
              });
            }
            return;
          }

          const notesList = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            notesList.push({
              _id: docSnap.id,
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
            });
          });

          setNotes(notesList);
          setPendingSync(snapshot.metadata.hasPendingWrites);
          setLoading(false);
        }, (err) => {
          console.error("Firestore notes subscribe error:", err);
          setLoading(false);
        });

      } catch (err) {
        console.error("Error loading journal notes data:", err);
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  const daysCount = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 1;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.max(1, Math.ceil((end - start) / 86400000));
  }, [trip]);

  // All unique tags extracted across notes
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    notes.forEach(n => (n.tags || []).forEach(t => t && tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [notes]);

  // Filtered & sorted notes
  const filtered = useMemo(() => {
    let result = notes.filter(n => {
      const matchSearch =
        (n.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (n.content || "").toLowerCase().includes(search.toLowerCase()) ||
        (n.tags || []).some(t => t && t.toLowerCase().includes(search.toLowerCase()));

      const matchDay =
        filterDay === "all" ||
        (filterDay === "general" && n.type === "trip") ||
        (n.type === "day" && n.day === Number(filterDay));

      const matchTag = selectedTag === "all" || (n.tags || []).includes(selectedTag);

      return matchSearch && matchDay && matchTag;
    });

    // Sorting logic
    result.sort((a, b) => {
      if (sortBy === "pinned") {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });

    return result;
  }, [notes, search, filterDay, selectedTag, sortBy]);

  // Grouped for Journal timeline view
  const journalGroups = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const dayA = a.type === "trip" ? 0 : a.day;
      const dayB = b.type === "trip" ? 0 : b.day;
      if (dayA !== dayB) return dayA - dayB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const groups = {};
    sorted.forEach(n => {
      const groupKey = n.type === "trip" ? "General Info" : `Day ${n.day}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(n);
    });
    return groups;
  }, [filtered]);

  // Handlers
  const handlePinNote = async (noteId, pinState) => {
    try {
      const noteDocRef = doc(db, "trips", id, "notes", noteId);
      await updateDoc(noteDocRef, { pinned: pinState });
    } catch (err) {
      console.error("Failed to toggle pin state:", err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      const noteDocRef = doc(db, "trips", id, "notes", noteId);
      await deleteDoc(noteDocRef);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleOpenAddSheet = () => {
    setEditingNote(null);
    setNoteForm({
      title: "",
      content: "",
      type: "trip",
      day: 1,
      pinned: false,
      tagInput: "",
      tags: []
    });
    setShowSheet(true);
  };

  const handleOpenEditSheet = (note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title || "",
      content: note.content || "",
      type: note.type || "trip",
      day: note.day || 1,
      pinned: note.pinned || false,
      tagInput: "",
      tags: note.tags || []
    });
    setShowSheet(true);
  };

  const handleSaveNote = async () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;

    try {
      setSaving(true);
      const notesColRef = collection(db, "trips", id, "notes");
      const body = {
        title: noteForm.title,
        content: noteForm.content,
        type: noteForm.type,
        day: noteForm.type === "day" ? Number(noteForm.day) : null,
        pinned: noteForm.pinned,
        tags: noteForm.tags,
        updatedAt: serverTimestamp(),
      };

      if (editingNote) {
        const noteDocRef = doc(db, "trips", id, "notes", editingNote._id);
        await updateDoc(noteDocRef, body);
      } else {
        const noteDocRef = doc(notesColRef);
        await setDoc(noteDocRef, {
          ...body,
          createdAt: serverTimestamp(),
        });
      }
      setShowSheet(false);
    } catch (err) {
      console.error("Error saving note:", err);
      alert("Error saving note");
    } finally {
      setSaving(false);
    }
  };

  const handleImportSampleNotes = async () => {
    if (isViewer) return;
    try {
      const sampleTemplates = [
        {
          title: "🏨 Hotel Booking & Check-in",
          content: "Confirmation #TRV-89420. Hotel check-in starts at 2:00 PM. Front desk contact: +66 76 398 100.",
          type: "day",
          day: 1,
          pinned: true,
          tags: ["hotel", "booking"]
        },
        {
          title: "📌 Essential Emergency Contacts",
          content: "Local Embassy: +66 2 205 4000\nTourist Police: 1155\nHotel Concierge: Ext 0",
          type: "trip",
          day: null,
          pinned: true,
          tags: ["emergency", "important"]
        },
        {
          title: "🍲 Recommended Food Spots",
          content: "1. Rayee Street Food Market (Day 2 Dinner)\n2. Blue Elephant Restaurant (Day 3 Lunch)\n3. Local Coconut Shacks along Kata Beach",
          type: "trip",
          day: null,
          pinned: false,
          tags: ["food", "must-try"]
        }
      ];

      for (const tmpl of sampleTemplates) {
        const noteDocRef = doc(collection(db, "trips", id, "notes"));
        await setDoc(noteDocRef, {
          ...tmpl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Failed to import sample notes:", err);
    }
  };

  const handleAddTag = () => {
    const clean = noteForm.tagInput.trim().replace(/^#/, "");
    if (clean && !noteForm.tags.includes(clean)) {
      setNoteForm(prev => ({
        ...prev,
        tags: [...prev.tags, clean],
        tagInput: ""
      }));
    }
  };

  const handleRemoveTag = (tag) => {
    setNoteForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="h-16 skeleton rounded-2xl" />
          <div className="h-12 skeleton rounded-full w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-44 skeleton rounded-2xl" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
        
        {/* ── 1. PROFESSIONAL PAGE HEADER & BREADCRUMBS ────────── */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PageHeader
              title="Trip Notes & Journal"
              subtitle={`Capture ideas, itineraries, and daily thoughts for ${trip?.title || "your trip"}`}
              tripTitle={trip?.title}
              tripId={id}
              actions={
                !isViewer && (
                  <button
                    onClick={handleOpenCreateSheet}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={16} /> New Note
                  </button>
                )
              }
            />
          </div>
        </div>

        {/* ── 2. TWO-COLUMN MAIN CONTENT ────────────────────────── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ── LEFT COLUMN: JOURNAL CONTENT (70% -> col-span-8) ── */}
            <div className="lg:col-span-8 space-y-6">

              {/* MODERN TAB NAVIGATION STRIP */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  <button
                    onClick={() => setFilterDay("all")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      filterDay === "all"
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    All Notes ({notes.length})
                  </button>

                  <button
                    onClick={() => setFilterDay("general")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      filterDay === "general"
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    General Info
                  </button>

                  {Array.from({ length: daysCount }, (_, i) => i + 1).map(day => (
                    <button
                      key={day}
                      onClick={() => setFilterDay(day.toString())}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                        filterDay === day.toString()
                          ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Day {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEARCH & FILTERS CONTROL BAR */}
              <div className="sticky top-20 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Glass Search Bar */}
                  <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus-within:border-teal-500 transition-all">
                    <Search size={18} className="text-teal-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search notes, bookings, #tags..."
                      className="w-full bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Sort Selector */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <ArrowUpDown size={14} className="text-teal-500" />
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="bg-transparent outline-none cursor-pointer text-slate-800 dark:text-white"
                      >
                        <option value="pinned">Pinned First</option>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                    </div>

                    {/* View Switcher Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg text-xs font-bold transition-all ${
                          viewMode === "grid" ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs" : "text-slate-400"
                        }`}
                        title="Grid View"
                      >
                        <StickyNote size={16} />
                      </button>
                      <button
                        onClick={() => setViewMode("journal")}
                        className={`p-2 rounded-lg text-xs font-bold transition-all ${
                          viewMode === "journal" ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs" : "text-slate-400"
                        }`}
                        title="Timeline Journal View"
                      >
                        <BookOpen size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tag Filter Chips Row */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 overflow-x-auto hide-scrollbar">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Tag size={12} /> Filter Tag:
                    </span>
                    <button
                      onClick={() => setSelectedTag("all")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        selectedTag === "all" ? "bg-teal-500 border-teal-500 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      All Tags
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          selectedTag === tag ? "bg-teal-500 border-teal-500 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── NOTES DISPLAY AREA ───────────────────────────── */}
              {notes.length === 0 ? (
                /* EMPTY STATE REDESIGN */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-5 shadow-sm"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 text-teal-500 flex items-center justify-center text-4xl mx-auto ring-8 ring-teal-500/10">
                    📖
                  </div>
                  
                  <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      No notes yet
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      Start documenting your journey by adding travel memories, hotel bookings, expenses, restaurant visits, and day activities.
                    </p>
                  </div>

                  {!isViewer && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleOpenAddSheet}
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs px-6 py-3 rounded-full hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30 transition-all flex items-center gap-2"
                      >
                        <Plus size={16} /> Add First Note
                      </button>

                      <button
                        onClick={handleImportSampleNotes}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs px-6 py-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                      >
                        <FilePlus size={16} /> Import Sample Templates
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : filtered.length === 0 ? (
                /* NO SEARCH MATCH STATE */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Search size={24} />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200">No matching notes</h4>
                  <p className="text-xs text-slate-400">Try adjusting your search query or day/tag filters.</p>
                </div>
              ) : viewMode === "grid" ? (
                /* GRID CARDS VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <AnimatePresence>
                    {filtered.map((note, i) => (
                      <NoteCard
                        key={note._id}
                        note={note}
                        index={i}
                        onPin={handlePinNote}
                        onDelete={handleDeleteNote}
                        onEdit={handleOpenEditSheet}
                        isViewer={isViewer}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                /* JOURNAL TIMELINE VIEW */
                <div className="relative pl-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
                  <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-teal-500/20" />

                  {Object.keys(journalGroups).map((dayGroup) => (
                    <div key={dayGroup} className="space-y-4 relative">
                      <div className="flex items-center gap-3 -ml-8">
                        <div className="w-4 h-4 rounded-full bg-teal-500 border-4 border-white dark:border-slate-900 shadow-md" />
                        <span className="text-xs font-black text-white bg-teal-600 px-3 py-1 rounded-full shadow-sm">
                          {dayGroup}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 pl-4">
                        {journalGroups[dayGroup].map((note) => (
                          <div
                            key={note._id}
                            onClick={() => handleOpenEditSheet(note)}
                            className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 hover:border-teal-500 transition-colors cursor-pointer relative group shadow-xs"
                          >
                            <div className="pr-12 space-y-1.5">
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                {note.title}
                                {note.pinned && <Pin size={12} className="text-violet-500 fill-violet-500" />}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                                {note.content}
                              </p>
                              {note.tags && (
                                <div className="flex gap-1.5 pt-1">
                                  {note.tags.map(t => (
                                    <span key={t} className="text-[10px] font-bold text-teal-600 dark:text-teal-400">#{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {!isViewer && (
                              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePinNote(note._id, !note.pinned); }}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-violet-500"
                                >
                                  <Pin size={12} className={note.pinned ? "text-violet-500 fill-violet-500" : ""} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteNote(note._id); }}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* ── RIGHT COLUMN: STICKY TRIP SUMMARY CARD (30% -> col-span-4) ── */}
            <div className="lg:col-span-4 sticky top-20 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass size={18} className="text-teal-500" />
                    <span>Trip Summary</span>
                  </h3>
                  <span className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 text-xs font-extrabold">
                    {daysCount} Days
                  </span>
                </div>

                {/* Trip Photo Preview */}
                <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                    alt="Destination"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Active Trip</p>
                    <p className="font-black text-base leading-tight truncate">{trip?.title || "Phuket Trip"}</p>
                    <p className="text-xs text-slate-300 font-medium">{trip?.destination || "Phuket, Thailand"}</p>
                  </div>
                </div>

                {/* Trip Metadata Stats */}
                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-2">
                      <Calendar size={14} className="text-teal-500" /> Duration
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {trip?.startDate && trip?.endDate ? `${trip.startDate} → ${trip.endDate}` : `${daysCount} Days`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-2">
                      <DollarSign size={14} className="text-emerald-500" /> Budget
                    </span>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400">
                      ₹{Number(trip?.budget || 35000).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-2">
                      <Users size={14} className="text-amber-500" /> Travelers
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {trip?.travelers || 1} Person
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-2">
                      <StickyNote size={14} className="text-violet-500" /> Notes Logged
                    </span>
                    <span className="font-extrabold text-violet-600 dark:text-violet-400">
                      {notes.length} Notes
                    </span>
                  </div>
                </div>

                {/* Quick Action Navigation Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Quick Actions</p>
                  <button
                    onClick={() => navigate(`/build-itinerary/${id}`)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-slate-700 dark:text-slate-300 hover:text-teal-600 text-xs font-bold transition-colors flex items-center justify-between"
                  >
                    <span>🗺️ View Full Day Itinerary</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate(`/packing-checklist/${id}`)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-slate-700 dark:text-slate-300 hover:text-teal-600 text-xs font-bold transition-colors flex items-center justify-between"
                  >
                    <span>🧳 Packing Checklist</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate(`/trip-budget/${id}`)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-slate-700 dark:text-slate-300 hover:text-teal-600 text-xs font-bold transition-colors flex items-center justify-between"
                  >
                    <span>💳 Expense Tracker</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </main>

        {/* ── 3. DESKTOP FIXED ACTION PANEL (Replacing Android FAB) ── */}
        {!isViewer && (
          <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
            <AnimatePresence>
              {actionMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.9 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-2xl space-y-1 w-44"
                >
                  <button
                    onClick={() => { setActionMenuOpen(false); handleOpenAddSheet(); }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/40 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-teal-600 flex items-center gap-2 transition-colors"
                  >
                    <Plus size={14} className="text-teal-500" /> New Note
                  </button>
                  <button
                    onClick={() => { setActionMenuOpen(false); handleImportSampleNotes(); }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/40 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-teal-600 flex items-center gap-2 transition-colors"
                  >
                    <FilePlus size={14} className="text-teal-500" /> Templates
                  </button>
                  <button
                    onClick={() => { setActionMenuOpen(false); alert("Voice note feature coming soon!"); }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/40 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-teal-600 flex items-center gap-2 transition-colors"
                  >
                    <Mic size={14} className="text-teal-500" /> Voice Note
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 shadow-md hover:scale-105 transition-transform"
                title="Quick Actions Menu"
              >
                {actionMenuOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>

              <button
                onClick={handleOpenAddSheet}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-sm px-6 py-3.5 rounded-full hover:scale-105 active:scale-95 shadow-xl shadow-teal-500/30 transition-all flex items-center gap-2"
              >
                <Plus size={18} /> <span>New Note</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 4. ADD/EDIT NOTE MODAL / DIALOG ──────────────────── */}
        <AnimatePresence>
          {showSheet && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSheet(false)}
                className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm"
              />
              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999] w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit3 size={18} className="text-teal-500" />
                    <span>{editingNote ? "Edit Note" : "Create New Note"}</span>
                  </h3>
                  <button
                    onClick={() => setShowSheet(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
                    <input
                      type="text"
                      value={noteForm.title}
                      onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="E.g. Flight details, Hotel reservation, Packing ideas..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-teal-500 transition-colors"
                      disabled={isViewer}
                    />
                  </div>

                  {/* Type & Day Select */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
                      <select
                        value={noteForm.type}
                        onChange={e => setNoteForm(p => ({ ...p, type: e.target.value }))}
                        className="w-full px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-teal-500"
                        disabled={isViewer}
                      >
                        <option value="trip">General Info</option>
                        <option value="day">Day Specific</option>
                      </select>
                    </div>

                    {noteForm.type === "day" && (
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Assign to Day</label>
                        <select
                          value={noteForm.day}
                          onChange={e => setNoteForm(p => ({ ...p, day: e.target.value }))}
                          className="w-full px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-teal-500"
                          disabled={isViewer}
                        >
                          {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                            <option key={d} value={d}>Day {d}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Note Content</label>
                    <textarea
                      value={noteForm.content}
                      onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))}
                      placeholder="Write your thoughts, memory details, or instructions..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-teal-500 transition-colors resize-none leading-relaxed"
                      disabled={isViewer}
                    />
                  </div>

                  {/* Tags Input */}
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Tags</label>
                    {!isViewer && (
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={noteForm.tagInput}
                          onChange={e => setNoteForm(p => ({ ...p, tagInput: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                          placeholder="Add tag (e.g. hotel, food, flight)"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-4 rounded-xl bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1.5">
                      {noteForm.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 px-2.5 py-1 rounded-lg"
                        >
                          #{tag}
                          {!isViewer && (
                            <button type="button" onClick={() => handleRemoveTag(tag)} className="text-teal-400 hover:text-teal-600">
                              <X size={10} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pin Checkbox */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noteForm.pinned}
                      onChange={e => setNoteForm(p => ({ ...p, pinned: e.target.checked }))}
                      className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                      disabled={isViewer}
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Pin size={14} className="text-violet-500 fill-violet-500" />
                      Pin this note to the top
                    </span>
                  </label>

                  {/* Save CTA */}
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      disabled={!noteForm.title.trim() || !noteForm.content.trim() || saving}
                      className="w-full py-3.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-500/30 hover:scale-102 active:scale-98 transition-all disabled:opacity-50 mt-2"
                    >
                      {saving ? "Saving Changes..." : "Save Note"}
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </MainLayout>
  );
};

export default TripNotes;